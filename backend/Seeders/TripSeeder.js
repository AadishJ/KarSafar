import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import mysql from 'mysql2/promise';
import fs from 'fs';

// Get the directory name properly in ESM
const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

// Load environment variables
const envPath = path.resolve( __dirname, '../.env' );
dotenv.config( { path: envPath } );

// Verify .env file is being read
console.log( 'Checking .env file:', envPath );
try {
    const envFileExists = fs.existsSync( envPath );
    console.log( '.env file exists:', envFileExists );
    if ( envFileExists ) {
        const envContent = fs.readFileSync( envPath, 'utf8' );
        console.log( '.env file length:', envContent.length );
    }
} catch ( err ) {
    console.error( 'Error checking .env file:', err );
}

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
console.log( `Database: ${ process.env.DB_NAME || 'karsafar_db' }` );
console.log( `Password: ${ process.env.DB_PASSWORD ? '*'.repeat( process.env.DB_PASSWORD.length ) : 'not set' }` );

// Helper function to generate UUID without dashes
const generateUuid = () => uuidv4().replace( /-/g, '' );

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

// Get user IDs for seeding
const getUserIds = async () => {
    try {
        // Get two random user IDs from the database
        const [ users ] = await pool.execute( 'SELECT LOWER(HEX(userId)) as userId FROM users LIMIT 2' );

        if ( users.length < 2 ) {
            console.log( 'Not enough users found, creating dummy UUIDs' );
            return [ generateUuid(), generateUuid() ];
        }

        return users.map( user => user.userId );
    } catch ( error ) {
        console.error( 'Error fetching user IDs:', error.message );
        return [ generateUuid(), generateUuid() ];
    }
};

// Get vehicle IDs for seeding
const getVehicleIds = async () => {
    try {
        // Get two random vehicle IDs from the database
        const [ vehicles ] = await pool.execute( 'SELECT LOWER(HEX(vehicleId)) as vehicleId FROM vehicles LIMIT 2' );

        if ( vehicles.length < 2 ) {
            console.log( 'Not enough vehicles found, creating dummy UUIDs' );
            return [ generateUuid(), generateUuid() ];
        }

        return vehicles.map( vehicle => vehicle.vehicleId );
    } catch ( error ) {
        console.error( 'Error fetching vehicle IDs:', error.message );
        return [ generateUuid(), generateUuid() ];
    }
};

const seedTrips = async () => {
    try {
        // Test connection first
        const connected = await testConnection();
        if ( !connected ) {
            throw new Error( 'Failed to connect to database. Please check your credentials.' );
        }

        console.log( 'Starting trip data seeding...' );

        // Get user IDs for relationships
        const userIds = await getUserIds();
        console.log( `Using user IDs: ${ userIds.join( ', ' ) }` );

        // Get vehicle IDs for reviews
        const vehicleIds = await getVehicleIds();
        console.log( `Using vehicle IDs: ${ vehicleIds.join( ', ' ) }` );

        // Generate UUIDs for trips
        const tripIds = [ generateUuid(), generateUuid() ];

        // Insert trips with UUIDs
        console.log( 'Inserting trips...' );
        await pool.execute(
            `INSERT INTO trips (tripId, userId, name, startDate, endDate, status) 
            VALUES (UNHEX(?), UNHEX(?), ?, ?, ?, ?), (UNHEX(?), UNHEX(?), ?, ?, ?, ?)`,
            [
                tripIds[ 0 ], userIds[ 0 ], 'Vacation 1', '2025-06-01', '2025-06-10', 'booked',
                tripIds[ 1 ], userIds[ 1 ], 'Business Trip', '2025-07-01', '2025-07-05', 'planning'
            ]
        );
        console.log( 'Trips inserted successfully.' );

        // Generate UUIDs for bookings
        const bookingIds = [ generateUuid(), generateUuid() ];

        // Insert bookings with UUIDs
        console.log( 'Inserting bookings...' );
        await pool.execute(
            `INSERT INTO bookings (bookingId, userId, tripId, totalPrice, status) 
            VALUES (UNHEX(?), UNHEX(?), UNHEX(?), ?, ?), (UNHEX(?), UNHEX(?), UNHEX(?), ?, ?)`,
            [
                bookingIds[ 0 ], userIds[ 0 ], tripIds[ 0 ], 500.00, 'confirmed',
                bookingIds[ 1 ], userIds[ 1 ], tripIds[ 1 ], 1000.00, 'pending'
            ]
        );
        console.log( 'Bookings inserted successfully.' );

        // Generate UUIDs for payments
        const paymentIds = [ generateUuid(), generateUuid() ];

        // Insert payments with UUIDs
        console.log( 'Inserting payments...' );
        await pool.execute(
            `INSERT INTO payments (paymentId, bookingId, amount, paid, paymentMethod, transactionId, paymentDate, status) 
            VALUES (UNHEX(?), UNHEX(?), ?, ?, ?, ?, ?, ?), (UNHEX(?), UNHEX(?), ?, ?, ?, ?, ?, ?)`,
            [
                paymentIds[ 0 ], bookingIds[ 0 ], 500.00, 1, 'Credit Card', 'TXN12345', '2025-06-01 12:00:00', 'completed',
                paymentIds[ 1 ], bookingIds[ 1 ], 1000.00, 0, 'Debit Card', 'TXN67890', '2025-07-01 15:00:00', 'pending'
            ]
        );
        console.log( 'Payments inserted successfully.' );

        // Generate UUIDs for reviews
        const reviewIds = [ generateUuid(), generateUuid() ];

        // Mock accommodation ID (would normally come from accommodations table)
        const accommodationId = generateUuid();

        // Insert reviews with UUIDs
        console.log( 'Inserting reviews...' );
        await pool.execute(
            `INSERT INTO reviews (reviewId, userId, itemType, itemId, rating, comment) 
            VALUES (UNHEX(?), UNHEX(?), ?, UNHEX(?), ?, ?), (UNHEX(?), UNHEX(?), ?, UNHEX(?), ?, ?)`,
            [
                reviewIds[ 0 ], userIds[ 0 ], 'vehicle', vehicleIds[ 0 ], 4.5, 'Great train service!',
                reviewIds[ 1 ], userIds[ 1 ], 'accommodation', accommodationId, 4.0, 'Comfortable stay.'
            ]
        );
        console.log( 'Reviews inserted successfully.' );

        console.log( 'Trip data seeding completed successfully!' );
    } catch ( error ) {
        console.error( 'Error seeding trip data:', error );
        throw error;
    } finally {
        // Close the pool when done
        await pool.end();
    }
};

// Run the seeder function
const runSeeder = async () => {
    try {
        await seedTrips();
        console.log( 'All trip seeding operations completed successfully!' );
        process.exit( 0 );
    } catch ( error ) {
        console.error( 'Failed to seed trip data:', error );
        process.exit( 1 );
    }
};

runSeeder();