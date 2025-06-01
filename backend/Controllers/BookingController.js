import { v4 as uuidv4 } from 'uuid';
import { pool } from '../Config/ConnectDB.js';

// Helper function to convert UUID to MySQL binary
const uuidToBinary = ( uuid ) => {
    return Buffer.from( uuid.replace( /-/g, '' ), 'hex' );
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

const formatDateTimeForMySQL = ( dateTimeStr ) => {
    if ( !dateTimeStr ) return null;
    // Convert ISO string to MySQL datetime format (YYYY-MM-DD HH:MM:SS)
    try {
        const date = new Date( dateTimeStr );
        return date.toISOString().slice( 0, 19 ).replace( 'T', ' ' );
    } catch ( err ) {
        console.error( 'Error formatting datetime:', err );
        return null;
    }
};

async function handleFlightBookPost( req, res ) {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        const { id: flightId } = req.params;
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
        if ( !flightId || !coachId || !passengers || passengers.length === 0 || !bookingDetails ) {
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

        // 1. Check if the flight exists and is active
        const [ flightRows ] = await conn.execute(
            `SELECT 
                v.vehicleId, 
                v.status,
                f.flightName
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
                message: 'This flight is not available for booking'
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
            [ flightId, coachId ]
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
                flightId.replace( /-/g, '' ),
                bookingDetails.onboardingLocation,
                bookingDetails.deboardingLocation,
                formattedOnboardingTime,  // Use formatted datetime
                formattedDeboardingTime,  // Use formatted datetime
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

            // REMOVE THIS - seats table doesn't have a status column
            // await conn.execute(
            //     `UPDATE seats SET status = 'booked' WHERE seatId = ?`,
            //     [passenger.seatId]
            // );
        }

        // 9. Update available seats in the vehicle coach
        await conn.execute(
            `UPDATE vehiclecoaches 
            SET seatsAvailable = seatsAvailable - ? 
            WHERE vehicleId = UNHEX(?) AND coachId = ?`,
            [ passengers.length, flightId, coachId ]
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
            message: 'Booking created successfully',
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
        console.error( 'Error creating booking:', error );

        return res.status( 500 ).json( {
            success: false,
            message: 'Failed to create booking',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    } finally {
        conn.release();
    }
}

// Add this function to your existing BookingController.js
const handleBookingsListGet = async ( req, res ) => {
    const conn = await pool.getConnection();

    try {
        const userId = req.body.userId; // From auth middleware

        if ( !userId ) {
            return res.status( 401 ).json( {
                success: false,
                message: 'Authentication required'
            } );
        }

        // Query to get all bookings with their items
        const [ bookings ] = await conn.execute(
            `SELECT 
                HEX(b.bookingId) as bookingId,
                b.totalPrice,
                b.status,
                DATE_FORMAT(b.createDate, '%Y-%m-%d %H:%i:%s') as createDate,
                HEX(b.tripId) as tripId,
                t.name as tripName
            FROM 
                bookings b
            LEFT JOIN 
                trips t ON b.tripId = t.tripId
            WHERE 
                b.userId = UNHEX(?)
            ORDER BY 
                b.createDate DESC`,
            [ userId.replace( /-/g, '' ) ]
        );

        // For each booking, get its items
        const bookingsWithDetails = await Promise.all( bookings.map( async ( booking ) => {
            // Get vehicle booking items
            const [ vehicleItems ] = await conn.execute(
                `SELECT 
                    bi.itemType,
                    HEX(vbi.vehicleItemId) as itemId,
                    vbi.onboardingLocation,
                    vbi.deboardingLocation,
                    DATE_FORMAT(vbi.onboardingTime, '%Y-%m-%d %H:%i:%s') as onboardingTime,
                    DATE_FORMAT(vbi.deboardingTime, '%Y-%m-%d %H:%i:%s') as deboardingTime,
                    vbi.coachType,
                    vbi.price,
                    vbi.status,
                    v.vehicleType,
                    CASE
                        WHEN v.vehicleType = 'flight' THEN f.flightName
                        WHEN v.vehicleType = 'train' THEN tr.trainName
                        WHEN v.vehicleType = 'bus' THEN b.busName
                        WHEN v.vehicleType = 'cab' THEN c.carModel
                        WHEN v.vehicleType = 'cruise' THEN cr.cruiseName
                        ELSE 'Unknown'
                    END as vehicleName,
                    COUNT(ps.passengerId) as passengerCount
                FROM 
                    bookingitems bi
                JOIN 
                    vehiclebookingitems vbi ON bi.vehicleItemId = vbi.vehicleItemId
                JOIN 
                    vehicles v ON vbi.vehicleId = v.vehicleId
                LEFT JOIN 
                    flights f ON v.vehicleId = f.vehicleId AND v.vehicleType = 'flight'
                LEFT JOIN 
                    trains tr ON v.vehicleId = tr.vehicleId AND v.vehicleType = 'train'
                LEFT JOIN 
                    buses b ON v.vehicleId = b.vehicleId AND v.vehicleType = 'bus'
                LEFT JOIN 
                    cabs c ON v.vehicleId = c.vehicleId AND v.vehicleType = 'cab'
                LEFT JOIN 
                    cruises cr ON v.vehicleId = cr.vehicleId AND v.vehicleType = 'cruise'
                LEFT JOIN
                    passengerseats ps ON vbi.vehicleItemId = ps.vehicleItemId
                WHERE 
                    bi.bookingId = UNHEX(?)
                    AND bi.itemType = 'vehicle'
                GROUP BY
                    bi.bookingItemId`,
                [ booking.bookingId ]
            );

            // Get accommodation booking items
            const [ accomItems ] = await conn.execute(
                `SELECT 
                    bi.itemType,
                    HEX(abi.accomItemId) as itemId,
                    a.name as accommodationName,
                    a.accomType,
                    abi.contactName,
                    DATE_FORMAT(abi.checkInDate, '%Y-%m-%d') as checkInDate,
                    DATE_FORMAT(abi.checkOutDate, '%Y-%m-%d') as checkOutDate,
                    abi.price,
                    abi.status,
                    aa.city,
                    aa.country
                FROM 
                    bookingitems bi
                JOIN 
                    accommodationbookingitems abi ON bi.accomItemId = abi.accomItemId
                JOIN 
                    accommodations a ON abi.accomId = a.accomId
                LEFT JOIN
                    accommodationaddresses aa ON a.accomId = aa.accomId
                WHERE 
                    bi.bookingId = UNHEX(?)
                    AND bi.itemType = 'accommodation'`,
                [ booking.bookingId ]
            );

            // Get payment information
            const [ payments ] = await conn.execute(
                `SELECT 
                    HEX(paymentId) as paymentId,
                    amount,
                    paid,
                    paymentMethod,
                    transactionId,
                    DATE_FORMAT(paymentDate, '%Y-%m-%d %H:%i:%s') as paymentDate,
                    status
                FROM 
                    payments
                WHERE 
                    bookingId = UNHEX(?)`,
                [ booking.bookingId ]
            );

            return {
                ...booking,
                items: [ ...vehicleItems, ...accomItems ],
                payment: payments.length > 0 ? payments[ 0 ] : null
            };
        } ) );

        return res.status( 200 ).json( {
            success: true,
            message: 'Bookings retrieved successfully',
            data: bookingsWithDetails
        } );

    } catch ( error ) {
        console.error( 'Error retrieving bookings:', error );

        return res.status( 500 ).json( {
            success: false,
            message: 'Failed to retrieve bookings',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    } finally {
        conn.release();
    }
};


const handleTrainBookPost = async ( req, res ) => {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        const { id: trainId } = req.params;
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
        if ( !trainId || !coachId || !passengers || passengers.length === 0 || !bookingDetails ) {
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

        // 1. Check if the train exists and is active
        const [ trainRows ] = await conn.execute(
            `SELECT 
                v.vehicleId, 
                v.status,
                t.trainName
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
                message: 'This train is not available for booking'
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
            [ trainId, coachId ]
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
                trainId.replace( /-/g, '' ),
                bookingDetails.onboardingLocation,
                bookingDetails.deboardingLocation,
                formattedOnboardingTime,  // Use formatted datetime
                formattedDeboardingTime,  // Use formatted datetime
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
            [ passengers.length, trainId, coachId ]
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
            message: 'Train booking created successfully',
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
        console.error( 'Error creating train booking:', error );

        return res.status( 500 ).json( {
            success: false,
            message: 'Failed to create train booking',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    } finally {
        conn.release();
    }
};


const handleCarBookPost = async ( req, res ) => {

}


const handleBusBookPost = async ( req, res ) => {

}

const handleCruiseBookPost = async ( req, res ) => {

}
const handleHotelBookPost = async ( req, res ) => {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        const { id: hotelId } = req.params;
        const {
            roomId,
            checkInDate,
            checkOutDate,
            numberOfRooms,
            numberOfGuests,
            guestInfo,
            specialRequests,
            paymentMethod,
            tripDetails,
            bookingDetails
        } = req.body;

        const userId = req.userId || req.body.userId; // From auth middleware or request body

        // Validate input
        if ( !hotelId || !roomId || !checkInDate || !checkOutDate || !guestInfo ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Missing required booking information'
            } );
        }

        if ( !guestInfo.name || !guestInfo.phone ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Guest name and phone are required'
            } );
        }

        // 1. Check if the hotel exists
        const [ hotelRows ] = await conn.execute(
            `SELECT 
                a.accomId, 
                a.name as hotelName,
                a.accomType
            FROM 
                accommodations a
            WHERE 
                a.accomId = UNHEX(?) 
                AND a.accomType = 'hotel'`,
            [ hotelId ]
        );

        if ( hotelRows.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Hotel not found'
            } );
        }

        // 2. Check if the room exists and has availability for the selected dates
        const [ roomRows ] = await conn.execute(
            `SELECT 
                r.roomId, 
                r.roomType, 
                r.roomsAvailable,
                r.price,
                r.pplAccommodated
            FROM 
                rooms r
            WHERE 
                r.accomId = UNHEX(?) AND r.roomId = UNHEX(?)`,
            [ hotelId, roomId ]
        );

        if ( roomRows.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Room not found'
            } );
        }

        // Check room availability for the selected dates
        const [ availabilityResult ] = await conn.execute(
            `SELECT 
                COUNT(DISTINCT abr.roomId) as bookedCount
            FROM 
                accombookingrooms abr
            JOIN 
                accommodationbookingitems abi ON abr.accomItemId = abi.accomItemId
            WHERE 
                abr.roomId = UNHEX(?) 
                AND abi.accomId = UNHEX(?)
                AND ((abi.checkInDate <= ? AND abi.checkOutDate > ?) OR 
                    (abi.checkInDate < ? AND abi.checkOutDate >= ?) OR
                    (abi.checkInDate >= ? AND abi.checkOutDate <= ?))
                AND abi.status NOT IN ('cancelled')`,
            [
                roomId, hotelId,
                checkOutDate, checkInDate, // First condition
                checkInDate, checkOutDate, // Second condition
                checkInDate, checkOutDate  // Third condition
            ]
        );

        const bookedCount = availabilityResult[ 0 ].bookedCount;
        const availableRooms = roomRows[ 0 ].roomsAvailable - bookedCount;

        if ( availableRooms < ( numberOfRooms || 1 ) ) {
            return res.status( 400 ).json( {
                success: false,
                message: `Only ${ availableRooms } rooms of this type are available`
            } );
        }

        // Verify guest count doesn't exceed room capacity
        if ( numberOfGuests > roomRows[ 0 ].pplAccommodated ) {
            return res.status( 400 ).json( {
                success: false,
                message: `Room can only accommodate ${ roomRows[ 0 ].pplAccommodated } guests`
            } );
        }

        // 3. Handle trip creation or selection if specified
        let tripId = null;

        if ( tripDetails ) {
            if ( tripDetails.createNewTrip && tripDetails.newTripName ) {
                // Create a new trip
                const newTripId = uuidv4();

                await conn.execute(
                    `INSERT INTO trips (tripId, userId, name, startDate, endDate, status)
                    VALUES (UNHEX(?), UNHEX(?), ?, ?, ?, 'planning')`,
                    [
                        newTripId.replace( /-/g, '' ),
                        userId.replace( /-/g, '' ),
                        tripDetails.newTripName,
                        checkInDate,
                        checkOutDate
                    ]
                );

                tripId = newTripId;
            } else if ( tripDetails.tripId ) {
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
        }

        // 4. Calculate total price (use provided value or calculate)
        const totalPrice = bookingDetails?.totalPrice ||
            ( parseFloat( roomRows[ 0 ].price ) *
                differenceInDays( new Date( checkOutDate ), new Date( checkInDate ) ) *
                ( numberOfRooms || 1 ) );

        // 5. Create the main booking record
        const bookingId = uuidv4();

        await conn.execute(
            `INSERT INTO bookings (bookingId, userId, tripId, totalPrice, status, createDate)
            VALUES (UNHEX(?), UNHEX(?), ${ tripId ? 'UNHEX(?)' : 'NULL' }, ?, 'pending', NOW())`,
            tripId
                ? [ bookingId.replace( /-/g, '' ), userId.replace( /-/g, '' ), tripId.replace( /-/g, '' ), totalPrice ]
                : [ bookingId.replace( /-/g, '' ), userId.replace( /-/g, '' ), totalPrice ]
        );

        // 6. Create the accommodation booking item
        const accomItemId = uuidv4();

        await conn.execute(
            `INSERT INTO accommodationbookingitems 
            (accomItemId, accomId, checkInDate, checkOutDate, contactName, contactPhoneNo, contactEmail, price, status)
            VALUES (UNHEX(?), UNHEX(?), ?, ?, ?, ?, ?, ?, 'pending')`,
            [
                accomItemId.replace( /-/g, '' ),
                hotelId.replace( /-/g, '' ),
                checkInDate,
                checkOutDate,
                guestInfo.name,
                guestInfo.phone,
                guestInfo.email || null,
                totalPrice
            ]
        );

        // 7. Create the booking item linking booking and accommodation item
        const bookingItemId = uuidv4();

        await conn.execute(
            `INSERT INTO bookingitems (bookingItemId, bookingId, itemType, vehicleItemId, accomItemId, price)
            VALUES (UNHEX(?), UNHEX(?), 'accommodation', NULL, UNHEX(?), ?)`,
            [
                bookingItemId.replace( /-/g, '' ),
                bookingId.replace( /-/g, '' ),
                accomItemId.replace( /-/g, '' ),
                totalPrice
            ]
        );

        // 8. Create room booking records (for each room if multiple)
        const numRooms = numberOfRooms || 1;
        for ( let i = 0; i < numRooms; i++ ) {
            const bookingRoomId = uuidv4();
            await conn.execute(
                `INSERT INTO accombookingrooms 
                (bookingRoomId, accomItemId, roomId, roomNumber)
                VALUES (UNHEX(?), UNHEX(?), UNHEX(?), ?)`,
                [
                    bookingRoomId.replace( /-/g, '' ),
                    accomItemId.replace( /-/g, '' ),
                    roomId.replace( /-/g, '' ),
                    null // Room number is typically assigned at check-in
                ]
            );
        }

        // 9. Create payment record if needed
        if ( paymentMethod ) {
            const paymentId = uuidv4();
            await conn.execute(
                `INSERT INTO payments 
                (paymentId, bookingId, amount, paid, paymentMethod, status)
                VALUES (UNHEX(?), UNHEX(?), ?, ?, ?, 'pending')`,
                [
                    paymentId.replace( /-/g, '' ),
                    bookingId.replace( /-/g, '' ),
                    totalPrice,
                    paymentMethod === 'pay_at_hotel' ? 0 : 0, // 0 = not paid yet
                    paymentMethod
                ]
            );
        }

        // Commit transaction
        await conn.commit();

        // Generate booking reference (you need to implement this function)
        const bookingReference = generateBookingReference ? generateBookingReference() : `HB-${ bookingId.substring( 0, 8 ).toUpperCase() }`;

        return res.status( 201 ).json( {
            success: true,
            message: 'Hotel booking created successfully',
            data: {
                bookingId,
                bookingReference,
                hotelName: hotelRows[ 0 ].hotelName,
                roomType: roomRows[ 0 ].roomType,
                checkInDate,
                checkOutDate,
                nights: differenceInDays( new Date( checkOutDate ), new Date( checkInDate ) ),
                totalPrice,
                status: 'pending',
                tripId
            }
        } );

    } catch ( error ) {
        await conn.rollback();
        console.error( 'Error creating hotel booking:', error );

        return res.status( 500 ).json( {
            success: false,
            message: 'Failed to create hotel booking',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    } finally {
        conn.release();
    }
};

// Helper function to calculate days difference
function differenceInDays( endDate, startDate ) {
    const diffTime = Math.abs( endDate - startDate );
    const diffDays = Math.ceil( diffTime / ( 1000 * 60 * 60 * 24 ) );
    return diffDays;
}

export {
    handleFlightBookPost,
    handleBookingsListGet,
    handleCarBookPost,
    handleTrainBookPost,
    handleBusBookPost,
    handleCruiseBookPost,
    handleHotelBookPost
};