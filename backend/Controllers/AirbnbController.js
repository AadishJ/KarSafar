import { pool } from '../Config/ConnectDB.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Handles GET request for listing Airbnbs based on search criteria
 */
async function handleAirbnbListGet( req, res ) {
    try {
        // Extract query parameters (for filtering)
        const { location, checkInDate, checkOutDate, guests } = req.query;

        // Base query to get airbnbs with their details
        let query = `
            SELECT 
                HEX(a.accomId) as airbnbId, 
                a.name,
                a.accomType,
                a.description,
                addr.city,
                addr.country,
                addr.street,
                ab.maxAllowedGuests,
                MIN(r.price) as basePrice,
                COUNT(DISTINCT r.roomId) as roomCount,
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
                airbnbs ab ON a.accomId = ab.accomId
            JOIN 
                accommodationaddresses addr ON a.accomId = addr.accomId
            LEFT JOIN
                rooms r ON a.accomId = r.accomId
            WHERE 
                a.accomType = 'airbnb'
        `;

        // Add parameters for filtering
        const params = [];

        // Filter by location (city or country)
        if ( location ) {
            query += " AND (addr.city LIKE ? OR addr.country LIKE ?)";
            params.push( `%${ location }%`, `%${ location }%` );
        }

        // Filter by guest capacity
        if ( guests ) {
            query += " AND ab.maxAllowedGuests >= ?";
            params.push( parseInt( guests ) );
        }

        // Group by to avoid duplicates and for price aggregation
        query += " GROUP BY a.accomId, a.name, a.accomType, a.description, addr.city, addr.country, addr.street, ab.maxAllowedGuests";

        // Execute the query
        const [ airbnbs ] = await pool.execute( query, params );

        // Get amenities for each airbnb
        const processedAirbnbs = await Promise.all( airbnbs.map( async airbnb => {
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
            `, [ airbnb.airbnbId ] );

            // Convert amenities to object with boolean values
            const amenitiesObj = {};
            amenities.forEach( amenity => {
                amenitiesObj[ amenity.amenityType.toLowerCase() ] = true;
            } );

            // Return processed airbnb with amenities
            return {
                id: airbnb.airbnbId,
                name: airbnb.name,
                description: airbnb.description,
                accomType: airbnb.accomType,
                city: airbnb.city,
                country: airbnb.country,
                address: {
                    street: airbnb.street,
                    city: airbnb.city,
                    country: airbnb.country
                },
                mainPhoto: airbnb.mainPhoto,
                maxAllowedGuests: airbnb.maxAllowedGuests,
                roomCount: airbnb.roomCount || 0,
                basePrice: airbnb.basePrice || 0,
                rating: airbnb.rating || 4.0, // Default rating if none available
                amenities: amenitiesObj,
                entirePlace: true // Most Airbnbs are entire places, can be adjusted if your schema tracks this
            };
        } ) );

        res.status( 200 ).json( {
            success: true,
            count: processedAirbnbs.length,
            data: processedAirbnbs
        } );
    } catch ( error ) {
        console.error( 'Error fetching airbnbs:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

/**
 * Handles GET request for detailed information about a specific airbnb
 */
async function handleAirbnbDetailGet( req, res ) {
    try {
        const { airbnbId } = req.params;

        if ( !airbnbId ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Airbnb ID is required'
            } );
        }

        // Query to get airbnb details
        const [ airbnbDetails ] = await pool.execute(
            `SELECT 
                HEX(a.accomId) as airbnbId, 
                a.name,
                a.accomType,
                a.phoneNo,
                a.email,
                a.description,
                ab.maxAllowedGuests
            FROM 
                accommodations a
            JOIN 
                airbnbs ab ON a.accomId = ab.accomId
            WHERE 
                a.accomId = UNHEX(?)`,
            [ airbnbId ]
        );

        if ( airbnbDetails.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Airbnb not found'
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
                accommodationaddresses addr
            WHERE 
                addr.accomId = UNHEX(?)`,
            [ airbnbId ]
        );

        // Query to get photos
        const [ photos ] = await pool.execute(
            `SELECT 
                photoUrl
            FROM 
                accommodationphotos photos
            WHERE 
                photos.accomId = UNHEX(?)`,
            [ airbnbId ]
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
            [ airbnbId ]
        );

        // Convert amenities to object with boolean values
        const amenitiesObj = {};
        amenities.forEach( amenity => {
            amenitiesObj[ amenity.amenityType.toLowerCase() ] = true;
        } );

        // Query to get room details - Airbnbs might have bedrooms, etc.
        const [ rooms ] = await pool.execute(
            `SELECT 
                HEX(roomId) as roomId,
                roomType,
                roomsAvailable,
                pplAccommodated,
                roomDescription,
                price
            FROM 
                rooms r
            WHERE 
                r.accomId = UNHEX(?)`,
            [ airbnbId ]
        );

        // Get reviews
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
                    reviews r
                WHERE 
                    r.itemType = 'accommodation' AND r.itemId = UNHEX(?)
                ORDER BY 
                    reviewDate DESC`,
                [ airbnbId ]
            );
            reviews = reviewsResult;
        } catch ( error ) {
            console.error( "Reviews not available:", error.message );
        }

        // Combine all data
        const airbnbData = {
            ...airbnbDetails[ 0 ],
            address: address[ 0 ] || {},
            photos: photos.map( p => p.photoUrl ),
            amenities: amenitiesObj,
            rooms: rooms,
            reviews: reviews,
            houseRules: {
                noSmoking: true,
                noPets: false,
                noParties: true,
                checkInTime: "After 2:00 PM",
                checkOutTime: "Before 11:00 AM"
            }, // Example data, adjust based on your schema
            hostInfo: {
                responseRate: "95%",
                averageResponseTime: "1 hour",
                memberSince: "January 2020"
            } // Example data, adjust based on your schema
        };

        res.status( 200 ).json( {
            success: true,
            data: airbnbData
        } );

    } catch ( error ) {
        console.error( 'Error fetching airbnb details:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

/**
 * Handles POST request to create a new airbnb
 */
async function handleCreateAirbnb( req, res ) {
    try {
        const {
            name,
            phoneNo,
            email,
            description,
            address,
            maxAllowedGuests,
            amenities,
            rooms
        } = req.body;

        // Validate required fields
        if ( !name || !phoneNo || !address || !address.city || !address.country || !maxAllowedGuests ) {
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
                VALUES (?, 'airbnb', ?, ?, ?, ?)`,
                [ accomId, name, phoneNo, email || null, description || null ]
            );

            // Insert into airbnbs table
            await connection.execute(
                `INSERT INTO airbnbs 
                (accomId, maxAllowedGuests)
                VALUES (?, ?)`,
                [ accomId, maxAllowedGuests ]
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

            // Insert rooms/spaces if provided
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
                            room.roomType || 'Bedroom',
                            room.roomsAvailable || 1,
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
                message: 'Airbnb created successfully',
                airbnbId: accomId.toString( 'hex' ).toUpperCase()
            } );

        } catch ( error ) {
            // Rollback transaction in case of error
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch ( error ) {
        console.error( 'Error creating airbnb:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

export { handleAirbnbListGet, handleAirbnbDetailGet, handleCreateAirbnb };