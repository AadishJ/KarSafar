import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

// Get the directory name properly in ESM
const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

// Load environment variables
const envPath = path.resolve( __dirname, '../.env' );
dotenv.config( { path: envPath } );

// Create a dedicated database connection for this script
const pool = mysql.createPool( {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
} );

// Log connection info
console.log( 'Database connection info:' );
console.log( `Host: ${ process.env.DB_HOST || 'localhost' }` );
console.log( `User: ${ process.env.DB_USER || 'root' }` );
console.log( `Database: ${ process.env.DB_NAME || '' }` );

// Helper function to format UUID for MySQL UNHEX
const formatUuidForUnhex = ( uuid ) => {
    return uuid.replace( /-/g, '' );
};

// Test the database connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log( 'Database connection successful!' );
        connection.release();
        return true;
    } catch ( error ) {
        console.error( 'Database connection test failed:', error.message );
        return false;
    }
};

// Helper function to clear existing hotel-related data
const clearExistingData = async () => {
    try {
        console.log( 'Checking for existing hotel data to clear...' );

        // Check for each table
        const [ roomsCount ] = await pool.execute( 'SELECT COUNT(*) as count FROM rooms' );
        const [ hotelsCount ] = await pool.execute( 'SELECT COUNT(*) as count FROM hotels' );
        const [ accomPhotoCount ] = await pool.execute( 'SELECT COUNT(*) as count FROM accommodationphotos' );
        const [ accomAmenityMapCount ] = await pool.execute( 'SELECT COUNT(*) as count FROM accomamenitymap' );
        const [ accomAddressCount ] = await pool.execute( 'SELECT COUNT(*) as count FROM accommodationaddresses' );
        const [ accommodationCount ] = await pool.execute( 'SELECT COUNT(*) as count FROM accommodations' );

        // Delete in the correct order to respect foreign key constraints
        if ( roomsCount[ 0 ].count > 0 ) {
            console.log( `Found ${ roomsCount[ 0 ].count } existing room records to clear.` );
            await pool.execute( 'DELETE FROM rooms' );
            console.log( 'Existing room data cleared successfully.' );
        }

        if ( accomPhotoCount[ 0 ].count > 0 ) {
            console.log( `Found ${ accomPhotoCount[ 0 ].count } existing accommodation photo records to clear.` );
            await pool.execute( 'DELETE FROM accommodationphotos' );
            console.log( 'Existing accommodation photo data cleared successfully.' );
        }

        if ( accomAmenityMapCount[ 0 ].count > 0 ) {
            console.log( `Found ${ accomAmenityMapCount[ 0 ].count } existing accommodation amenity map records to clear.` );
            await pool.execute( 'DELETE FROM accomamenitymap' );
            console.log( 'Existing accommodation amenity map data cleared successfully.' );
        }

        if ( hotelsCount[ 0 ].count > 0 ) {
            console.log( `Found ${ hotelsCount[ 0 ].count } existing hotel records to clear.` );
            await pool.execute( 'DELETE FROM hotels' );
            console.log( 'Existing hotel data cleared successfully.' );
        }

        if ( accomAddressCount[ 0 ].count > 0 ) {
            console.log( `Found ${ accomAddressCount[ 0 ].count } existing accommodation address records to clear.` );
            await pool.execute( 'DELETE FROM accommodationaddresses' );
            console.log( 'Existing accommodation address data cleared successfully.' );
        }

        if ( accommodationCount[ 0 ].count > 0 ) {
            console.log( `Found ${ accommodationCount[ 0 ].count } existing accommodation records to clear.` );
            await pool.execute( 'DELETE FROM accommodations' );
            console.log( 'Existing accommodation data cleared successfully.' );
        }

    } catch ( error ) {
        console.error( 'Error clearing existing data:', error );
        throw error;
    }
};

// Setup amenities
const setupAmenities = async () => {
    try {
        console.log( 'Setting up amenities...' );

        // Define common amenities
        const amenities = [
            { id: formatUuidForUnhex( uuidv4() ), type: 'WiFi' },
            { id: formatUuidForUnhex( uuidv4() ), type: 'Swimming Pool' },
            { id: formatUuidForUnhex( uuidv4() ), type: 'Parking' },
            { id: formatUuidForUnhex( uuidv4() ), type: 'Restaurant' },
            { id: formatUuidForUnhex( uuidv4() ), type: 'Gym' },
            { id: formatUuidForUnhex( uuidv4() ), type: 'Spa' },
            { id: formatUuidForUnhex( uuidv4() ), type: 'Room Service' },
            { id: formatUuidForUnhex( uuidv4() ), type: 'Conference Room' },
            { id: formatUuidForUnhex( uuidv4() ), type: 'Beach Access' },
            { id: formatUuidForUnhex( uuidv4() ), type: 'Airport Shuttle' },
            { id: formatUuidForUnhex( uuidv4() ), type: 'Air Conditioning' },
            { id: formatUuidForUnhex( uuidv4() ), type: 'Laundry Service' },
            { id: formatUuidForUnhex( uuidv4() ), type: 'Breakfast' },
            { id: formatUuidForUnhex( uuidv4() ), type: 'Ocean View' }
        ];

        console.log( `Setting up ${ amenities.length } standard amenities...` );

        const amenityIds = {};

        for ( const amenity of amenities ) {
            try {
                // Insert into accommodationamenities table
                await pool.execute(
                    'INSERT INTO accommodationamenities (amenityId, amenityType) VALUES (UNHEX(?), ?)',
                    [ amenity.id, amenity.type ]
                );

                // Store the ID for later use in mappings
                amenityIds[ amenity.type ] = amenity.id;
                console.log( `Added amenity: ${ amenity.type }` );
            } catch ( err ) {
                console.warn( `Error setting up amenity ${ amenity.type }: ${ err.message }` );
            }
        }

        // Verify insertion
        const [ countResult ] = await pool.execute( 'SELECT COUNT(*) as total FROM accommodationamenities' );
        console.log( `Total amenities in database: ${ countResult[ 0 ].total }` );

        return amenityIds;
    } catch ( error ) {
        console.error( 'Error setting up amenities:', error );
        return {};
    }
};

// Create and insert mock hotel data
const createMockHotels = async ( amenityIds ) => {
    try {
        console.log( 'Creating mock hotel data...' );

        // Create two mock hotels with fixed IDs
        const hotels = [
            {
                accomId: '191F5B3C7A6D422F8E9D103CA56E84C9',
                name: 'Royal Palace Hotel',
                phoneNo: '+91-9876543210',
                email: 'reservations@royalpalacehotel.com',
                description: 'Experience luxury in the heart of the city. Royal Palace Hotel offers spacious rooms, gourmet dining, and world-class amenities including a rooftop pool, full-service spa, and 24-hour concierge service. Perfect for business travelers and tourists alike.',
                breakfastIncluded: true,
                acType: 'BOTH',
                address: {
                    addressId: formatUuidForUnhex( uuidv4() ),
                    street: '42 Luxury Avenue',
                    landmark: 'Near Central Park',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    pinCode: '400001',
                    country: 'India'
                },
                photos: [
                    { photoId: formatUuidForUnhex( uuidv4() ), photoUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&q=80' },
                    { photoId: formatUuidForUnhex( uuidv4() ), photoUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&q=80' },
                    { photoId: formatUuidForUnhex( uuidv4() ), photoUrl: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&q=80' },
                    { photoId: formatUuidForUnhex( uuidv4() ), photoUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&q=80' }
                ],
                amenities: [ 'WiFi', 'Swimming Pool', 'Parking', 'Restaurant', 'Gym', 'Spa', 'Room Service', 'Conference Room' ],
                rooms: [
                    {
                        roomId: formatUuidForUnhex( uuidv4() ),
                        roomType: 'Deluxe King',
                        roomsAvailable: 10,
                        pplAccommodated: 2,
                        roomDescription: 'Elegant room featuring a king-size bed, marble bathroom with jacuzzi, work desk, and city views. Includes high-speed WiFi and 55-inch smart TV.',
                        price: 12500.00
                    },
                    {
                        roomId: formatUuidForUnhex( uuidv4() ),
                        roomType: 'Executive Suite',
                        roomsAvailable: 5,
                        pplAccommodated: 3,
                        roomDescription: 'Spacious suite with separate living area, king-size bed, premium bath amenities, complimentary minibar, and panoramic city views. Includes executive lounge access.',
                        price: 22000.00
                    },
                    {
                        roomId: formatUuidForUnhex( uuidv4() ),
                        roomType: 'Family Room',
                        roomsAvailable: 8,
                        pplAccommodated: 4,
                        roomDescription: 'Comfortable family accommodation with two queen beds, extra seating area, children\'s amenities, and connecting room option. Includes breakfast for four.',
                        price: 18500.00
                    },
                    {
                        roomId: formatUuidForUnhex( uuidv4() ),
                        roomType: 'Presidential Suite',
                        roomsAvailable: 2,
                        pplAccommodated: 6,
                        roomDescription: 'Luxury suite spanning 120 sq meters with king bedroom, separate living and dining areas, kitchenette, marble bathroom with sauna, and butler service. Includes airport transfers.',
                        price: 45000.00
                    }
                ]
            },
            {
                accomId: '284A6DE9F3BC51728A405D6BF892E471',
                name: 'Serenity Bay Resort',
                phoneNo: '+91-8765432109',
                email: 'bookings@serenitybayresort.com',
                description: 'Escape to tranquility at Serenity Bay Resort. Located along pristine beaches, our resort features elegant accommodations with ocean views, multiple restaurants serving local and international cuisine, an infinity pool, and a wellness center offering rejuvenating treatments.',
                breakfastIncluded: true,
                acType: 'AC',
                address: {
                    addressId: formatUuidForUnhex( uuidv4() ),
                    street: '156 Coastal Highway',
                    landmark: 'Juhu Beach',
                    city: 'Goa',
                    state: 'Goa',
                    pinCode: '403001',
                    country: 'India'
                },
                photos: [
                    { photoId: formatUuidForUnhex( uuidv4() ), photoUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&q=80' },
                    { photoId: formatUuidForUnhex( uuidv4() ), photoUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&q=80' },
                    { photoId: formatUuidForUnhex( uuidv4() ), photoUrl: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&q=80' },
                    { photoId: formatUuidForUnhex( uuidv4() ), photoUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&q=80' }
                ],
                amenities: [ 'WiFi', 'Swimming Pool', 'Beach Access', 'Restaurant', 'Spa', 'Room Service', 'Ocean View', 'Air Conditioning' ],
                rooms: [
                    {
                        roomId: formatUuidForUnhex( uuidv4() ),
                        roomType: 'Ocean View Room',
                        roomsAvailable: 15,
                        pplAccommodated: 2,
                        roomDescription: 'Serene room with balcony offering unobstructed ocean views, king or twin beds, rain shower, and locally crafted furniture. Includes daily sunset cocktails.',
                        price: 15000.00
                    },
                    {
                        roomId: formatUuidForUnhex( uuidv4() ),
                        roomType: 'Garden Villa',
                        roomsAvailable: 12,
                        pplAccommodated: 3,
                        roomDescription: 'Private villa surrounded by tropical gardens with outdoor shower, king bed, daybed, and private patio. Includes bicycle rental and daily fresh fruit basket.',
                        price: 20000.00
                    },
                    {
                        roomId: formatUuidForUnhex( uuidv4() ),
                        roomType: 'Beach Front Suite',
                        roomsAvailable: 8,
                        pplAccommodated: 4,
                        roomDescription: 'Premium suite steps from the shore with floor-to-ceiling windows, king bed, sofa bed, outdoor dining area, and direct beach access. Includes personal beach cabana.',
                        price: 28500.00
                    },
                    {
                        roomId: formatUuidForUnhex( uuidv4() ),
                        roomType: 'Luxury Pool Villa',
                        roomsAvailable: 4,
                        pplAccommodated: 6,
                        roomDescription: 'Exclusive two-bedroom villa with private infinity pool, fully stocked kitchen, outdoor dining pavilion, and dedicated host. Includes in-villa dining options and spa treatments.',
                        price: 40000.00
                    }
                ]
            }
        ];

        // Insert hotel data into database
        for ( const hotel of hotels ) {
            const formattedAccomId = formatUuidForUnhex( hotel.accomId );

            console.log( `Inserting hotel: ${ hotel.name }` );

            // Insert into accommodations table
            await pool.execute(
                'INSERT INTO accommodations (accomId, accomType, name, phoneNo, email, description) VALUES (UNHEX(?), ?, ?, ?, ?, ?)',
                [
                    formattedAccomId,
                    'hotel',
                    hotel.name,
                    hotel.phoneNo,
                    hotel.email,
                    hotel.description
                ]
            );

            // Insert into hotels table
            await pool.execute(
                'INSERT INTO hotels (accomId, breakfastIncluded, acType) VALUES (UNHEX(?), ?, ?)',
                [
                    formattedAccomId,
                    hotel.breakfastIncluded,
                    hotel.acType
                ]
            );

            // Insert address
            await pool.execute(
                'INSERT INTO accommodationaddresses (addressId, accomId, street, landmark, city, state, pinCode, country) VALUES (UNHEX(?), UNHEX(?), ?, ?, ?, ?, ?, ?)',
                [
                    hotel.address.addressId,
                    formattedAccomId,
                    hotel.address.street,
                    hotel.address.landmark,
                    hotel.address.city,
                    hotel.address.state,
                    hotel.address.pinCode,
                    hotel.address.country
                ]
            );

            // Insert photos
            for ( const photo of hotel.photos ) {
                await pool.execute(
                    'INSERT INTO accommodationphotos (photoId, accomId, photoUrl) VALUES (UNHEX(?), UNHEX(?), ?)',
                    [
                        photo.photoId,
                        formattedAccomId,
                        photo.photoUrl
                    ]
                );
            }

            // Insert amenity mappings
            for ( const amenityType of hotel.amenities ) {
                if ( amenityIds[ amenityType ] ) {
                    await pool.execute(
                        'INSERT INTO accomamenitymap (accomId, amenityId) VALUES (UNHEX(?), UNHEX(?))',
                        [
                            formattedAccomId,
                            amenityIds[ amenityType ]
                        ]
                    );
                }
            }

            // Insert rooms
            for ( const room of hotel.rooms ) {
                await pool.execute(
                    'INSERT INTO rooms (roomId, accomId, roomType, roomsAvailable, pplAccommodated, roomDescription, price) VALUES (UNHEX(?), UNHEX(?), ?, ?, ?, ?, ?)',
                    [
                        room.roomId,
                        formattedAccomId,
                        room.roomType,
                        room.roomsAvailable,
                        room.pplAccommodated,
                        room.roomDescription,
                        room.price
                    ]
                );
            }
        }

        console.log( 'Mock hotel data creation complete!' );
        return true;
    } catch ( error ) {
        console.error( 'Error creating mock hotel data:', error );
        throw error;
    }
};

// Main function to run the seeder
const runSeeder = async () => {
    try {
        // Test connection first
        const connected = await testConnection();
        if ( !connected ) {
            throw new Error( 'Failed to connect to database. Please check your credentials.' );
        }

        console.log( '\n=== STARTING HOTEL DATA SEEDING PROCESS ===\n' );

        // Clear existing data first
        await clearExistingData();

        // Set up amenities and get their IDs
        console.log( '\n--- SETTING UP AMENITIES ---\n' );
        const amenityIds = await setupAmenities();

        // Create and insert mock hotel data
        console.log( '\n--- CREATING MOCK HOTELS ---\n' );
        await createMockHotels( amenityIds );

        // Verify data insertion
        const [ hotelCount ] = await pool.execute( 'SELECT COUNT(*) as count FROM hotels' );
        const [ roomCount ] = await pool.execute( 'SELECT COUNT(*) as count FROM rooms' );
        const [ photoCount ] = await pool.execute( 'SELECT COUNT(*) as count FROM accommodationphotos' );

        console.log( '\n=== HOTEL DATA SEEDING COMPLETED ===\n' );
        console.log( `Successfully created ${ hotelCount[ 0 ].count } hotels with ${ roomCount[ 0 ].count } rooms and ${ photoCount[ 0 ].count } photos.` );

        process.exit( 0 );
    } catch ( error ) {
        console.error( 'Failed to seed hotel data:', error );
        process.exit( 1 );
    } finally {
        // Close the pool when done
        await pool.end();
    }
};

// Execute the seeder
runSeeder();