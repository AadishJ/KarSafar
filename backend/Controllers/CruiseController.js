import { pool } from '../Config/ConnectDB.js';
import { v4 as uuidv4 } from 'uuid';

async function handleCruiseListGet( req, res ) {
    try {
        // Extract query parameters (for filtering)
        const { origin, destination, departureDate, returnDate } = req.query;

        // Base query to get cruises with their details
        let query = `
            SELECT 
                HEX(c.vehicleId) as cruiseId, 
                c.cruiseName,
                c.photo as cruisePhoto,
                v.availableSeats,
                v.status,
                origin_station.stationName as originPort, 
                origin_vs.departureTime as departureTime,
                dest_station.stationName as destinationPort,
                dest_vs.arrivalTime as arrivalTime,
                MIN(vc.price) as basePrice
            FROM 
                cruises c
            JOIN 
                vehicles v ON c.vehicleId = v.vehicleId
            JOIN 
                vehiclestations origin_vs ON c.vehicleId = origin_vs.vehicleId
            JOIN 
                stations origin_station ON origin_vs.stationId = origin_station.stationId
            JOIN 
                vehiclestations dest_vs ON c.vehicleId = dest_vs.vehicleId
            JOIN 
                stations dest_station ON dest_vs.stationId = dest_station.stationId
            LEFT JOIN
                vehiclecoaches vc ON c.vehicleId = vc.vehicleId
            WHERE 
                origin_vs.stationOrder < dest_vs.stationOrder
                AND v.status = 'active'
                AND origin_station.stationType = 'seaport'
                AND dest_station.stationType = 'seaport'
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
            c.vehicleId, 
            origin_station.stationName, 
            dest_station.stationName, 
            origin_vs.departureTime, 
            dest_vs.arrivalTime, 
            c.cruiseName,
            c.photo, 
            v.availableSeats, 
            v.status`;

        // Execute the query
        const [ cruises ] = await pool.execute( query, params );

        // Process cruise data
        const processedCruises = cruises.map( cruise => ( {
            id: cruise.cruiseId,
            name: cruise.cruiseName,
            photo: cruise.cruisePhoto,
            availableSeats: cruise.availableSeats,
            status: cruise.status,
            origin: cruise.originPort,
            destination: cruise.destinationPort,
            departureTime: cruise.departureTime,
            arrivalTime: cruise.arrivalTime,
            duration: calculateDuration( cruise.departureTime, cruise.arrivalTime ),
            basePrice: cruise.basePrice
        } ) );

        res.status( 200 ).json( {
            success: true,
            count: processedCruises.length,
            data: processedCruises
        } );
    } catch ( error ) {
        console.error( 'Error fetching cruises:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

// Helper function to calculate cruise duration
function calculateDuration( departure, arrival ) {
    const departureTime = new Date( departure );
    const arrivalTime = new Date( arrival );

    // Duration in milliseconds
    const durationMs = arrivalTime - departureTime;

    // Convert to days and hours for cruises (typically longer duration)
    const days = Math.floor( durationMs / ( 24 * 60 * 60 * 1000 ) );
    const hours = Math.floor( ( durationMs % ( 24 * 60 * 60 * 1000 ) ) / ( 60 * 60 * 1000 ) );

    return {
        days,
        hours,
        display: days > 0 ? `${ days }d ${ hours }h` : `${ hours }h`
    };
}

// Function to get detailed information about a specific cruise
async function handleCruiseDetailGet( req, res ) {
    try {
        const { cruiseId } = req.params;

        if ( !cruiseId ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Cruise ID is required'
            } );
        }

        // Query to get cruise details
        const [ cruiseDetails ] = await pool.execute(
            `SELECT 
                HEX(c.vehicleId) as cruiseId, 
                c.cruiseName,
                c.photo as cruisePhoto,
                v.availableSeats,
                v.status
            FROM 
                cruises c
            JOIN 
                vehicles v ON c.vehicleId = v.vehicleId
            WHERE 
                c.vehicleId = UNHEX(?)`,
            [ cruiseId ]
        );

        if ( cruiseDetails.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Cruise not found'
            } );
        }

        // Query to get all ports (route) - joining with stations table
        const [ ports ] = await pool.execute(
            `SELECT 
                s.stationName,
                s.city,
                s.country,
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
                AND s.stationType = 'seaport'
            ORDER BY 
                vs.stationOrder`,
            [ cruiseId ]
        );

        // Query to get available cabin types and prices
        const [ cabins ] = await pool.execute(
            `SELECT 
                coachId as cabinId,
                coachType as cabinType,
                seatsAvailable,
                price
            FROM 
                vehiclecoaches
            WHERE 
                vehicleId = UNHEX(?)`,
            [ cruiseId ]
        );

        // Combine all data
        const cruiseData = {
            ...cruiseDetails[ 0 ],
            itinerary: ports,
            cabins: cabins,
        };

        res.status( 200 ).json( {
            success: true,
            data: cruiseData
        } );

    } catch ( error ) {
        console.error( 'Error fetching cruise details:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

async function handleCruiseSeatGet( req, res ) {
    try {
        const { cruiseId } = req.params;
        const { cabinId } = req.query;

        if ( !cruiseId ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Cruise ID is required'
            } );
        }

        if ( !cabinId ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Cabin ID is required'
            } );
        }

        // First verify the cruise exists and is active
        const [ cruiseRows ] = await pool.execute(
            `SELECT 
                v.vehicleId, 
                v.status
            FROM 
                vehicles v
            JOIN 
                cruises c ON v.vehicleId = c.vehicleId
            WHERE 
                v.vehicleId = UNHEX(?) 
                AND v.vehicleType = 'cruise'`,
            [ cruiseId ]
        );

        if ( cruiseRows.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Cruise not found'
            } );
        }

        if ( cruiseRows[ 0 ].status !== 'active' ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'This cruise is not active'
            } );
        }

        // Verify the cabin exists for this cruise
        const [ cabinRows ] = await pool.execute(
            `SELECT 
                vc.coachId as cabinId, 
                vc.coachType as cabinType, 
                vc.seatsAvailable
            FROM 
                vehiclecoaches vc
            WHERE 
                vc.vehicleId = UNHEX(?) AND vc.coachId = ?`,
            [ cruiseId, cabinId ]
        );

        if ( cabinRows.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Cabin not found for this cruise'
            } );
        }

        // Get all seats that are available for this cruise and cabin
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
            [ cruiseId, cabinId, cruiseId ]
        );

        // Format the response
        const formattedSeats = seatsRows.map( seat => ( {
            seatId: seat.seatId,
            seatNumber: seat.seatNumber,
            status: seat.status
        } ) );

        return res.status( 200 ).json( {
            success: true,
            message: 'Cabin seats retrieved successfully',
            data: formattedSeats
        } );

    } catch ( error ) {
        console.error( 'Error fetching cruise seats:', error );
        return res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

// Function to handle cruise booking
async function handleCruiseBookPost( req, res ) {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        const { id: cruiseId } = req.params;
        const {
            cabinId,
            passengers,
            contactInfo,
            paymentMethod,
            tripDetails,
            bookingDetails
        } = req.body;

        const userId = req.body.userId; // From auth middleware

        // Validate input
        if ( !cruiseId || !cabinId || !passengers || passengers.length === 0 || !bookingDetails ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Missing required booking information'
            } );
        }

        const formattedOnboardingTime = formatDateTimeForMySQL( bookingDetails.onboardingTime );
        const formattedDeboardingTime = formatDateTimeForMySQL( bookingDetails.deboardingTime );

        if ( !formattedOnboardingTime || !formattedDeboardingTime ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Invalid date/time format for boarding times'
            } );
        }

        // 1. Check if the cruise exists and is active
        const [ cruiseRows ] = await conn.execute(
            `SELECT 
                v.vehicleId, 
                v.status,
                c.cruiseName
            FROM 
                vehicles v
            JOIN 
                cruises c ON v.vehicleId = c.vehicleId
            WHERE 
                v.vehicleId = UNHEX(?) 
                AND v.vehicleType = 'cruise'`,
            [ cruiseId ]
        );

        if ( cruiseRows.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Cruise not found'
            } );
        }

        if ( cruiseRows[ 0 ].status !== 'active' ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'This cruise is not available for booking'
            } );
        }

        // 2. Check if the cabin exists and has enough available seats
        const [ cabinRows ] = await conn.execute(
            `SELECT 
                coachId, 
                coachType, 
                seatsAvailable,
                price
            FROM 
                vehiclecoaches
            WHERE 
                vehicleId = UNHEX(?) AND coachId = ?`,
            [ cruiseId, cabinId ]
        );

        if ( cabinRows.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Cabin not found'
            } );
        }

        if ( cabinRows[ 0 ].seatsAvailable < passengers.length ) {
            return res.status( 400 ).json( {
                success: false,
                message: `Not enough cabin space available. Only ${ cabinRows[ 0 ].seatsAvailable } space(s) left.`
            } );
        }

        // 3. Verify all selected seats exist and are available
        const seatIds = passengers.map( p => p.seatId ).filter( Boolean );

        if ( seatIds.length > 0 ) {
            // First, check if all seats exist
            const formattedSeatIds = seatIds.map( id => id.replace( /-/g, '' ) );
            const placeholders = formattedSeatIds.map( () => 'UNHEX(?)' ).join( ',' );

            const [ existingSeats ] = await conn.execute(
                `SELECT HEX(seatId) as seatId, seatNumber, coachId
                FROM seats
                WHERE seatId IN (${ placeholders })
                AND coachId = ?`,
                [ ...formattedSeatIds, cabinId ]
            );

            if ( existingSeats.length !== seatIds.length ) {
                return res.status( 400 ).json( {
                    success: false,
                    message: 'One or more selected cabin seats do not exist'
                } );
            }

            // Now check if any seats are already booked
            const [ bookedSeats ] = await conn.execute(
                `SELECT HEX(ps.seatId) as seatId
                FROM passengerseats ps
                JOIN vehiclebookingitems vbi ON ps.vehicleItemId = vbi.vehicleItemId
                WHERE ps.seatId IN (${ placeholders })
                AND vbi.status != 'cancelled'`,
                [ ...formattedSeatIds ]
            );

            if ( bookedSeats.length > 0 ) {
                return res.status( 400 ).json( {
                    success: false,
                    message: 'One or more selected cabin seats are already booked'
                } );
            }
        }

        // 4. Handle trip creation or selection if specified
        let tripId = null;

        if ( tripDetails && tripDetails.createNewTrip && tripDetails.newTripName ) {
            // Create a new trip
            const newTripId = uuidv4();
            const departureDate = new Date( bookingDetails.onboardingTime );
            const arrivalDate = new Date( bookingDetails.deboardingTime );

            await conn.execute(
                `INSERT INTO trips (tripId, userId, name, startDate, endDate, status)
                VALUES (UNHEX(?), UNHEX(?), ?, ?, ?, 'planning')`,
                [
                    newTripId.replace( /-/g, '' ),
                    userId.replace( /-/g, '' ),
                    tripDetails.newTripName,
                    departureDate.toISOString().split( 'T' )[ 0 ],
                    arrivalDate.toISOString().split( 'T' )[ 0 ]
                ]
            );

            tripId = newTripId;
        } else if ( tripDetails && tripDetails.tripId ) {
            // Verify the trip exists and belongs to the user
            const [ tripRows ] = await conn.execute(
                `SELECT tripId FROM trips WHERE tripId = UNHEX(?) AND userId = UNHEX(?)`,
                [ tripDetails.tripId.replace( /-/g, '' ), userId.replace( /-/g, '' ) ]
            );

            if ( tripRows.length === 0 ) {
                return res.status( 404 ).json( {
                    success: false,
                    message: 'Trip not found or does not belong to the user'
                } );
            }

            tripId = tripDetails.tripId;
        }

        // 5. Create the main booking record
        const bookingId = uuidv4();
        const totalPrice = bookingDetails.price * passengers.length;

        await conn.execute(
            `INSERT INTO bookings (bookingId, userId, tripId, totalPrice, status, createDate)
            VALUES (UNHEX(?), UNHEX(?), ${ tripId ? 'UNHEX(?)' : 'NULL' }, ?, 'pending', NOW())`,
            tripId
                ? [ bookingId.replace( /-/g, '' ), userId.replace( /-/g, '' ), tripId.replace( /-/g, '' ), totalPrice ]
                : [ bookingId.replace( /-/g, '' ), userId.replace( /-/g, '' ), totalPrice ]
        );

        // 6. Create the vehicle booking item
        const vehicleItemId = uuidv4();

        await conn.execute(
            `INSERT INTO vehiclebookingitems 
            (vehicleItemId, vehicleId, onboardingLocation, deboardingLocation, onboardingTime, deboardingTime, coachType, price, status)
            VALUES (UNHEX(?), UNHEX(?), ?, ?, ?, ?, ?, ?, 'pending')`,
            [
                vehicleItemId.replace( /-/g, '' ),
                cruiseId.replace( /-/g, '' ),
                bookingDetails.onboardingLocation,
                bookingDetails.deboardingLocation,
                formattedOnboardingTime,
                formattedDeboardingTime,
                bookingDetails.cabinType,
                bookingDetails.price
            ]
        );

        // 7. Create the booking item linking booking and vehicle item
        const bookingItemId = uuidv4();

        await conn.execute(
            `INSERT INTO bookingitems (bookingItemId, bookingId, itemType, vehicleItemId, accomItemId, price)
            VALUES (UNHEX(?), UNHEX(?), 'vehicle', UNHEX(?), NULL, ?)`,
            [
                bookingItemId.replace( /-/g, '' ),
                bookingId.replace( /-/g, '' ),
                vehicleItemId.replace( /-/g, '' ),
                totalPrice
            ]
        );

        // 8. Create passenger records
        for ( const passenger of passengers ) {
            const passengerId = uuidv4();

            // Format the passenger's seatId properly
            const formattedSeatId = passenger.seatId.replace( /-/g, '' );

            await conn.execute(
                `INSERT INTO passengerseats 
                (passengerId, vehicleItemId, seatId, name, age, gender, foodPreference)
                VALUES (UNHEX(?), UNHEX(?), UNHEX(?), ?, ?, ?, ?)`,
                [
                    passengerId.replace( /-/g, '' ),
                    vehicleItemId.replace( /-/g, '' ),
                    formattedSeatId,
                    passenger.name,
                    passenger.age,
                    passenger.gender,
                    passenger.foodPreference
                ]
            );
        }

        // 9. Update available seats in the vehicle coach
        await conn.execute(
            `UPDATE vehiclecoaches 
            SET seatsAvailable = seatsAvailable - ? 
            WHERE vehicleId = UNHEX(?) AND coachId = ?`,
            [ passengers.length, cruiseId, cabinId ]
        );

        // 10. Create payment record
        const paymentId = uuidv4();

        await conn.execute(
            `INSERT INTO payments 
            (paymentId, bookingId, amount, paid, paymentMethod, status)
            VALUES (UNHEX(?), UNHEX(?), ?, FALSE, ?, 'pending')`,
            [
                paymentId.replace( /-/g, '' ),
                bookingId.replace( /-/g, '' ),
                totalPrice,
                paymentMethod
            ]
        );

        // Commit transaction
        await conn.commit();

        // Generate booking reference
        const bookingReference = generateBookingReference();

        return res.status( 201 ).json( {
            success: true,
            message: 'Cruise booking created successfully',
            data: {
                bookingId,
                bookingReference,
                totalPrice,
                status: 'pending',
                tripId
            }
        } );

    } catch ( error ) {
        await conn.rollback();
        console.error( 'Error creating cruise booking:', error );

        return res.status( 500 ).json( {
            success: false,
            message: 'Failed to create cruise booking',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    } finally {
        conn.release();
    }
}

// Helper function for date formatting
const formatDateTimeForMySQL = ( dateTimeStr ) => {
    if ( !dateTimeStr ) return null;
    try {
        const date = new Date( dateTimeStr );
        return date.toISOString().slice( 0, 19 ).replace( 'T', ' ' );
    } catch ( err ) {
        console.error( 'Error formatting datetime:', err );
        return null;
    }
};

// Helper function to generate booking reference
const generateBookingReference = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let reference = '';
    for ( let i = 0; i < 8; i++ ) {
        reference += chars[ Math.floor( Math.random() * chars.length ) ];
    }
    return reference;
};

export {
    handleCruiseListGet,
    handleCruiseDetailGet,
    handleCruiseSeatGet,
    handleCruiseBookPost
};