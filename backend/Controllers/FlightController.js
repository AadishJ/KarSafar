import { pool } from '../Config/ConnectDB.js';
import { v4 as uuidv4 } from 'uuid';

async function handleFlightListGet( req, res ) {
    try {
        // Extract query parameters (for filtering)
        const { origin, destination, departureDate, returnDate } = req.query;

        // Base query to get flights with their details
        let query = `
            SELECT 
                HEX(f.vehicleId) as flightId, 
                f.flightName,
                v.availableSeats,
                v.status,
                origin_station.stationName as originStation, 
                origin_vs.departureTime as departureTime,
                dest_station.stationName as destinationStation,
                dest_vs.arrivalTime as arrivalTime,
                MIN(vc.price) as basePrice
            FROM 
                flights f
            JOIN 
                vehicles v ON f.vehicleId = v.vehicleId
            JOIN 
                vehiclestations origin_vs ON f.vehicleId = origin_vs.vehicleId
            JOIN 
                stations origin_station ON origin_vs.stationId = origin_station.stationId
            JOIN 
                vehiclestations dest_vs ON f.vehicleId = dest_vs.vehicleId
            JOIN 
                stations dest_station ON dest_vs.stationId = dest_station.stationId
            LEFT JOIN
                vehiclecoaches vc ON f.vehicleId = vc.vehicleId
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
        query += ` GROUP BY 
            f.vehicleId, 
            origin_station.stationName, 
            dest_station.stationName, 
            origin_vs.departureTime, 
            dest_vs.arrivalTime, 
            f.flightName, 
            v.availableSeats, 
            v.status`;

        // Execute the query
        const [ flights ] = await pool.execute( query, params );

        // Process flight data
        const processedFlights = flights.map( flight => ( {
            id: flight.flightId,
            name: flight.flightName,
            availableSeats: flight.availableSeats,
            status: flight.status,
            origin: flight.originStation,
            destination: flight.destinationStation,
            departureTime: flight.departureTime,
            arrivalTime: flight.arrivalTime,
            duration: calculateDuration( flight.departureTime, flight.arrivalTime ),
            basePrice: flight.basePrice
        } ) );

        res.status( 200 ).json( {
            success: true,
            count: processedFlights.length,
            data: processedFlights
        } );
    } catch ( error ) {
        console.error( 'Error fetching flights:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

// Helper function to calculate flight duration
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

// Function to get detailed information about a specific flight
async function handleFlightDetailGet( req, res ) {
    try {
        const { flightId } = req.params;

        if ( !flightId ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Flight ID is required'
            } );
        }

        // Query to get flight details
        const [ flightDetails ] = await pool.execute(
            `SELECT 
                HEX(f.vehicleId) as flightId, 
                f.flightName,
                v.availableSeats,
                v.status
            FROM 
                flights f
            JOIN 
                vehicles v ON f.vehicleId = v.vehicleId
            WHERE 
                f.vehicleId = UNHEX(?)`,
            [ flightId ]
        );

        if ( flightDetails.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Flight not found'
            } );
        }

        // Query to get all stations (route) - joining with stations table
        const [ stations ] = await pool.execute(
            `SELECT 
                s.stationName,
                vs.arrivalTime,
                vs.departureTime,
                vs.stoppage,
                vs.stationOrder
            FROM 
                vehiclestations vs
            JOIN
                stations s ON vs.stationId = s.stationId
            WHERE 
                vs.vehicleId = UNHEX(?)
            ORDER BY 
                vs.stationOrder`,
            [ flightId ]
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
            [ flightId ]
        );

        // Combine all data
        const flightData = {
            ...flightDetails[ 0 ],
            route: stations,
            coaches: coaches,
        };

        res.status( 200 ).json( {
            success: true,
            data: flightData
        } );

    } catch ( error ) {
        console.error( 'Error fetching flight details:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

async function handleFlightsSeatGet( req, res ) {
    try {
        const { flightId } = req.params;
        const { coachId } = req.query;

        if ( !flightId ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Flight ID is required'
            } );
        }

        if ( !coachId ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Coach ID is required'
            } );
        }

        // First verify the flight exists and is active
        const [ flightRows ] = await pool.execute(
            `SELECT 
                v.vehicleId, 
                v.status
            FROM 
                vehicles v
            JOIN 
                flights f ON v.vehicleId = f.vehicleId
            WHERE 
                v.vehicleId = UNHEX(?) 
                AND v.vehicleType = 'flight'`,
            [ flightId ]
        );

        if ( flightRows.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Flight not found'
            } );
        }

        if ( flightRows[ 0 ].status !== 'active' ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'This flight is not active'
            } );
        }

        // Verify the coach exists for this flight
        const [ coachRows ] = await pool.execute(
            `SELECT 
                vc.coachId, 
                vc.coachType, 
                vc.seatsAvailable
            FROM 
                vehiclecoaches vc
            WHERE 
                vc.vehicleId = UNHEX(?) AND vc.coachId = ?`,
            [ flightId, coachId ]
        );

        if ( coachRows.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Coach not found for this flight'
            } );
        }

        // Get all seats that are available for this flight and coach
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
            [ flightId, coachId, flightId ]
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
        console.error( 'Error fetching flight seats:', error );
        return res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

export { handleFlightListGet, handleFlightDetailGet, handleFlightsSeatGet };