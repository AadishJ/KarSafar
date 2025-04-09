import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import mysql from 'mysql2/promise';

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
    password: process.env.DB_PASSWORD || 'Fire$torm@123',
    database: process.env.DB_NAME || 'karsafar_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
} );

// Helper function to generate UUID without dashes
const generateUuid = () => uuidv4().replace( /-/g, '' );

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

const addDelhiMumbaiFlight = async () => {
    try {
        // Test connection first
        const connected = await testConnection();
        if ( !connected ) {
            throw new Error( 'Failed to connect to database' );
        }

        console.log( 'Adding Delhi-Mumbai flight for 2025-04-10...' );

        // Generate UUID for the flight
        const flightId = generateUuid();

        // 1. Insert the vehicle record first
        await pool.execute(
            'INSERT INTO vehicles (vehicleId, vehicleType, status, availableSeats) VALUES (UNHEX(?), ?, ?, ?)',
            [ flightId, 'flight', 'active', 180 ]
        );
        console.log( 'Vehicle record created with ID:', flightId );

        // 2. Insert the flight record
        await pool.execute(
            'INSERT INTO flights (vehicleId, flightName) VALUES (UNHEX(?), ?)',
            [ flightId, 'IndiJet AI-202' ]
        );
        console.log( 'Flight record created' );

        // 3. Insert departure station (Delhi) - FIXED VERSION
        const departureStationId = generateUuid();
        await pool.execute(
            'INSERT INTO vehiclestations (stationId, vehicleId, stationName, departureTime, arrivalTime, stoppage, stationOrder) VALUES (UNHEX(?), UNHEX(?), ?, ?, NULL, ?, ?)',
            [
                departureStationId,
                flightId,
                'Delhi',
                new Date( '2025-04-10T08:30:00' ),
                0,  // Stoppage
                1   // Station order
            ]
        );
        console.log( 'Delhi station record created' );

        // 4. Insert arrival station (Mumbai) - FIXED VERSION
        const arrivalStationId = generateUuid();
        await pool.execute(
            'INSERT INTO vehiclestations (stationId, vehicleId, stationName, departureTime, arrivalTime, stoppage, stationOrder) VALUES (UNHEX(?), UNHEX(?), ?, NULL, ?, ?, ?)',
            [
                arrivalStationId,
                flightId,
                'Mumbai',
                new Date( '2025-04-10T10:45:00' ),
                0,  // Stoppage
                2   // Station order
            ]
        );
        console.log( 'Mumbai station record created' );

        // 5. Insert coach types with different prices
        const coachTypes = [
            { id: 'FC1', type: 'First Class', seats: 20, price: 9500.00 },
            { id: 'BC1', type: 'Business Class', seats: 40, price: 6500.00 },
            { id: 'EC1', type: 'Economy Class', seats: 120, price: 4200.00 }
        ];

        for ( const coach of coachTypes ) {
            await pool.execute(
                'INSERT INTO vehiclecoaches (vehicleId, coachId, coachType, seatsAvailable, price) VALUES (UNHEX(?), ?, ?, ?, ?)',
                [ flightId, coach.id, coach.type, coach.seats, coach.price ]
            );
        }
        console.log( 'Coach records created' );

        console.log( 'Delhi-Mumbai flight has been added successfully!' );
        console.log( `Flight ID: ${ flightId }` );
        console.log( `Flight Name: IndiJet AI-202` );
        console.log( `Departure: Delhi at 2025-04-10 08:30:00` );
        console.log( `Arrival: Mumbai at 2025-04-10 10:45:00` );

    } catch ( error ) {
        console.error( 'Error adding flight:', error );
        throw error;
    } finally {
        // Close the pool when done
        await pool.end();
    }
};

// Run the function
const run = async () => {
    try {
        await addDelhiMumbaiFlight();
        console.log( 'Flight added successfully!' );
        process.exit( 0 );
    } catch ( error ) {
        console.error( 'Failed to add flight:', error );
        process.exit( 1 );
    }
};

run();