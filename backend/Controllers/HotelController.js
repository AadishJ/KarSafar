import { pool } from '../Config/ConnectDB.js';
import { v4 as uuidv4 } from 'uuid';

async function handleHotelListGet( req, res ) {
    try {
        // Extract query parameters (for filtering)
        const { city, state, country, checkInDate, checkOutDate, guests, amenities } = req.query;

        // Base query to get hotels with their details
        let query = `
            SELECT 
                HEX(a.accomId) as hotelId, 
                a.name as hotelName,
                a.description,
                aa.city,
                aa.state,
                aa.country,
                h.breakfastIncluded,
                h.acType,
                MIN(r.price) as basePrice,
                MAX(r.pplAccommodated) as maxCapacity,
                SUM(r.roomsAvailable) as totalRoomsAvailable
            FROM 
                accommodations a
            JOIN 
                hotels h ON a.accomId = h.accomId
            JOIN 
                accommodationaddresses aa ON a.accomId = aa.accomId
            LEFT JOIN
                rooms r ON a.accomId = r.accomId
            WHERE 
                a.accomType = 'hotel'
        `;

        // Add parameters for filtering
        const params = [];

        if ( city ) {
            query += " AND aa.city LIKE ?";
            params.push( `%${ city }%` );
        }

        if ( state ) {
            query += " AND aa.state LIKE ?";
            params.push( `%${ state }%` );
        }

        if ( country ) {
            query += " AND aa.country LIKE ?";
            params.push( `%${ country }%` );
        }

        if ( guests && !isNaN( parseInt( guests ) ) ) {
            query += " AND r.pplAccommodated >= ?";
            params.push( parseInt( guests ) );
        }

        // Add amenities filter if provided
        if ( amenities ) {
            const amenityList = amenities.split( ',' );
            if ( amenityList.length > 0 ) {
                query += ` AND a.accomId IN (
                    SELECT accomId 
                    FROM accomamenitymap am
                    JOIN accommodationamenities aa ON am.amenityId = aa.amenityId
                    WHERE aa.amenityType IN (${ amenityList.map( () => '?' ).join( ',' ) })
                    GROUP BY accomId
                    HAVING COUNT(DISTINCT aa.amenityType) = ?
                )`;
                params.push( ...amenityList, amenityList.length );
            }
        }

        // Group by to avoid duplicates and for price aggregation
        query += ` GROUP BY 
            a.accomId, 
            a.name, 
            a.description, 
            aa.city, 
            aa.state, 
            aa.country,
            h.breakfastIncluded,
            h.acType`;

        // Execute the query
        const [ hotels ] = await pool.execute( query, params );

        // Get photos for each hotel
        const hotelIds = hotels.map( hotel => hotel.hotelId );

        let photosQuery = `
            SELECT 
                HEX(ap.accomId) as hotelId,
                ap.photoUrl
            FROM 
                accommodationphotos ap
            WHERE 
                ap.accomId IN (${ hotelIds.map( () => 'UNHEX(?)' ).join( ',' ) })
        `;

        const [ photos ] = await pool.execute(
            photosQuery,
            hotelIds
        );

        // Group photos by hotelId
        const photosByHotel = photos.reduce( ( acc, photo ) => {
            if ( !acc[ photo.hotelId ] ) {
                acc[ photo.hotelId ] = [];
            }
            acc[ photo.hotelId ].push( photo.photoUrl );
            return acc;
        }, {} );

        // Process hotel data with photos
        const processedHotels = hotels.map( hotel => ( {
            id: hotel.hotelId,
            name: hotel.hotelName,
            description: hotel.description,
            location: {
                city: hotel.city,
                state: hotel.state,
                country: hotel.country
            },
            amenities: {
                breakfast: hotel.breakfastIncluded ? 'Included' : 'Not included',
                acType: hotel.acType
            },
            rooms: {
                available: hotel.totalRoomsAvailable,
                maxCapacity: hotel.maxCapacity
            },
            basePrice: hotel.basePrice,
            photos: photosByHotel[ hotel.hotelId ] || []
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

// Function to get detailed information about a specific hotel
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
                a.name as hotelName,
                a.description,
                a.phoneNo,
                a.email,
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

        // Query to get hotel address
        const [ addressDetails ] = await pool.execute(
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

        // Query to get hotel photos
        const [ photos ] = await pool.execute(
            `SELECT 
                photoUrl
            FROM 
                accommodationphotos
            WHERE 
                accomId = UNHEX(?)`,
            [ hotelId ]
        );

        // Query to get hotel amenities
        const [ amenities ] = await pool.execute(
            `SELECT 
                aa.amenityType
            FROM 
                accomamenitymap am
            JOIN
                accommodationamenities aa ON am.amenityId = aa.amenityId
            WHERE 
                am.accomId = UNHEX(?)`,
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

        // Combine all data
        const hotelData = {
            ...hotelDetails[ 0 ],
            address: addressDetails[ 0 ] || {},
            photos: photos.map( p => p.photoUrl ),
            amenities: amenities.map( a => a.amenityType ),
            rooms: rooms
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

async function handleHotelRoomAvailabilityGet( req, res ) {
    try {
        const { hotelId } = req.params;
        const { roomId, checkInDate, checkOutDate, guests } = req.query;

        if ( !hotelId ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Hotel ID is required'
            } );
        }

        if ( !checkInDate || !checkOutDate ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Check-in and check-out dates are required'
            } );
        }

        // First verify the hotel exists
        const [ hotelRows ] = await pool.execute(
            `SELECT 
                a.accomId,
                a.name
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

        // Base query for rooms
        let query = `
            SELECT 
                HEX(r.roomId) as roomId,
                r.roomType,
                r.roomDescription,
                r.price,
                r.pplAccommodated,
                r.roomsAvailable - COALESCE(
                    (SELECT COUNT(*) 
                     FROM roombookings rb 
                     WHERE rb.roomId = r.roomId
                     AND ((rb.checkInDate <= ? AND rb.checkOutDate >= ?) OR 
                          (rb.checkInDate <= ? AND rb.checkOutDate >= ?) OR
                          (rb.checkInDate >= ? AND rb.checkOutDate <= ?))
                     AND rb.status NOT IN ('cancelled', 'rejected')
                    ), 0
                ) as availableRooms
            FROM 
                rooms r
            WHERE 
                r.accomId = UNHEX(?)
        `;

        const params = [
            checkOutDate, checkOutDate, // First condition
            checkInDate, checkInDate,   // Second condition
            checkInDate, checkOutDate,  // Third condition
            hotelId
        ];

        // Add room-specific filter if provided
        if ( roomId ) {
            query += " AND r.roomId = UNHEX(?)";
            params.push( roomId );
        }

        // Add guests filter if provided
        if ( guests && !isNaN( parseInt( guests ) ) ) {
            query += " AND r.pplAccommodated >= ?";
            params.push( parseInt( guests ) );
        }

        // Execute the query
        const [ rooms ] = await pool.execute( query, params );

        // Format the response
        const formattedRooms = rooms.map( room => ( {
            roomId: room.roomId,
            roomType: room.roomType,
            description: room.roomDescription,
            price: room.price,
            capacity: room.pplAccommodated,
            availableRooms: room.availableRooms
        } ) );

        return res.status( 200 ).json( {
            success: true,
            message: 'Room availability retrieved successfully',
            data: formattedRooms
        } );

    } catch ( error ) {
        console.error( 'Error fetching room availability:', error );
        return res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

async function handleHotelCreate( req, res ) {
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
            rooms,
            photos
        } = req.body;

        // Validate required fields
        if ( !name || !phoneNo || !address || !address.city || !address.country ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Required fields missing'
            } );
        }

        // Start transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Create accommodation record
            const accomId = Buffer.from( uuidv4().replace( /-/g, '' ), 'hex' );

            await connection.execute(
                `INSERT INTO accommodations 
                (accomId, accomType, name, phoneNo, email, description) 
                VALUES (?, 'hotel', ?, ?, ?, ?)`,
                [ accomId, name, phoneNo, email || null, description || null ]
            );

            // Create hotel record
            await connection.execute(
                `INSERT INTO hotels
                (accomId, breakfastIncluded, acType)
                VALUES (?, ?, ?)`,
                [ accomId, breakfastIncluded || false, acType || 'BOTH' ]
            );

            // Create address record
            await connection.execute(
                `INSERT INTO accommodationaddresses
                (addressId, accomId, street, landmark, city, state, pinCode, country)
                VALUES (UNHEX(REPLACE(UUID(), '-', '')), ?, ?, ?, ?, ?, ?, ?)`,
                [
                    accomId,
                    address.street || '',
                    address.landmark || null,
                    address.city,
                    address.state || null,
                    address.pinCode || null,
                    address.country
                ]
            );

            // Add amenities if provided
            if ( amenities && amenities.length > 0 ) {
                for ( const amenity of amenities ) {
                    // Check if amenity exists, if not create it
                    let [ amenityRows ] = await connection.execute(
                        `SELECT amenityId FROM accommodationamenities WHERE amenityType = ?`,
                        [ amenity ]
                    );

                    let amenityId;
                    if ( amenityRows.length === 0 ) {
                        // Create new amenity
                        amenityId = Buffer.from( uuidv4().replace( /-/g, '' ), 'hex' );
                        await connection.execute(
                            `INSERT INTO accommodationamenities (amenityId, amenityType) VALUES (?, ?)`,
                            [ amenityId, amenity ]
                        );
                    } else {
                        amenityId = amenityRows[ 0 ].amenityId;
                    }

                    // Map amenity to accommodation
                    await connection.execute(
                        `INSERT INTO accomamenitymap (accomId, amenityId) VALUES (?, ?)`,
                        [ accomId, amenityId ]
                    );
                }
            }

            // Add rooms if provided
            if ( rooms && rooms.length > 0 ) {
                for ( const room of rooms ) {
                    await connection.execute(
                        `INSERT INTO rooms
                        (roomId, accomId, roomType, roomsAvailable, pplAccommodated, roomDescription, price)
                        VALUES (UNHEX(REPLACE(UUID(), '-', '')), ?, ?, ?, ?, ?, ?)`,
                        [
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

            // Add photos if provided
            if ( photos && photos.length > 0 ) {
                for ( const photoUrl of photos ) {
                    await connection.execute(
                        `INSERT INTO accommodationphotos
                        (photoId, accomId, photoUrl)
                        VALUES (UNHEX(REPLACE(UUID(), '-', '')), ?, ?)`,
                        [ accomId, photoUrl ]
                    );
                }
            }

            // Commit transaction
            await connection.commit();

            res.status( 201 ).json( {
                success: true,
                message: 'Hotel created successfully',
                data: {
                    hotelId: Buffer.from( accomId ).toString( 'hex' )
                }
            } );

        } catch ( error ) {
            // Rollback on error
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

export {
    handleHotelListGet,
    handleHotelDetailGet,
    handleHotelRoomAvailabilityGet,
    handleHotelCreate
};