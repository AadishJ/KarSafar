import { pool } from '../Config/ConnectDB.js';
import { v4 as uuidv4 } from 'uuid';

async function handleCabListGet( req, res ) {
    try {
        // Extract query parameters for filtering
        const { source, destination, departureDate, cabType } = req.query;

        // Base query to get cabs with their details
        let query = `
            SELECT 
                HEX(c.vehicleId) as cabId, 
                c.carModel as name,
                c.photo,
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
                        vc2.vehicleId = c.vehicleId
                ) as availableSeats,
                (
                    SELECT 
                        JSON_OBJECTAGG(vc3.coachType, vc3.price) 
                    FROM 
                        vehiclecoaches vc3 
                    WHERE 
                        vc3.vehicleId = c.vehicleId
                ) as price,
                (
                    SELECT 
                        GROUP_CONCAT(DISTINCT vc4.coachType) 
                    FROM 
                        vehiclecoaches vc4 
                    WHERE 
                        vc4.vehicleId = c.vehicleId
                ) as cabTypes
            FROM 
                cabs c
            JOIN 
                vehicles v ON c.vehicleId = v.vehicleId
            JOIN 
                vehiclestations source ON c.vehicleId = source.vehicleId
            JOIN 
                vehiclestations destination ON c.vehicleId = destination.vehicleId
            LEFT JOIN
                vehiclecoaches vc ON c.vehicleId = vc.vehicleId
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

        if ( cabType ) {
            query += " AND EXISTS (SELECT 1 FROM vehiclecoaches vc5 WHERE vc5.vehicleId = c.vehicleId AND vc5.coachType = ?)";
            params.push( cabType );
        }

        // Group by to avoid duplicates and for price aggregation
        query += " GROUP BY c.vehicleId, source.stationName, destination.stationName, source.departureTime, destination.arrivalTime, c.carModel, c.photo, v.availableSeats, v.status";

        // Execute the query
        const [ cabs ] = await pool.execute( query, params );

        // Process cab data
        const processedCabs = cabs.map( cab => {
            // Parse JSON strings to objects if they're returned as strings
            let availableSeatsObj = cab.availableSeats;
            let priceObj = cab.price;

            if ( typeof availableSeatsObj === 'string' ) {
                availableSeatsObj = JSON.parse( availableSeatsObj );
            }

            if ( typeof priceObj === 'string' ) {
                priceObj = JSON.parse( priceObj );
            }

            // Calculate duration and determine estimated arrival
            const duration = calculateDuration( cab.departureTime, cab.arrivalTime );

            // Calculate distance based on journey duration (assuming 60 km/h average speed for cabs in city)
            const distanceKm = Math.round( duration.hours * 60 + duration.minutes / 60 * 60 );

            // Determine cab type names
            const cabTypes = cab.cabTypes ? cab.cabTypes.split( ',' ) : [];
            const typeName = getCabTypeName( cabTypes[ 0 ] || '' );

            // Define amenities based on cab type
            const amenities = determineAmenities( cabTypes[ 0 ] || '' );

            return {
                id: cab.cabId,
                name: cab.carModel,
                photo: cab.photo,
                type: cabTypes[ 0 ] || '',
                typeName: typeName,
                origin: cab.source,
                destination: cab.destination,
                departureTime: cab.departureTime,
                arrivalTime: cab.arrivalTime,
                duration: duration,
                distance: `${ distanceKm } km`,
                availableSeats: cab.availableSeats,
                totalSeats: cab.availableSeats,
                price: cab.basePrice,
                amenities: amenities,
                status: cab.status
            };
        } );

        res.status( 200 ).json( {
            success: true,
            count: processedCabs.length,
            data: processedCabs
        } );
    } catch ( error ) {
        console.error( 'Error fetching cabs:', error );
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

// Helper function to get friendly cab type name
function getCabTypeName( cabType ) {
    const typeMap = {
        'ECONOMY': 'Economy',
        'PREMIUM': 'Premium',
        'LUXURY': 'Luxury',
        'SUV': 'SUV',
        'MINI': 'Mini',
        'SEDAN': 'Sedan',
        'OUTSTATION': 'Outstation',
        'SHARED': 'Shared'
    };
    return typeMap[ cabType ] || cabType;
}

// Helper function to determine amenities based on cab type
function determineAmenities( cabType ) {
    const baseAmenities = {
        "ac": true,
        "waterBottle": true,
        "chargingPoint": true
    };

    switch ( cabType ) {
        case 'ECONOMY':
            return {
                ...baseAmenities
            };
        case 'PREMIUM':
            return {
                ...baseAmenities,
                "wifi": true,
                "musicSystem": true
            };
        case 'LUXURY':
            return {
                ...baseAmenities,
                "wifi": true,
                "musicSystem": true,
                "leatherSeats": true,
                "refreshments": true
            };
        case 'SUV':
            return {
                ...baseAmenities,
                "wifi": true,
                "musicSystem": true,
                "extraLegroom": true
            };
        default:
            return baseAmenities;
    }
}

// Function to get detailed information about a specific cab
async function handleCabDetailGet( req, res ) {
    try {
        const { cabId } = req.params;

        if ( !cabId ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Cab ID is required'
            } );
        }

        // Query to get cab details
        const [ cabDetails ] = await pool.execute(
            `SELECT 
                HEX(c.vehicleId) as cabId, 
                c.carModel as name,
                c.photo,
                v.availableSeats as totalSeats,
                v.status
            FROM 
                cabs c
            JOIN 
                vehicles v ON c.vehicleId = v.vehicleId
            WHERE 
                c.vehicleId = UNHEX(?)`,
            [ cabId ]
        );

        if ( cabDetails.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Cab not found'
            } );
        }

        // Query to get route information (pickup and drop points)
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
            [ cabId ]
        );

        // Query to get available cab types and prices
        const [ cabTypes ] = await pool.execute(
            `SELECT 
                coachId,
                coachType,
                seatsAvailable,
                price
            FROM 
                vehiclecoaches
            WHERE 
                vehicleId = UNHEX(?)`,
            [ cabId ]
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
            [ cabId ]
        );

        // Process route to include journey segments with duration and distance
        const processedRoute = [];
        for ( let i = 0; i < stations.length - 1; i++ ) {
            const source = stations[ i ];
            const destination = stations[ i + 1 ];
            const duration = calculateDuration( source.departureTime, destination.arrivalTime );
            const distanceKm = Math.round( duration.hours * 60 + duration.minutes / 60 * 60 ); // Assuming 60km/h

            processedRoute.push( {
                from: source.stationName,
                to: destination.stationName,
                departureTime: source.departureTime,
                arrivalTime: destination.arrivalTime,
                duration,
                distance: `${ distanceKm } km`
            } );
        }

        // Calculate full journey duration
        if ( stations.length >= 2 ) {
            const firstStation = stations[ 0 ];
            const lastStation = stations[ stations.length - 1 ];
            const duration = calculateDuration( firstStation.departureTime, lastStation.arrivalTime );
            cabDetails[ 0 ].duration = duration;
        }

        // Get cab type and amenities
        if ( cabTypes.length > 0 ) {
            cabDetails[ 0 ].type = cabTypes[ 0 ].coachType;
            cabDetails[ 0 ].typeName = getCabTypeName( cabTypes[ 0 ].coachType );
            cabDetails[ 0 ].amenities = determineAmenities( cabTypes[ 0 ].coachType );
        }

        // Calculate estimated fare for the journey
        const estimatedFare = cabTypes.length > 0
            ? cabTypes[ 0 ].price
            : 0;

        // Combine all data
        const cabData = {
            ...cabDetails[ 0 ],
            route: stations,
            journeySegments: processedRoute,
            cabTypes: cabTypes,
            drivers: drivers,
            estimatedFare: estimatedFare
        };

        res.status( 200 ).json( {
            success: true,
            data: cabData
        } );

    } catch ( error ) {
        console.error( 'Error fetching cab details:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

// Function to create a new cab (for admin/partner use)
async function handleCabCreate( req, res ) {
    try {
        // Start a transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const {
                carModel,
                photo,
                totalSeats,
                cabType,
                price,
                driver,
                stations
            } = req.body;

            // Validate required fields
            if ( !carModel || !totalSeats || !cabType || !price || !driver || !stations || !stations.length ) {
                await connection.rollback();
                connection.release();
                return res.status( 400 ).json( {
                    success: false,
                    message: 'Missing required cab information'
                } );
            }

            // Create a new vehicle ID
            const vehicleId = uuidv4().replace( /-/g, '' );

            // Insert the vehicle record
            await connection.execute(
                `INSERT INTO vehicles (vehicleId, vehicleType, status, availableSeats) 
                 VALUES (UNHEX(?), 'cab', 'active', ?)`,
                [ vehicleId, totalSeats ]
            );

            // Insert the cab record
            await connection.execute(
                `INSERT INTO cabs (vehicleId, carModel, photo) 
                 VALUES (UNHEX(?), ?, ?)`,
                [ vehicleId, carModel, photo || null ]
            );

            // Insert cab type
            const coachId = `${ cabType.substring( 0, 2 ) }01`;
            await connection.execute(
                `INSERT INTO vehiclecoaches (coachId, vehicleId, coachType, seatsAvailable, price) 
                 VALUES (?, UNHEX(?), ?, ?, ?)`,
                [ coachId, vehicleId, cabType, totalSeats, price ]
            );

            // Insert driver information
            const driverId = uuidv4().replace( /-/g, '' );
            await connection.execute(
                `INSERT INTO vehicleDrivers (driverId, vehicleId, driverName, driverPhoneNo) 
                 VALUES (UNHEX(?), UNHEX(?), ?, ?)`,
                [ driverId, vehicleId, driver.name, driver.phoneNo ]
            );

            // Insert stations (pickup and drop points)
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
                message: 'Cab created successfully',
                data: {
                    cabId: vehicleId,
                    name: carModel
                }
            } );

        } catch ( error ) {
            // Rollback in case of error
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch ( error ) {
        console.error( 'Error creating cab:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

// Function to handle booking a cab
async function handleCabBooking( req, res ) {
    try {
        const { cabId, userId, source, destination, departureTime, passengers } = req.body;

        // Validate required fields
        if ( !cabId || !userId || !source || !destination || !departureTime ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Missing required booking information'
            } );
        }

        // Start a transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Check cab availability
            const [ cabAvailability ] = await connection.execute(
                `SELECT 
                    v.status, 
                    vc.price,
                    vc.seatsAvailable
                FROM 
                    vehicles v
                JOIN 
                    vehiclecoaches vc ON v.vehicleId = vc.vehicleId
                WHERE 
                    v.vehicleId = UNHEX(?) AND v.status = 'active'`,
                [ cabId ]
            );

            if ( cabAvailability.length === 0 || cabAvailability[ 0 ].status !== 'active' ) {
                await connection.rollback();
                connection.release();
                return res.status( 400 ).json( {
                    success: false,
                    message: 'Cab is not available for booking'
                } );
            }

            // Calculate estimated fare
            const baseFare = cabAvailability[ 0 ].price;

            // Create booking ID
            const bookingId = uuidv4().replace( /-/g, '' );

            // Create booking record (hypothetical booking table)
            // This would be replaced with your actual booking logic
            await connection.execute(
                `INSERT INTO bookings 
                    (bookingId, userId, vehicleId, bookingType, source, destination, 
                    departureTime, passengers, totalFare, status) 
                VALUES 
                    (UNHEX(?), UNHEX(?), UNHEX(?), 'cab', ?, ?, ?, ?, ?, 'confirmed')`,
                [
                    bookingId,
                    userId,
                    cabId,
                    source,
                    destination,
                    departureTime,
                    passengers || 1,
                    baseFare,
                ]
            );

            // Commit the transaction
            await connection.commit();
            connection.release();

            res.status( 201 ).json( {
                success: true,
                message: 'Cab booked successfully',
                data: {
                    bookingId,
                    fare: baseFare
                }
            } );

        } catch ( error ) {
            // Rollback in case of error
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch ( error ) {
        console.error( 'Error booking cab:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

export { handleCabListGet, handleCabDetailGet, handleCabCreate, handleCabBooking };