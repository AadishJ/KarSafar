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
    password: process.env.DB_PASSWORD || 'Fire$torm@123',
    database: process.env.DB_NAME || 'karsafar_db',
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

const seedVehicles = async () => {
    try {
        // Test connection first
        const connected = await testConnection();
        if ( !connected ) {
            throw new Error( 'Failed to connect to database. Please check your credentials.' );
        }

        console.log( 'Starting database seeding with UUIDs...' );

        // Generate UUIDs for vehicles
        const vehicleIds = Array( 10 ).fill().map( () => generateUuid() );

        // Insert vehicles with UUIDs
        console.log( 'Inserting vehicles...' );
        for ( let i = 0; i < 10; i++ ) {
            const vehicleType = [ 'train', 'flight', 'bus', 'cab', 'cruise' ][ i % 5 ];
            const status = i === 5 ? 'maintenance' : ( i === 6 ? 'cancelled' : 'active' );
            const seats =
                vehicleType === 'train' ? ( i === 5 ? 600 : 500 ) :
                    vehicleType === 'flight' ? ( i === 6 ? 250 : 200 ) :
                        vehicleType === 'bus' ? ( i === 7 ? 30 : 40 ) :
                            vehicleType === 'cab' ? 4 :
                                vehicleType === 'cruise' ? ( i === 9 ? 120 : 100 ) : 0;

            await pool.execute(
                'INSERT INTO vehicles (vehicleId, vehicleType, status, availableSeats) VALUES (UNHEX(?), ?, ?, ?)',
                [ vehicleIds[ i ], vehicleType, status, seats ]
            );
        }
        console.log( 'Vehicles inserted successfully.' );

        // Insert trains
        console.log( 'Inserting trains...' );
        await pool.execute(
            'INSERT INTO trains (vehicleId, trainName) VALUES (UNHEX(?), ?), (UNHEX(?), ?)',
            [ vehicleIds[ 0 ], 'Express 101', vehicleIds[ 5 ], 'Superfast 303' ]
        );
        console.log( 'Trains inserted successfully.' );

        // Insert flights
        console.log( 'Inserting flights...' );
        await pool.execute(
            'INSERT INTO flights (vehicleId, flightName) VALUES (UNHEX(?), ?), (UNHEX(?), ?)',
            [ vehicleIds[ 1 ], 'AirJet 500', vehicleIds[ 6 ], 'SkyFlyer 700' ]
        );
        console.log( 'Flights inserted successfully.' );

        // Insert buses
        console.log( 'Inserting buses...' );
        await pool.execute(
            'INSERT INTO buses (vehicleId, busName, photo) VALUES (UNHEX(?), ?, NULL), (UNHEX(?), ?, NULL)',
            [ vehicleIds[ 2 ], 'Greyhound', vehicleIds[ 7 ], 'MegaBus' ]
        );
        console.log( 'Buses inserted successfully.' );

        // Insert cabs
        console.log( 'Inserting cabs...' );
        await pool.execute(
            'INSERT INTO cabs (vehicleId, carModel, photo) VALUES (UNHEX(?), ?, NULL), (UNHEX(?), ?, NULL)',
            [ vehicleIds[ 3 ], 'Toyota Prius', vehicleIds[ 8 ], 'Honda Civic' ]
        );
        console.log( 'Cabs inserted successfully.' );

        // Insert cruises
        console.log( 'Inserting cruises...' );
        await pool.execute(
            'INSERT INTO cruises (vehicleId, cruiseName, photo) VALUES (UNHEX(?), ?, NULL), (UNHEX(?), ?, NULL)',
            [ vehicleIds[ 4 ], 'Ocean Queen', vehicleIds[ 9 ], 'Sea King' ]
        );
        console.log( 'Cruises inserted successfully.' );

        // Define coach types and prices
        const coachTypes = [
            { id: 'H1', type: 'first class', seats: 50, price: 200.00 },
            { id: 'A1', type: 'second class', seats: 100, price: 150.00 },
            { id: 'B1', type: 'third class', seats: 200, price: 100.00 },
            { id: 'S1', type: 'sleeper', seats: 150, price: 80.00 },
            { id: 'H2', type: 'first class', seats: 60, price: 220.00 },
            { id: 'A2', type: 'second class', seats: 120, price: 160.00 },
            { id: 'B2', type: 'third class', seats: 180, price: 110.00 },
            { id: 'S2', type: 'sleeper', seats: 140, price: 90.00 }
        ];

        // Insert vehicle coaches
        console.log( 'Inserting vehicle coaches...' );
        for ( const coach of coachTypes.slice( 0, 4 ) ) {
            await pool.execute(
                'INSERT INTO vehiclecoaches (vehicleId, coachId, coachType, seatsAvailable, price) VALUES (UNHEX(?), ?, ?, ?, ?)',
                [ vehicleIds[ 0 ], coach.id, coach.type, coach.seats, coach.price ]
            );
        }

        for ( const coach of coachTypes.slice( 4 ) ) {
            await pool.execute(
                'INSERT INTO vehiclecoaches (vehicleId, coachId, coachType, seatsAvailable, price) VALUES (UNHEX(?), ?, ?, ?, ?)',
                [ vehicleIds[ 5 ], coach.id, coach.type, coach.seats, coach.price ]
            );
        }
        console.log( 'Vehicle coaches inserted successfully.' );

        // Insert seats with UUIDs
        console.log( 'Inserting seats...' );

        // Train seats
        const trainSeats = [
            { vehicleId: vehicleIds[ 0 ], coachId: 'H1', seats: [ '1', '2', '3' ] },
            { vehicleId: vehicleIds[ 0 ], coachId: 'A1', seats: [ '1', '2', '3' ] },
        ];

        for ( const trainSeat of trainSeats ) {
            for ( const seat of trainSeat.seats ) {
                const seatId = generateUuid();
                await pool.execute(
                    'INSERT INTO seats (seatId, vehicleId, coachId, seatNumber) VALUES (UNHEX(?), UNHEX(?), ?, ?)',
                    [ seatId, trainSeat.vehicleId, trainSeat.coachId, seat ]
                );
            }
        }

        // Flight seats
        const flightSeats = [
            { vehicleId: vehicleIds[ 1 ], coachId: 'A1', seats: [ 'A1', 'A2', 'B1' ] },
            { vehicleId: vehicleIds[ 6 ], coachId: 'A2', seats: [ 'A3', 'A4', 'B2' ] },
        ];

        for ( const flightSeat of flightSeats ) {
            for ( const seat of flightSeat.seats ) {
                const seatId = generateUuid();
                await pool.execute(
                    'INSERT INTO seats (seatId, vehicleId, coachId, seatNumber) VALUES (UNHEX(?), UNHEX(?), ?, ?)',
                    [ seatId, flightSeat.vehicleId, flightSeat.coachId, seat ]
                );
            }
        }

        console.log( 'Seats inserted successfully.' );
        console.log( 'Database seeding completed successfully!' );
    } catch ( error ) {
        console.error( 'Error seeding database:', error );
        throw error;
    } finally {
        // Close the pool when done
        await pool.end();
    }
};

// Run the seeder function
const runSeeder = async () => {
    try {
        await seedVehicles();
        console.log( 'All seeding operations completed successfully!' );
        process.exit( 0 );
    } catch ( error ) {
        console.error( 'Failed to seed the database:', error );
        process.exit( 1 );
    }
};

runSeeder();