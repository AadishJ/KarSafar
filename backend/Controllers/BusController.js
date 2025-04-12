import { pool } from '../Config/ConnectDB.js';
import { v4 as uuidv4 } from 'uuid';

async function handleBusListGet( req, res ) {
    try {
        // Extract query parameters for filtering
        const { source, destination, departureDate, busType } = req.query;

        // Base query to get buses with their details
        let query = `
            SELECT 
                HEX(b.vehicleId) as busId, 
                b.busName as name,
                b.photo,
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
                        vc2.vehicleId = b.vehicleId
                ) as availableSeats,
                (
                    SELECT 
                        JSON_OBJECTAGG(vc3.coachType, vc3.price) 
                    FROM 
                        vehiclecoaches vc3 
                    WHERE 
                        vc3.vehicleId = b.vehicleId
                ) as price,
                (
                    SELECT 
                        GROUP_CONCAT(DISTINCT vc4.coachType) 
                    FROM 
                        vehiclecoaches vc4 
                    WHERE 
                        vc4.vehicleId = b.vehicleId
                ) as busTypes
            FROM 
                buses b
            JOIN 
                vehicles v ON b.vehicleId = v.vehicleId
            JOIN 
                vehiclestations source ON b.vehicleId = source.vehicleId
            JOIN 
                vehiclestations destination ON b.vehicleId = destination.vehicleId
            LEFT JOIN
                vehiclecoaches vc ON b.vehicleId = vc.vehicleId
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

        if ( busType ) {
            query += " AND EXISTS (SELECT 1 FROM vehiclecoaches vc5 WHERE vc5.vehicleId = b.vehicleId AND vc5.coachType = ?)";
            params.push( busType );
        }

        // Group by to avoid duplicates and for price aggregation
        query += " GROUP BY b.vehicleId, source.stationName, destination.stationName, source.departureTime, destination.arrivalTime, b.busName, b.photo, v.availableSeats, v.status";

        // Execute the query
        const [ buses ] = await pool.execute( query, params );

        // Process bus data
        const processedBuses = buses.map( bus => {
            // Parse JSON strings to objects if they're returned as strings
            let availableSeatsObj = bus.availableSeats;
            let priceObj = bus.price;

            if ( typeof availableSeatsObj === 'string' ) {
                availableSeatsObj = JSON.parse( availableSeatsObj );
            }

            if ( typeof priceObj === 'string' ) {
                priceObj = JSON.parse( priceObj );
            }

            // Calculate duration and determine if it's an overnight journey
            const duration = calculateDuration( bus.departureTime, bus.arrivalTime );
            const departureHour = new Date( bus.departureTime ).getHours();
            const arrivalHour = new Date( bus.arrivalTime ).getHours();
            const isOvernight = duration.hours >= 6 &&
                ( departureHour >= 18 || arrivalHour <= 8 );

            // Calculate distance based on journey duration (assuming 50 km/h average speed for buses)
            const distanceKm = Math.round( duration.hours * 50 + duration.minutes / 60 * 50 );

            // Determine bus type names
            const busTypes = bus.busTypes ? bus.busTypes.split( ',' ) : [];
            const typeName = getBusTypeName( busTypes[ 0 ] || '' );

            // Define amenities based on bus type
            const amenities = determineAmenities( busTypes[ 0 ] || '' );

            return {
                id: bus.busId,
                name: bus.busName,
                photo: bus.photo,
                type: busTypes[ 0 ] || '',
                typeName: typeName,
                origin: bus.source,
                destination: bus.destination,
                departureTime: bus.departureTime,
                arrivalTime: bus.arrivalTime,
                duration: duration,
                distance: `${ distanceKm } km`,
                availableSeats: bus.availableSeats,
                totalSeats: v.availableSeats,
                price: bus.basePrice,
                amenities: amenities,
                isOvernight: isOvernight,
                status: bus.status
            };
        } );

        res.status( 200 ).json( {
            success: true,
            count: processedBuses.length,
            data: processedBuses
        } );
    } catch ( error ) {
        console.error( 'Error fetching buses:', error );
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

// Helper function to get friendly bus type name
function getBusTypeName( busType ) {
    const typeMap = {
        'AC_SLEEPER': 'AC Sleeper',
        'NON_AC_SLEEPER': 'Non-AC Sleeper',
        'AC_SEATER': 'AC Seater',
        'NON_AC_SEATER': 'Non-AC Seater',
        'VOLVO': 'Volvo Multi-Axle',
        'DELUXE': 'Deluxe',
        'SEMI_SLEEPER': 'Semi Sleeper',
        'LUXURY': 'Luxury'
    };
    return typeMap[ busType ] || busType;
}

// Helper function to determine amenities based on bus type
function determineAmenities( busType ) {
    const baseAmenities = [ "Water Bottle", "Charging Point" ];

    switch ( busType ) {
        case 'AC_SLEEPER':
            return [ ...baseAmenities, "WiFi", "Blanket", "Reading Light", "AC" ];
        case 'NON_AC_SLEEPER':
            return [ ...baseAmenities, "Blanket", "Reading Light" ];
        case 'AC_SEATER':
            return [ ...baseAmenities, "WiFi", "AC", "Reclining Seats" ];
        case 'VOLVO':
            return [ ...baseAmenities, "WiFi", "AC", "Entertainment System", "Snacks", "Premium Seats" ];
        case 'LUXURY':
            return [ ...baseAmenities, "WiFi", "AC", "Entertainment System", "Snacks", "Premium Seats", "Washroom" ];
        default:
            return baseAmenities;
    }
}

// Function to get detailed information about a specific bus
async function handleBusDetailGet( req, res ) {
    try {
        const { busId } = req.params;

        if ( !busId ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Bus ID is required'
            } );
        }

        // Query to get bus details
        const [ busDetails ] = await pool.execute(
            `SELECT 
                HEX(b.vehicleId) as busId, 
                b.busName as name,
                b.photo,
                v.availableSeats as totalSeats,
                v.status
            FROM 
                buses b
            JOIN 
                vehicles v ON b.vehicleId = v.vehicleId
            WHERE 
                b.vehicleId = UNHEX(?)`,
            [ busId ]
        );

        if ( busDetails.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Bus not found'
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
            [ busId ]
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
            [ busId ]
        );

        // Query to get driver information
        const [ drivers ] = await pool.execute(
            `SELECT 
                HEX(driverId) as driverId,
                driverName,
                driverPhoneNo
            FROM 
                vehicleDrivers
            WHERE 
                vehicleId = UNHEX(?)`,
            [ busId ]
        );

        // Query to get seat layout
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
            [ busId ]
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
            const distanceKm = Math.round( duration.hours * 50 + duration.minutes / 60 * 50 );

            processedRoute.push( {
                from: source.stationName,
                to: destination.stationName,
                departureTime: source.departureTime,
                arrivalTime: destination.arrivalTime,
                duration,
                distance: `${ distanceKm } km`
            } );
        }

        // Calculate full journey duration and determine if overnight
        if ( stations.length >= 2 ) {
            const firstStation = stations[ 0 ];
            const lastStation = stations[ stations.length - 1 ];
            const duration = calculateDuration( firstStation.departureTime, lastStation.arrivalTime );
            const departureHour = new Date( firstStation.departureTime ).getHours();
            const arrivalHour = new Date( lastStation.arrivalTime ).getHours();
            const isOvernight = duration.hours >= 6 &&
                ( departureHour >= 18 || arrivalHour <= 8 );

            busDetails[ 0 ].duration = duration;
            busDetails[ 0 ].isOvernight = isOvernight;
        }

        // Get bus type from coaches
        if ( coaches.length > 0 ) {
            busDetails[ 0 ].type = coaches[ 0 ].coachType;
            busDetails[ 0 ].typeName = getBusTypeName( coaches[ 0 ].coachType );
            busDetails[ 0 ].amenities = determineAmenities( coaches[ 0 ].coachType );
        }

        // Combine all data
        const busData = {
            ...busDetails[ 0 ],
            route: stations,
            journeySegments: processedRoute,
            coaches: coaches,
            seats: seatsByCoach,
            drivers: drivers
        };

        res.status( 200 ).json( {
            success: true,
            data: busData
        } );

    } catch ( error ) {
        console.error( 'Error fetching bus details:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

// Function to create a new bus (for admin use)
async function handleBusCreate( req, res ) {
    try {
        // Start a transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const {
                busName,
                photo,
                totalSeats,
                busType,
                price,
                drivers,
                stations
            } = req.body;

            // Validate required fields
            if ( !busName || !totalSeats || !busType || !price || !stations || !stations.length ) {
                await connection.rollback();
                connection.release();
                return res.status( 400 ).json( {
                    success: false,
                    message: 'Missing required bus information'
                } );
            }

            // Create a new vehicle ID
            const vehicleId = uuidv4().replace( /-/g, '' );

            // Insert the vehicle record
            await connection.execute(
                `INSERT INTO vehicles (vehicleId, vehicleType, status, availableSeats) 
                 VALUES (UNHEX(?), 'bus', 'active', ?)`,
                [ vehicleId, totalSeats ]
            );

            // Insert the bus record
            await connection.execute(
                `INSERT INTO buses (vehicleId, busName, photo) 
                 VALUES (UNHEX(?), ?, ?)`,
                [ vehicleId, busName, photo || null ]
            );

            // Insert coach type (bus type)
            const coachId = `${ busType.substring( 0, 2 ) }01`;
            await connection.execute(
                `INSERT INTO vehiclecoaches (coachId, vehicleId, coachType, seatsAvailable, price) 
                 VALUES (?, UNHEX(?), ?, ?, ?)`,
                [ coachId, vehicleId, busType, totalSeats, price ]
            );

            // Insert drivers if provided
            if ( drivers && drivers.length > 0 ) {
                for ( const driver of drivers ) {
                    const driverId = uuidv4().replace( /-/g, '' );
                    await connection.execute(
                        `INSERT INTO vehicleDrivers (driverId, vehicleId, driverName, driverPhoneNo) 
                         VALUES (UNHEX(?), UNHEX(?), ?, ?)`,
                        [ driverId, vehicleId, driver.name, driver.phoneNo ]
                    );
                }
            }

            // Insert seats
            for ( let i = 1; i <= totalSeats; i++ ) {
                const seatId = uuidv4().replace( /-/g, '' );
                const seatNumber = i.toString().padStart( 2, '0' );
                await connection.execute(
                    `INSERT INTO seats (seatId, vehicleId, coachId, seatNumber) 
                     VALUES (UNHEX(?), UNHEX(?), ?, ?)`,
                    [ seatId, vehicleId, coachId, seatNumber ]
                );
            }

            // Insert stations (route)
            for ( const [ index, station ] of stations.entries() ) {
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
                message: 'Bus created successfully',
                data: {
                    busId: vehicleId,
                    name: busName
                }
            } );

        } catch ( error ) {
            // Rollback in case of error
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch ( error ) {
        console.error( 'Error creating bus:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

export { handleBusListGet, handleBusDetailGet, handleBusCreate };