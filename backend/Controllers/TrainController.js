import { pool } from '../Config/ConnectDB.js';
import { v4 as uuidv4 } from 'uuid';

async function handleTrainListGet( req, res ) {
    try {
        // Extract query parameters (for filtering)
        const { origin, destination, departureDate, returnDate } = req.query;

        // Base query to get trains with their details - updated for normalized stations table
        let query = `
            SELECT 
                HEX(t.vehicleId) as trainId, 
                t.trainName,
                v.availableSeats,
                v.status,
                origin_station.stationName as originStation, 
                origin_vs.departureTime as departureTime,
                dest_station.stationName as destinationStation,
                dest_vs.arrivalTime as arrivalTime,
                MIN(vc.price) as basePrice
            FROM 
                trains t
            JOIN 
                vehicles v ON t.vehicleId = v.vehicleId
            JOIN 
                vehiclestations origin_vs ON t.vehicleId = origin_vs.vehicleId
            JOIN 
                stations origin_station ON origin_vs.stationId = origin_station.stationId
            JOIN 
                vehiclestations dest_vs ON t.vehicleId = dest_vs.vehicleId
            JOIN 
                stations dest_station ON dest_vs.stationId = dest_station.stationId
            LEFT JOIN
                vehiclecoaches vc ON t.vehicleId = vc.vehicleId
            WHERE 
                origin_vs.stationOrder < dest_vs.stationOrder
                AND v.status = 'active'
        `;

        // Add parameters for filtering
        const params = [];

        if ( origin ) {
            query += " AND origin_station.stationName LIKE ?";
            params.push( `%${ origin }%` );
        }

        if ( destination ) {
            query += " AND dest_station.stationName LIKE ?";
            params.push( `%${ destination }%` );
        }

        if ( departureDate ) {
            // Convert to date format and filter by date part
            query += " AND DATE(origin_vs.departureTime) = DATE(?)";
            params.push( departureDate );
        }

        // Group by to avoid duplicates and for price aggregation
        query += " GROUP BY t.vehicleId, origin_station.stationName, dest_station.stationName, origin_vs.departureTime, dest_vs.arrivalTime, t.trainName, v.availableSeats, v.status";

        // Execute the query
        const [ trains ] = await pool.execute( query, params );

        // Process train data
        const processedTrains = trains.map( train => ( {
            id: train.trainId,
            name: train.trainName,
            availableSeats: train.availableSeats,
            status: train.status,
            origin: train.originStation,
            destination: train.destinationStation,
            departureTime: train.departureTime,
            arrivalTime: train.arrivalTime,
            duration: calculateDuration( train.departureTime, train.arrivalTime ),
            basePrice: train.basePrice
        } ) );

        res.status( 200 ).json( {
            success: true,
            count: processedTrains.length,
            data: processedTrains
        } );
    } catch ( error ) {
        console.error( 'Error fetching trains:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

// Helper function to calculate train journey duration
function calculateDuration( departure, arrival ) {
    const departureTime = new Date( departure );
    const arrivalTime = new Date( arrival );

    // Duration in milliseconds
    const durationMs = arrivalTime - departureTime;

    // Convert to hours and minutes
    const hours = Math.floor( durationMs / ( 60 * 60 * 1000 ) );
    const minutes = Math.floor( ( durationMs % ( 60 * 60 * 1000 ) ) / ( 60 * 1000 ) );

    return {
        hours,
        minutes,
        display: `${ hours }h ${ minutes }m`
    };
}

// Function to get detailed information about a specific train
async function handleTrainDetailGet( req, res ) {
    try {
        const { trainId } = req.params;

        if ( !trainId ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Train ID is required'
            } );
        }

        // Query to get train details
        const [ trainDetails ] = await pool.execute(
            `SELECT 
                HEX(t.vehicleId) as trainId, 
                t.trainName,
                v.availableSeats,
                v.status
            FROM 
                trains t
            JOIN 
                vehicles v ON t.vehicleId = v.vehicleId
            WHERE 
                t.vehicleId = UNHEX(?)`,
            [ trainId ]
        );

        if ( trainDetails.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Train not found'
            } );
        }

        // Query to get all stations (route) - updated for normalized schema
        const [ stations ] = await pool.execute(
            `SELECT 
                s.stationName,
                vs.arrivalTime,
                vs.departureTime,
                vs.stoppage,
                vs.stationOrder,
                s.city,
                s.state,
                s.country,
                s.latitude,
                s.longitude
            FROM 
                vehiclestations vs
            JOIN
                stations s ON vs.stationId = s.stationId
            WHERE 
                vs.vehicleId = UNHEX(?)
            ORDER BY 
                vs.stationOrder`,
            [ trainId ]
        );

        // Query to get available coach types and prices
        const [ coaches ] = await pool.execute(
            `SELECT 
                coachId,
                coachType,
                seatsAvailable,
                price
            FROM 
                vehiclecoaches
            WHERE 
                vehicleId = UNHEX(?)`,
            [ trainId ]
        );

        // Combine all data
        const trainData = {
            ...trainDetails[ 0 ],
            route: stations,
            coaches: coaches,
        };

        res.status( 200 ).json( {
            success: true,
            data: trainData
        } );

    } catch ( error ) {
        console.error( 'Error fetching train details:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

async function handleTrainSeatGet( req, res ) {
    try {
        const { trainId } = req.params;
        const { coachId } = req.query;

        if ( !trainId ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Train ID is required'
            } );
        }

        if ( !coachId ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Coach ID is required'
            } );
        }

        // First verify the train exists and is active
        const [ trainRows ] = await pool.execute(
            `SELECT 
                v.vehicleId, 
                v.status
            FROM 
                vehicles v
            JOIN 
                trains t ON v.vehicleId = t.vehicleId
            WHERE 
                v.vehicleId = UNHEX(?) 
                AND v.vehicleType = 'train'`,
            [ trainId ]
        );

        if ( trainRows.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Train not found'
            } );
        }

        if ( trainRows[ 0 ].status !== 'active' ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'This train is not active'
            } );
        }

        // Verify the coach exists for this train
        const [ coachRows ] = await pool.execute(
            `SELECT 
                vc.coachId, 
                vc.coachType, 
                vc.seatsAvailable
            FROM 
                vehiclecoaches vc
            WHERE 
                vc.vehicleId = UNHEX(?) AND vc.coachId = ?`,
            [ trainId, coachId ]
        );

        if ( coachRows.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Coach not found for this train'
            } );
        }

        // Get all seats that are available for this train and coach
        const [ seatsRows ] = await pool.execute(
            `SELECT 
                HEX(s.seatId) as seatId,
                s.seatNumber,
                'available' as status
            FROM 
                seats s
            WHERE 
                s.vehicleId = UNHEX(?)
                AND s.coachId = ?
                AND s.seatId NOT IN (
                    -- Exclude seats that are already booked
                    SELECT 
                        ps.seatId
                    FROM 
                        passengerseats ps
                    JOIN 
                        vehiclebookingitems vbi ON ps.vehicleItemId = vbi.vehicleItemId
                    WHERE 
                        vbi.vehicleId = UNHEX(?)
                        AND vbi.status != 'cancelled'
                )`,
            [ trainId, coachId, trainId ]
        );

        // Format the response
        const formattedSeats = seatsRows.map( seat => ( {
            seatId: seat.seatId,
            seatNumber: seat.seatNumber,
            status: seat.status
        } ) );

        return res.status( 200 ).json( {
            success: true,
            message: 'Seats retrieved successfully',
            data: formattedSeats
        } );

    } catch ( error ) {
        console.error( 'Error fetching train seats:', error );
        return res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

export { handleTrainListGet, handleTrainDetailGet, handleTrainSeatGet };