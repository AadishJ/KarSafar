import { pool } from '../Config/ConnectDB.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Handles GET request for listing hotels based on search criteria
 */
async function handleHotelListGet( req, res ) {
    try {
        // Extract query parameters (for filtering)
        const { location, checkInDate, checkOutDate, guests, rooms } = req.query;

        // Base query to get hotels with their details
        // Modified to match your exact schema
        let query = `
            SELECT 
                HEX(a.accomId) as hotelId, 
                a.name,
                a.accomType,
                a.description,
                addr.city,
                addr.country,
                addr.street,
                h.breakfastIncluded,
                h.acType,
                MIN(r.price) as basePrice,
                COUNT(DISTINCT r.roomId) as roomTypes,
                SUM(r.roomsAvailable) as roomsAvailable,
                (
                    SELECT AVG(rating)
                    FROM reviews
                    WHERE reviews.itemType = 'accommodation' AND reviews.itemId = a.accomId
                ) as rating,
                (
                    SELECT MIN(photoUrl)
                    FROM accommodationphotos ap
                    WHERE ap.accomId = a.accomId
                    LIMIT 1
                ) as mainPhoto
            FROM 
                accommodations a
            JOIN 
                hotels h ON a.accomId = h.accomId
            JOIN 
                accommodationaddresses addr ON a.accomId = addr.accomId
            LEFT JOIN
                rooms r ON a.accomId = r.accomId
            WHERE 
                a.accomType = 'hotel'
        `;

        // Add parameters for filtering
        const params = [];

        // Filter by location (city or country)
        if ( location ) {
            query += " AND (addr.city LIKE ? OR addr.country LIKE ?)";
            params.push( `%${ location }%`, `%${ location }%` );
        }

        // Filter by available rooms and guests capacity
        if ( guests && rooms ) {
            // Ensure there are enough rooms available of any type
            query += " AND (SELECT SUM(roomsAvailable) FROM rooms WHERE rooms.accomId = a.accomId) >= ?";
            params.push( parseInt( rooms ) );

            // Ensure rooms can accommodate the number of guests
            query += " AND (SELECT SUM(roomsAvailable * pplAccommodated) FROM rooms WHERE rooms.accomId = a.accomId) >= ?";
            params.push( parseInt( guests ) );
        }

        // Group by to avoid duplicates and for price aggregation
        query += " GROUP BY a.accomId, a.name, a.accomType, a.description, addr.city, addr.country, addr.street, h.breakfastIncluded, h.acType";

        // Execute the query
        const [ hotels ] = await pool.execute( query, params );

        // Get amenities for each hotel
        const processedHotels = await Promise.all( hotels.map( async hotel => {
            // Get amenities - using correct table names with aliases
            const [ amenities ] = await pool.execute( `
                SELECT 
                    am.amenityType
                FROM 
                    accomAmenityMap map
                JOIN 
                    accommodationAmenities am ON map.amenityId = am.amenityId
                WHERE 
                    map.accomId = UNHEX(?)
            `, [ hotel.hotelId ] );

            // Convert amenities to object with boolean values
            const amenitiesObj = {};
            amenities.forEach( amenity => {
                amenitiesObj[ amenity.amenityType.toLowerCase() ] = true;
            } );

            // Return processed hotel with amenities
            return {
                id: hotel.hotelId,
                name: hotel.name,
                description: hotel.description,
                accomType: hotel.accomType,
                city: hotel.city,
                country: hotel.country,
                address: {
                    street: hotel.street,
                    city: hotel.city,
                    country: hotel.country
                },
                mainPhoto: hotel.mainPhoto,
                roomsAvailable: hotel.roomsAvailable || 0,
                roomTypes: hotel.roomTypes || 0,
                basePrice: hotel.basePrice || 0,
                rating: hotel.rating || 4.0, // Default rating if none available
                breakfastIncluded: hotel.breakfastIncluded === 1,
                acType: hotel.acType,
                amenities: amenitiesObj
            };
        } ) );

        res.status( 200 ).json( {
            success: true,
            count: processedHotels.length,
            data: processedHotels
        } );
    } catch ( error ) {
        console.error( 'Error fetching hotels:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

/**
 * Handles GET request for detailed information about a specific hotel
 */
async function handleHotelDetailGet( req, res ) {
    try {
        const { hotelId } = req.params;

        if ( !hotelId ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Hotel ID is required'
            } );
        }

        // Query to get hotel details
        const [ hotelDetails ] = await pool.execute(
            `SELECT 
                HEX(a.accomId) as hotelId, 
                a.name,
                a.accomType,
                a.phoneNo,
                a.email,
                a.description,
                h.breakfastIncluded,
                h.acType
            FROM 
                accommodations a
            JOIN 
                hotels h ON a.accomId = h.accomId
            WHERE 
                a.accomId = UNHEX(?)`,
            [ hotelId ]
        );

        if ( hotelDetails.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Hotel not found'
            } );
        }

        // Query to get address
        const [ address ] = await pool.execute(
            `SELECT 
                street,
                landmark,
                city,
                state,
                pinCode,
                country
            FROM 
                accommodationaddresses
            WHERE 
                accomId = UNHEX(?)`,
            [ hotelId ]
        );

        // Query to get photos
        const [ photos ] = await pool.execute(
            `SELECT 
                photoUrl
            FROM 
                accommodationphotos
            WHERE 
                accomId = UNHEX(?)`,
            [ hotelId ]
        );

        // Query to get amenities
        const [ amenities ] = await pool.execute(
            `SELECT 
                am.amenityType
            FROM 
                accomAmenityMap map
            JOIN 
                accommodationAmenities am ON map.amenityId = am.amenityId
            WHERE 
                map.accomId = UNHEX(?)`,
            [ hotelId ]
        );

        // Query to get room types
        const [ rooms ] = await pool.execute(
            `SELECT 
                HEX(roomId) as roomId,
                roomType,
                roomsAvailable,
                pplAccommodated,
                roomDescription,
                price
            FROM 
                rooms
            WHERE 
                accomId = UNHEX(?)`,
            [ hotelId ]
        );

        // Convert amenities to object with boolean values
        const amenitiesObj = {};
        amenities.forEach( amenity => {
            amenitiesObj[ amenity.amenityType.toLowerCase() ] = true;
        } );

        // Get reviews if you have that table
        let reviews = [];
        try {
            const [ reviewsResult ] = await pool.execute(
                `SELECT 
                    HEX(reviewId) as reviewId,
                    HEX(userId) as userId,
                    rating,
                    comment,
                    reviewDate,
                    userName
                FROM 
                    reviews
                WHERE 
                    accomId = UNHEX(?)
                ORDER BY 
                    reviewDate DESC`,
                [ hotelId ]
            );
            reviews = reviewsResult;
        } catch ( error ) {
            // Reviews table might not exist yet, just continue
            console.log( "Reviews not available:", error.message );
        }

        // Combine all data
        const hotelData = {
            ...hotelDetails[ 0 ],
            address: address[ 0 ] || {},
            photos: photos.map( p => p.photoUrl ),
            amenities: amenitiesObj,
            rooms: rooms,
            reviews: reviews,
            breakfastIncluded: hotelDetails[ 0 ].breakfastIncluded === 1
        };

        res.status( 200 ).json( {
            success: true,
            data: hotelData
        } );

    } catch ( error ) {
        console.error( 'Error fetching hotel details:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

/**
 * Handles POST request to create a new hotel
 */
async function handleCreateHotel( req, res ) {
    try {
        const {
            name,
            phoneNo,
            email,
            description,
            address,
            breakfastIncluded,
            acType,
            amenities,
            rooms
        } = req.body;

        // Validate required fields
        if ( !name || !phoneNo || !address || !address.city || !address.country ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Missing required fields'
            } );
        }

        // Generate UUIDs
        const accomId = Buffer.from( uuidv4().replace( /-/g, '' ), 'hex' );
        const addressId = Buffer.from( uuidv4().replace( /-/g, '' ), 'hex' );

        // Begin transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Insert into accommodations table
            await connection.execute(
                `INSERT INTO accommodations 
                (accomId, accomType, name, phoneNo, email, description)
                VALUES (?, 'hotel', ?, ?, ?, ?)`,
                [ accomId, name, phoneNo, email || null, description || null ]
            );

            // Insert into hotels table
            await connection.execute(
                `INSERT INTO hotels 
                (accomId, breakfastIncluded, acType)
                VALUES (?, ?, ?)`,
                [ accomId, breakfastIncluded ? 1 : 0, acType || 'BOTH' ]
            );

            // Insert address
            await connection.execute(
                `INSERT INTO accommodationaddresses 
                (addressId, accomId, street, landmark, city, state, pinCode, country)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    addressId,
                    accomId,
                    address.street || '',
                    address.landmark || null,
                    address.city,
                    address.state || null,
                    address.pinCode || null,
                    address.country
                ]
            );

            // Insert amenities if provided
            if ( amenities && Object.keys( amenities ).length > 0 ) {
                for ( const amenity of Object.keys( amenities ) ) {
                    if ( !amenities[ amenity ] ) continue;

                    // Check if amenity exists, if not create it
                    let amenityId;
                    const [ existingAmenity ] = await connection.execute(
                        `SELECT amenityId FROM accommodationAmenities WHERE amenityType = ?`,
                        [ amenity ]
                    );

                    if ( existingAmenity.length === 0 ) {
                        // Create new amenity
                        amenityId = Buffer.from( uuidv4().replace( /-/g, '' ), 'hex' );
                        await connection.execute(
                            `INSERT INTO accommodationAmenities (amenityId, amenityType) VALUES (?, ?)`,
                            [ amenityId, amenity ]
                        );
                    } else {
                        amenityId = existingAmenity[ 0 ].amenityId;
                    }

                    // Map amenity to accommodation
                    await connection.execute(
                        `INSERT INTO accomAmenityMap (accomId, amenityId) VALUES (?, ?)`,
                        [ accomId, amenityId ]
                    );
                }
            }

            // Insert rooms if provided
            if ( rooms && rooms.length > 0 ) {
                for ( const room of rooms ) {
                    const roomId = Buffer.from( uuidv4().replace( /-/g, '' ), 'hex' );
                    await connection.execute(
                        `INSERT INTO rooms 
                        (roomId, accomId, roomType, roomsAvailable, pplAccommodated, roomDescription, price)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
                            roomId,
                            accomId,
                            room.roomType,
                            room.roomsAvailable,
                            room.pplAccommodated,
                            room.roomDescription || null,
                            room.price
                        ]
                    );
                }
            }

            // Commit transaction
            await connection.commit();

            // Return success response
            res.status( 201 ).json( {
                success: true,
                message: 'Hotel created successfully',
                hotelId: accomId.toString( 'hex' ).toUpperCase()
            } );

        } catch ( error ) {
            // Rollback transaction in case of error
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch ( error ) {
        console.error( 'Error creating hotel:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

export { handleHotelListGet, handleHotelDetailGet, handleCreateHotel };