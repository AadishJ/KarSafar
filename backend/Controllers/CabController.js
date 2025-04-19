import { pool } from '../Config/ConnectDB.js';
import { v4 as uuidv4 } from 'uuid';

async function handleCabListGet( req, res ) {
    try {
        // Extract query parameters (for filtering)
        const { origin, destination, departureDate, returnDate } = req.query;

        // Base query to get cabs with their details
        let query = `
            SELECT 
                HEX(c.vehicleId) as cabId, 
                c.carModel,
                c.photo as cabPhoto,
                v.availableSeats,
                v.status,
                origin_station.stationName as originStation, 
                origin_vs.departureTime as departureTime,
                dest_station.stationName as destinationStation,
                dest_vs.arrivalTime as arrivalTime,
                MIN(vc.price) as basePrice,
                vd.driverName
            FROM 
                cabs c
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
            LEFT JOIN
                vehicledrivers vd ON c.vehicleId = vd.vehicleId
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
            c.vehicleId, 
            origin_station.stationName, 
            dest_station.stationName, 
            origin_vs.departureTime, 
            dest_vs.arrivalTime, 
            c.carModel,
            c.photo,
            v.availableSeats, 
            v.status,
            vd.driverName`;

        // Execute the query
        const [ cabs ] = await pool.execute( query, params );

        // Process cab data
        const processedCabs = cabs.map( cab => ( {
            id: cab.cabId,
            model: cab.carModel,
            photo: cab.cabPhoto,
            availableSeats: cab.availableSeats,
            status: cab.status,
            origin: cab.originStation,
            destination: cab.destinationStation,
            departureTime: cab.departureTime,
            arrivalTime: cab.arrivalTime,
            duration: calculateDuration( cab.departureTime, cab.arrivalTime ),
            basePrice: cab.basePrice,
            driverName: cab.driverName
        } ) );

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
                c.carModel,
                c.photo as cabPhoto,
                v.availableSeats,
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
            [ cabId ]
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
            [ cabId ]
        );

        // Query to get driver information
        const [ drivers ] = await pool.execute(
            `SELECT 
                HEX(driverId) as driverId,
                driverName,
                driverPhoneNo
            FROM 
                vehicledrivers
            WHERE 
                vehicleId = UNHEX(?)`,
            [ cabId ]
        );

        // Combine all data
        const cabData = {
            ...cabDetails[ 0 ],
            route: stations,
            coaches: coaches,
            driver: drivers.length > 0 ? drivers[ 0 ] : null
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

async function handleCabSeatGet( req, res ) {
    try {
        const { cabId } = req.params;
        const { coachId } = req.query;

        if ( !cabId ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Cab ID is required'
            } );
        }

        if ( !coachId ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Coach ID is required'
            } );
        }

        // First verify the cab exists and is active
        const [ cabRows ] = await pool.execute(
            `SELECT 
                v.vehicleId, 
                v.status
            FROM 
                vehicles v
            JOIN 
                cabs c ON v.vehicleId = c.vehicleId
            WHERE 
                v.vehicleId = UNHEX(?) 
                AND v.vehicleType = 'cab'`,
            [ cabId ]
        );

        if ( cabRows.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Cab not found'
            } );
        }

        if ( cabRows[ 0 ].status !== 'active' ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'This cab is not active'
            } );
        }

        // Verify the coach exists for this cab
        const [ coachRows ] = await pool.execute(
            `SELECT 
                vc.coachId, 
                vc.coachType, 
                vc.seatsAvailable
            FROM 
                vehiclecoaches vc
            WHERE 
                vc.vehicleId = UNHEX(?) AND vc.coachId = ?`,
            [ cabId, coachId ]
        );

        if ( coachRows.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Coach not found for this cab'
            } );
        }

        // Get all seats that are available for this cab and coach
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
            [ cabId, coachId, cabId ]
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
        console.error( 'Error fetching cab seats:', error );
        return res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

// Function to handle cab booking
async function handleCabBookPost( req, res ) {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        const { id: cabId } = req.params;
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
        if ( !cabId || !coachId || !passengers || passengers.length === 0 || !bookingDetails ) {
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

        // 1. Check if the cab exists and is active
        const [ cabRows ] = await conn.execute(
            `SELECT 
                v.vehicleId, 
                v.status,
                c.carModel
            FROM 
                vehicles v
            JOIN 
                cabs c ON v.vehicleId = c.vehicleId
            WHERE 
                v.vehicleId = UNHEX(?) 
                AND v.vehicleType = 'cab'`,
            [ cabId ]
        );

        if ( cabRows.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Cab not found'
            } );
        }

        if ( cabRows[ 0 ].status !== 'active' ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'This cab is not available for booking'
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
            [ cabId, coachId ]
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
                cabId.replace( /-/g, '' ),
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
            [ passengers.length, cabId, coachId ]
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
            message: 'Cab booking created successfully',
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
        console.error( 'Error creating cab booking:', error );

        return res.status( 500 ).json( {
            success: false,
            message: 'Failed to create cab booking',
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
    handleCabListGet,
    handleCabDetailGet,
    handleCabSeatGet,
    handleCabBookPost
};