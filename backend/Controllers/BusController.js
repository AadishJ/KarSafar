import { pool } from '../Config/ConnectDB.js';
import { v4 as uuidv4 } from 'uuid';

async function handleBusListGet( req, res ) {
    try {
        // Extract query parameters (for filtering)
        const { origin, destination, departureDate, returnDate } = req.query;

        // Base query to get buses with their details
        let query = `
            SELECT 
                HEX(b.vehicleId) as busId, 
                b.busName,
                b.photo as busPhoto,
                v.availableSeats,
                v.status,
                origin_station.stationName as originStation, 
                origin_vs.departureTime as departureTime,
                dest_station.stationName as destinationStation,
                dest_vs.arrivalTime as arrivalTime,
                MIN(vc.price) as basePrice
            FROM 
                buses b
            JOIN 
                vehicles v ON b.vehicleId = v.vehicleId
            JOIN 
                vehiclestations origin_vs ON b.vehicleId = origin_vs.vehicleId
            JOIN 
                stations origin_station ON origin_vs.stationId = origin_station.stationId
            JOIN 
                vehiclestations dest_vs ON b.vehicleId = dest_vs.vehicleId
            JOIN 
                stations dest_station ON dest_vs.stationId = dest_station.stationId
            LEFT JOIN
                vehiclecoaches vc ON b.vehicleId = vc.vehicleId
            WHERE 
                origin_vs.stationOrder < dest_vs.stationOrder
                AND v.status = 'active'
                AND origin_station.stationType = 'bus'
                AND dest_station.stationType = 'bus'
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
            b.vehicleId, 
            origin_station.stationName, 
            dest_station.stationName, 
            origin_vs.departureTime, 
            dest_vs.arrivalTime,
            b.busName,
            b.photo,  
            v.availableSeats, 
            v.status`;

        // Execute the query
        const [ buses ] = await pool.execute( query, params );

        // Process bus data
        const processedBuses = buses.map( bus => ( {
            id: bus.busId,
            name: bus.busName,
            photo: bus.busPhoto,
            availableSeats: bus.availableSeats,
            status: bus.status,
            origin: bus.originStation,
            destination: bus.destinationStation,
            departureTime: bus.departureTime,
            arrivalTime: bus.arrivalTime,
            duration: calculateDuration( bus.departureTime, bus.arrivalTime ),
            basePrice: bus.basePrice
        } ) );

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
                b.busName,
                b.photo as busPhoto,
                v.availableSeats,
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

        // Query to get all stations (route) - joining with stations table
        const [ stations ] = await pool.execute(
            `SELECT 
                s.stationName,
                s.city,
                s.state,
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
            ORDER BY 
                vs.stationOrder`,
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
                driverName,
                driverPhoneNo
            FROM 
                vehicledrivers
            WHERE 
                vehicleId = UNHEX(?)`,
            [ busId ]
        );

        // Combine all data
        const busData = {
            ...busDetails[ 0 ],
            route: stations,
            coaches: coaches,
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

async function handleBusSeatGet( req, res ) {
    try {
        const { busId } = req.params;
        const { coachId } = req.query;

        if ( !busId ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Bus ID is required'
            } );
        }

        if ( !coachId ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Coach ID is required'
            } );
        }

        // First verify the bus exists and is active
        const [ busRows ] = await pool.execute(
            `SELECT 
                v.vehicleId, 
                v.status
            FROM 
                vehicles v
            JOIN 
                buses b ON v.vehicleId = b.vehicleId
            WHERE 
                v.vehicleId = UNHEX(?) 
                AND v.vehicleType = 'bus'`,
            [ busId ]
        );

        if ( busRows.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Bus not found'
            } );
        }

        if ( busRows[ 0 ].status !== 'active' ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'This bus is not active'
            } );
        }

        // Verify the coach exists for this bus
        const [ coachRows ] = await pool.execute(
            `SELECT 
                vc.coachId, 
                vc.coachType, 
                vc.seatsAvailable
            FROM 
                vehiclecoaches vc
            WHERE 
                vc.vehicleId = UNHEX(?) AND vc.coachId = ?`,
            [ busId, coachId ]
        );

        if ( coachRows.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Coach not found for this bus'
            } );
        }

        // Get all seats that are available for this bus and coach
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
            [ busId, coachId, busId ]
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
        console.error( 'Error fetching bus seats:', error );
        return res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

// Function to handle bus booking - similar to flight booking
async function handleBusBookPost( req, res ) {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        const { id: busId } = req.params;
        const {
            coachId,
            passengers,
            contactInfo,
            paymentMethod,
            tripDetails,
            bookingDetails
        } = req.body;

        const userId = req.body.userId; // From auth middleware

        // Validate input
        if ( !busId || !coachId || !passengers || passengers.length === 0 || !bookingDetails ) {
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

        // 1. Check if the bus exists and is active
        const [ busRows ] = await conn.execute(
            `SELECT 
                v.vehicleId, 
                v.status,
                b.busName
            FROM 
                vehicles v
            JOIN 
                buses b ON v.vehicleId = b.vehicleId
            WHERE 
                v.vehicleId = UNHEX(?) 
                AND v.vehicleType = 'bus'`,
            [ busId ]
        );

        if ( busRows.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Bus not found'
            } );
        }

        if ( busRows[ 0 ].status !== 'active' ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'This bus is not available for booking'
            } );
        }

        // 2. Check if the coach exists and has enough available seats
        const [ coachRows ] = await conn.execute(
            `SELECT 
                coachId, 
                coachType, 
                seatsAvailable,
                price
            FROM 
                vehiclecoaches
            WHERE 
                vehicleId = UNHEX(?) AND coachId = ?`,
            [ busId, coachId ]
        );

        if ( coachRows.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Coach not found'
            } );
        }

        if ( coachRows[ 0 ].seatsAvailable < passengers.length ) {
            return res.status( 400 ).json( {
                success: false,
                message: `Not enough seats available. Only ${ coachRows[ 0 ].seatsAvailable } seat(s) left.`
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
                [ ...formattedSeatIds, coachId ]
            );

            if ( existingSeats.length !== seatIds.length ) {
                return res.status( 400 ).json( {
                    success: false,
                    message: 'One or more selected seats do not exist'
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
                    message: 'One or more selected seats are already booked'
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
                busId.replace( /-/g, '' ),
                bookingDetails.onboardingLocation,
                bookingDetails.deboardingLocation,
                formattedOnboardingTime,
                formattedDeboardingTime,
                bookingDetails.coachType,
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
            [ passengers.length, busId, coachId ]
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
            message: 'Bus booking created successfully',
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
        console.error( 'Error creating bus booking:', error );

        return res.status( 500 ).json( {
            success: false,
            message: 'Failed to create bus booking',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    } finally {
        conn.release();
    }
}

// Helper function for date formatting - identical to the one in flight controller
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

// Helper function to generate booking reference - identical to the one in booking controller
const generateBookingReference = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let reference = '';
    for ( let i = 0; i < 8; i++ ) {
        reference += chars[ Math.floor( Math.random() * chars.length ) ];
    }
    return reference;
};

export {
    handleBusListGet,
    handleBusDetailGet,
    handleBusSeatGet,
    handleBusBookPost
};