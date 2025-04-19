import { pool } from '../Config/ConnectDB.js';
import { v4 as uuidv4 } from 'uuid';

async function handleAirbnbListGet( req, res ) {
    try {
        // Extract query parameters (for filtering)
        const { city, state, country, checkInDate, checkOutDate, guests, amenities } = req.query;

        // Base query to get airbnbs with their details
        let query = `
            SELECT 
                HEX(a.accomId) as airbnbId, 
                a.name as propertyName,
                a.description,
                aa.city,
                aa.state,
                aa.country,
                ab.maxAllowedGuests,
                MIN(r.price) as basePrice
            FROM 
                accommodations a
            JOIN 
                airbnbs ab ON a.accomId = ab.accomId
            JOIN 
                accommodationaddresses aa ON a.accomId = aa.accomId
            LEFT JOIN
                rooms r ON a.accomId = r.accomId
            WHERE 
                a.accomType = 'airbnb'
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
            query += " AND ab.maxAllowedGuests >= ?";
            params.push( parseInt( guests ) );
        }

        // Add availability filter if check-in and check-out dates are provided
        if ( checkInDate && checkOutDate ) {
            query += ` AND a.accomId NOT IN (
                SELECT DISTINCT r.accomId
                FROM rooms r
                JOIN roombookings rb ON r.roomId = rb.roomId
                WHERE rb.status NOT IN ('cancelled', 'rejected')
                AND ((rb.checkInDate <= ? AND rb.checkOutDate >= ?) OR 
                     (rb.checkInDate <= ? AND rb.checkOutDate >= ?) OR
                     (rb.checkInDate >= ? AND rb.checkOutDate <= ?))
            )`;
            params.push(
                checkOutDate, checkOutDate, // First condition
                checkInDate, checkInDate,   // Second condition
                checkInDate, checkOutDate   // Third condition
            );
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
            ab.maxAllowedGuests`;

        // Execute the query
        const [ airbnbs ] = await pool.execute( query, params );

        // Get photos for each airbnb
        const airbnbIds = airbnbs.map( airbnb => airbnb.airbnbId );

        if ( airbnbIds.length === 0 ) {
            return res.status( 200 ).json( {
                success: true,
                count: 0,
                data: []
            } );
        }

        let photosQuery = `
            SELECT 
                HEX(ap.accomId) as airbnbId,
                ap.photoUrl
            FROM 
                accommodationphotos ap
            WHERE 
                ap.accomId IN (${ airbnbIds.map( () => 'UNHEX(?)' ).join( ',' ) })
        `;

        const [ photos ] = await pool.execute(
            photosQuery,
            airbnbIds
        );

        // Group photos by airbnbId
        const photosByAirbnb = photos.reduce( ( acc, photo ) => {
            if ( !acc[ photo.airbnbId ] ) {
                acc[ photo.airbnbId ] = [];
            }
            acc[ photo.airbnbId ].push( photo.photoUrl );
            return acc;
        }, {} );

        // Get amenities for each airbnb
        let amenitiesQuery = `
            SELECT 
                HEX(am.accomId) as airbnbId,
                aa.amenityType
            FROM 
                accomamenitymap am
            JOIN
                accommodationamenities aa ON am.amenityId = aa.amenityId
            WHERE 
                am.accomId IN (${ airbnbIds.map( () => 'UNHEX(?)' ).join( ',' ) })
        `;

        const [ allAmenities ] = await pool.execute(
            amenitiesQuery,
            airbnbIds
        );

        // Group amenities by airbnbId
        const amenitiesByAirbnb = allAmenities.reduce( ( acc, item ) => {
            if ( !acc[ item.airbnbId ] ) {
                acc[ item.airbnbId ] = [];
            }
            acc[ item.airbnbId ].push( item.amenityType );
            return acc;
        }, {} );

        // Process airbnb data with photos and amenities
        const processedAirbnbs = airbnbs.map( airbnb => ( {
            id: airbnb.airbnbId,
            name: airbnb.propertyName,
            description: airbnb.description,
            location: {
                city: airbnb.city,
                state: airbnb.state,
                country: airbnb.country
            },
            maxGuests: airbnb.maxAllowedGuests,
            basePrice: airbnb.basePrice,
            photos: photosByAirbnb[ airbnb.airbnbId ] || [],
            amenities: amenitiesByAirbnb[ airbnb.airbnbId ] || []
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

// Function to get detailed information about a specific airbnb
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
                a.name as propertyName,
                a.description,
                a.phoneNo,
                a.email,
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

        // Query to get airbnb address
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
            [ airbnbId ]
        );

        // Query to get airbnb photos
        const [ photos ] = await pool.execute(
            `SELECT 
                photoUrl
            FROM 
                accommodationphotos
            WHERE 
                accomId = UNHEX(?)`,
            [ airbnbId ]
        );

        // Query to get airbnb amenities
        const [ amenities ] = await pool.execute(
            `SELECT 
                aa.amenityType
            FROM 
                accomamenitymap am
            JOIN
                accommodationamenities aa ON am.amenityId = aa.amenityId
            WHERE 
                am.accomId = UNHEX(?)`,
            [ airbnbId ]
        );

        // Query to get room types (for airbnbs, this typically means bedrooms/spaces)
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
            [ airbnbId ]
        );

        // Get host information if available (assuming there's a way to link to a host profile)
        const [ hostInfo ] = await pool.execute(
            `SELECT 
                u.name as hostName,
                u.email as hostEmail,
                HEX(u.userId) as hostId,
                u.profilePic as hostProfilePic
            FROM 
                accommodations a
            JOIN 
                users u ON a.hostId = u.userId
            WHERE 
                a.accomId = UNHEX(?)`,
            [ airbnbId ]
        );

        // Combine all data
        const airbnbData = {
            ...airbnbDetails[ 0 ],
            address: addressDetails[ 0 ] || {},
            photos: photos.map( p => p.photoUrl ),
            amenities: amenities.map( a => a.amenityType ),
            rooms: rooms,
            host: hostInfo[ 0 ] || null
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

async function handleAirbnbAvailabilityCheck( req, res ) {
    try {
        const { airbnbId } = req.params;
        const { checkInDate, checkOutDate, guests } = req.query;

        if ( !airbnbId ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Airbnb ID is required'
            } );
        }

        if ( !checkInDate || !checkOutDate ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Check-in and check-out dates are required'
            } );
        }

        // First verify the airbnb exists
        const [ airbnbRows ] = await pool.execute(
            `SELECT 
                a.accomId,
                a.name,
                ab.maxAllowedGuests
            FROM 
                accommodations a
            JOIN
                airbnbs ab ON a.accomId = ab.accomId
            WHERE 
                a.accomId = UNHEX(?) 
                AND a.accomType = 'airbnb'`,
            [ airbnbId ]
        );

        if ( airbnbRows.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Airbnb not found'
            } );
        }

        // Check if airbnb can accommodate the requested number of guests
        if ( guests && parseInt( guests ) > airbnbRows[ 0 ].maxAllowedGuests ) {
            return res.status( 400 ).json( {
                success: false,
                message: `This property can only accommodate up to ${ airbnbRows[ 0 ].maxAllowedGuests } guests`
            } );
        }

        // Check if the airbnb is available for the requested dates
        const [ bookings ] = await pool.execute(
            `SELECT 
                COUNT(*) as bookingCount
            FROM 
                rooms r
            JOIN 
                roombookings rb ON r.roomId = rb.roomId
            WHERE 
                r.accomId = UNHEX(?)
                AND rb.status NOT IN ('cancelled', 'rejected')
                AND ((rb.checkInDate <= ? AND rb.checkOutDate >= ?) OR 
                     (rb.checkInDate <= ? AND rb.checkOutDate >= ?) OR
                     (rb.checkInDate >= ? AND rb.checkOutDate <= ?))`,
            [
                airbnbId,
                checkOutDate, checkOutDate, // First condition
                checkInDate, checkInDate,   // Second condition
                checkInDate, checkOutDate   // Third condition
            ]
        );

        const isAvailable = bookings[ 0 ].bookingCount === 0;

        // Get pricing information
        const [ pricingInfo ] = await pool.execute(
            `SELECT 
                MIN(price) as basePrice,
                MAX(price) as maxPrice
            FROM 
                rooms
            WHERE 
                accomId = UNHEX(?)`,
            [ airbnbId ]
        );

        return res.status( 200 ).json( {
            success: true,
            data: {
                isAvailable,
                propertyName: airbnbRows[ 0 ].name,
                maxGuests: airbnbRows[ 0 ].maxAllowedGuests,
                pricing: {
                    basePrice: pricingInfo[ 0 ].basePrice,
                    maxPrice: pricingInfo[ 0 ].maxPrice
                }
            }
        } );

    } catch ( error ) {
        console.error( 'Error checking airbnb availability:', error );
        return res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

async function handleAirbnbCreate( req, res ) {
    try {
        const {
            name,
            phoneNo,
            email,
            description,
            address,
            maxAllowedGuests,
            amenities,
            rooms,
            photos,
            hostId
        } = req.body;

        // Validate required fields
        if ( !name || !phoneNo || !address || !address.city || !address.country || !maxAllowedGuests ) {
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
                (accomId, accomType, name, phoneNo, email, description, hostId) 
                VALUES (?, 'airbnb', ?, ?, ?, ?, UNHEX(?))`,
                [ accomId, name, phoneNo, email || null, description || null, hostId || null ]
            );

            // Create airbnb record
            await connection.execute(
                `INSERT INTO airbnbs
                (accomId, maxAllowedGuests)
                VALUES (?, ?)`,
                [ accomId, maxAllowedGuests ]
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

            // Add rooms/spaces if provided
            if ( rooms && rooms.length > 0 ) {
                for ( const room of rooms ) {
                    await connection.execute(
                        `INSERT INTO rooms
                        (roomId, accomId, roomType, roomsAvailable, pplAccommodated, roomDescription, price)
                        VALUES (UNHEX(REPLACE(UUID(), '-', '')), ?, ?, ?, ?, ?, ?)`,
                        [
                            accomId,
                            room.roomType || 'Entire space',
                            room.roomsAvailable || 1,
                            room.pplAccommodated || maxAllowedGuests,
                            room.roomDescription || null,
                            room.price
                        ]
                    );
                }
            } else {
                // Create at least one default room/space entry
                await connection.execute(
                    `INSERT INTO rooms
                    (roomId, accomId, roomType, roomsAvailable, pplAccommodated, roomDescription, price)
                    VALUES (UNHEX(REPLACE(UUID(), '-', '')), ?, ?, ?, ?, ?, ?)`,
                    [
                        accomId,
                        'Entire space',
                        1,
                        maxAllowedGuests,
                        'The entire property',
                        req.body.price || 2000 // Default price if not specified
                    ]
                );
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
                message: 'Airbnb property created successfully',
                data: {
                    airbnbId: Buffer.from( accomId ).toString( 'hex' )
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
        console.error( 'Error creating airbnb:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

export {
    handleAirbnbListGet,
    handleAirbnbDetailGet,
    handleAirbnbAvailabilityCheck,
    handleAirbnbCreate
};