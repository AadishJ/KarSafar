import { pool } from '../Config/ConnectDB.js';
import { v4 as uuidv4 } from 'uuid';

async function handleTrainListGet( req, res ) {
    try {
        // Extract query parameters (for filtering)
        const { source, destination, departureDate, travelClass } = req.query;

        // Base query to get trains with their details
        let query = `
            SELECT 
                HEX(t.vehicleId) as trainId, 
                t.trainName as name,
                v.availableSeats,
                v.status,
                source.stationName as source, 
                source.departureTime as departureTime,
                destination.stationName as destination,
                destination.arrivalTime as arrivalTime,
                MIN(vc.price) as basePrice,
                (
                    SELECT 
                        JSON_OBJECTAGG(vc2.coachType, vc2.seatsAvailable) 
                    FROM 
                        vehiclecoaches vc2 
                    WHERE 
                        vc2.vehicleId = t.vehicleId
                ) as availableSeats,
                (
                    SELECT 
                        JSON_OBJECTAGG(vc3.coachType, vc3.price) 
                    FROM 
                        vehiclecoaches vc3 
                    WHERE 
                        vc3.vehicleId = t.vehicleId
                ) as price
            FROM 
                trains t
            JOIN 
                vehicles v ON t.vehicleId = v.vehicleId
            JOIN 
                vehiclestations source ON t.vehicleId = source.vehicleId
            JOIN 
                vehiclestations destination ON t.vehicleId = destination.vehicleId
            LEFT JOIN
                vehiclecoaches vc ON t.vehicleId = vc.vehicleId
            WHERE 
                source.stationOrder < destination.stationOrder
                AND v.status = 'active'
        `;

        // Add parameters for filtering
        const params = [];

        if ( source ) {
            query += " AND source.stationName LIKE ?";
            params.push( `%${ source }%` );
        }

        if ( destination ) {
            query += " AND destination.stationName LIKE ?";
            params.push( `%${ destination }%` );
        }

        if ( departureDate ) {
            // Convert to date format and filter by date part
            query += " AND DATE(source.departureTime) = DATE(?)";
            params.push( departureDate );
        }

        if ( travelClass ) {
            query += " AND EXISTS (SELECT 1 FROM vehiclecoaches vc4 WHERE vc4.vehicleId = t.vehicleId AND vc4.coachType = ?)";
            params.push( travelClass );
        }

        // Group by to avoid duplicates and for price aggregation
        query += " GROUP BY t.vehicleId, source.stationName, destination.stationName, source.departureTime, destination.arrivalTime, t.trainName, v.availableSeats, v.status";

        // Execute the query
        const [ trains ] = await pool.execute( query, params );

        // Process train data
        const processedTrains = trains.map( train => {
            // Parse JSON strings to objects if they're returned as strings
            let availableSeatsObj = train.availableSeats;
            let priceObj = train.price;

            if ( typeof availableSeatsObj === 'string' ) {
                availableSeatsObj = JSON.parse( availableSeatsObj );
            }

            if ( typeof priceObj === 'string' ) {
                priceObj = JSON.parse( priceObj );
            }

            // Calculate distance based on journey duration (assuming 60 km/h average speed)
            const duration = calculateDuration( train.departureTime, train.arrivalTime );
            const distanceKm = Math.round( duration.hours * 60 + duration.minutes );

            return {
                id: train.trainId,
                name: train.name,
                number: generateTrainNumber( train.trainId ), // Generate a train number for display
                status: train.status,
                source: train.source,
                destination: train.destination,
                departureTime: train.departureTime,
                arrivalTime: train.arrivalTime,
                duration: duration,
                distance: `${ distanceKm } km`,
                availableSeats: availableSeatsObj || {},
                price: priceObj || {},
                basePrice: train.basePrice
            };
        } );

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

// Helper function to calculate journey duration
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

// Helper function to generate a consistent train number using the first 5 characters of the ID
function generateTrainNumber( trainId ) {
    if ( !trainId ) return '';
    // Take the first 5 characters of the ID and format as a train number
    return trainId.toString().substring( 0, 5 ).toUpperCase();
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
                t.trainName as name,
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

        // Query to get all stations (route)
        const [ stations ] = await pool.execute(
            `SELECT 
                stationName,
                arrivalTime,
                departureTime,
                stoppage,
                stationOrder
            FROM 
                vehiclestations
            WHERE 
                vehicleId = UNHEX(?)
            ORDER BY 
                stationOrder`,
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

        // Query to get available seats for each coach
        const [ seats ] = await pool.execute(
            `SELECT 
                HEX(s.seatId) as seatId,
                s.coachId,
                s.seatNumber
            FROM 
                seats s
            WHERE 
                s.vehicleId = UNHEX(?)
            ORDER BY
                s.coachId, s.seatNumber`,
            [ trainId ]
        );

        // Group seats by coach for easier frontend processing
        const seatsByCoach = seats.reduce( ( acc, seat ) => {
            if ( !acc[ seat.coachId ] ) {
                acc[ seat.coachId ] = [];
            }
            acc[ seat.coachId ].push( {
                id: seat.seatId,
                number: seat.seatNumber
            } );
            return acc;
        }, {} );

        // Process route to include journey segments with duration and distance
        const processedRoute = [];
        for ( let i = 0; i < stations.length - 1; i++ ) {
            const source = stations[ i ];
            const destination = stations[ i + 1 ];
            const duration = calculateDuration( source.departureTime, destination.arrivalTime );
            const distanceKm = Math.round( duration.hours * 60 + duration.minutes );

            processedRoute.push( {
                from: source.stationName,
                to: destination.stationName,
                departureTime: source.departureTime,
                arrivalTime: destination.arrivalTime,
                duration,
                distance: `${ distanceKm } km`
            } );
        }

        // Combine all data
        const trainData = {
            ...trainDetails[ 0 ],
            number: generateTrainNumber( trainDetails[ 0 ].trainId ),
            route: stations,
            journeySegments: processedRoute,
            coaches: coaches,
            seats: seatsByCoach
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

// Function to create a new train (for admin use)
async function handleTrainCreate( req, res ) {
    try {
        // Start a transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const {
                trainName,
                totalSeats,
                coaches,
                stations
            } = req.body;

            // Validate required fields
            if ( !trainName || !totalSeats || !coaches || !coaches.length || !stations || !stations.length ) {
                await connection.rollback();
                connection.release();
                return res.status( 400 ).json( {
                    success: false,
                    message: 'Missing required train information'
                } );
            }

            // Create a new vehicle ID
            const vehicleId = uuidv4().replace( /-/g, '' );

            // Insert the vehicle record
            await connection.execute(
                `INSERT INTO vehicles (vehicleId, vehicleType, status, availableSeats) 
                 VALUES (UNHEX(?), 'train', 'active', ?)`,
                [ vehicleId, totalSeats ]
            );

            // Insert the train record
            await connection.execute(
                `INSERT INTO trains (vehicleId, trainName) 
                 VALUES (UNHEX(?), ?)`,
                [ vehicleId, trainName ]
            );

            // Insert coach types
            for ( const coach of coaches ) {
                // Validate coach data
                if ( !coach.coachId || !coach.coachType || !coach.seatsAvailable || !coach.price ) {
                    throw new Error( 'Invalid coach data' );
                }

                await connection.execute(
                    `INSERT INTO vehiclecoaches (coachId, vehicleId, coachType, seatsAvailable, price) 
                     VALUES (?, UNHEX(?), ?, ?, ?)`,
                    [ coach.coachId, vehicleId, coach.coachType, coach.seatsAvailable, coach.price ]
                );

                // Insert seats for this coach if provided
                if ( coach.seats && coach.seats.length > 0 ) {
                    for ( const seatNumber of coach.seats ) {
                        const seatId = uuidv4().replace( /-/g, '' );
                        await connection.execute(
                            `INSERT INTO seats (seatId, vehicleId, coachId, seatNumber) 
                             VALUES (UNHEX(?), UNHEX(?), ?, ?)`,
                            [ seatId, vehicleId, coach.coachId, seatNumber ]
                        );
                    }
                }
            }

            // Insert stations (route)
            for ( const [ index, station ] of stations.entries() ) {
                // Validate station data
                if ( !station.stationName || !station.departureTime ) {
                    throw new Error( 'Invalid station data' );
                }

                const stationId = uuidv4().replace( /-/g, '' );
                await connection.execute(
                    `INSERT INTO vehiclestations 
                     (stationId, vehicleId, stationName, arrivalTime, departureTime, stoppage, stationOrder) 
                     VALUES (UNHEX(?), UNHEX(?), ?, ?, ?, ?, ?)`,
                    [
                        stationId,
                        vehicleId,
                        station.stationName,
                        station.arrivalTime || station.departureTime, // First station might not have arrival
                        station.departureTime,
                        station.stoppage || 0,
                        index + 1
                    ]
                );
            }

            // Commit the transaction
            await connection.commit();
            connection.release();

            res.status( 201 ).json( {
                success: true,
                message: 'Train created successfully',
                data: {
                    trainId: vehicleId,
                    name: trainName
                }
            } );

        } catch ( error ) {
            // Rollback in case of error
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch ( error ) {
        console.error( 'Error creating train:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

export { handleTrainListGet, handleTrainDetailGet, handleTrainCreate };