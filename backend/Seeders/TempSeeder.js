import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

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
console.log( `Database: ${ process.env.DB_NAME || 'karsafar_db' }` );

// Path to CSV files
const csvBasePath = path.resolve( __dirname, '../../Safe' );

// Read and parse CSV files
const readCSV = ( filename ) => {
    const filePath = path.join( csvBasePath, filename );
    console.log( `Reading CSV file: ${ filePath }` );
    try {
        const fileContent = fs.readFileSync( filePath, 'utf8' );
        // Remove any BOM and clean up the file contents
        const cleanContent = fileContent.replace( /^\uFEFF/, '' ).trim();
        return parse( cleanContent, {
            columns: true,
            skip_empty_lines: true
        } );
    } catch ( error ) {
        console.error( `Error reading ${ filename }:`, error.message );
        return [];
    }
};

// Helper function to format UUID for MySQL UNHEX
const formatUuidForUnhex = ( uuid ) => {
    // Remove dashes from the UUID
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

// Helper function to clear existing seat data
const clearExistingSeatsData = async () => {
    try {
        // Only delete seat-related data
        await pool.execute( 'DELETE FROM seats' );
        console.log( 'Existing seats data cleared successfully.' );
    } catch ( error ) {
        console.error( 'Error clearing existing seats data:', error );
        throw error;
    }
};

// Main seeding function for seats
const seedSeats = async () => {
    try {
        // Test connection first
        const connected = await testConnection();
        if ( !connected ) {
            throw new Error( 'Failed to connect to database. Please check your credentials.' );
        }

        console.log( 'Starting seat data seeding with CSV data...' );

        // Clear existing seat data first to avoid conflicts
        await clearExistingSeatsData();

        // Read CSV data
        const seats = readCSV( 'seats.csv' );

        if ( seats.length === 0 ) {
            throw new Error( 'No seat data found in the CSV file.' );
        }

        console.log( `Found ${ seats.length } seat records to import.` );

        // Insert seats in batches for better performance
        console.log( 'Inserting seats...' );

        // Define batch size
        const batchSize = 50;
        let successCount = 0;
        let errorCount = 0;

        for ( let i = 0; i < seats.length; i += batchSize ) {
            const batch = seats.slice( i, i + batchSize );

            // Process each seat in the current batch
            for ( const seat of batch ) {
                try {
                    const formattedSeatId = formatUuidForUnhex( seat.seatId );
                    const formattedVehicleId = formatUuidForUnhex( seat.vehicleId );

                    await pool.execute(
                        'INSERT INTO seats (seatId, vehicleId, coachId, seatNumber) VALUES (UNHEX(?), UNHEX(?), ?, ?)',
                        [
                            formattedSeatId,
                            formattedVehicleId,
                            seat.coachId,
                            seat.seatNumber
                        ]
                    );
                    successCount++;
                } catch ( err ) {
                    errorCount++;
                    // Only log detailed error for the first few errors to avoid flooding the console
                    if ( errorCount <= 5 ) {
                        console.warn( `Error inserting seat: seatId=${ seat.seatId }, seatNumber=${ seat.seatNumber }` );
                        console.warn( `Error details: ${ err.message }` );
                    } else if ( errorCount === 6 ) {
                        console.warn( 'Additional errors are occurring but will not be logged individually...' );
                    }
                }
            }

            // Log progress
            console.log( `Processed ${ Math.min( i + batchSize, seats.length ) } of ${ seats.length } seats.` );
        }

        console.log( `Seat insertion complete: ${ successCount } successful, ${ errorCount } failed.` );

        // Verify insertion
        const [ countResult ] = await pool.execute( 'SELECT COUNT(*) as total FROM seats' );
        console.log( `Total seats in database after seeding: ${ countResult[ 0 ].total }` );

        console.log( 'Seat data seeding completed successfully!' );
    } catch ( error ) {
        console.error( 'Error seeding seat data:', error );
        throw error;
    } finally {
        // Close the pool when done
        await pool.end();
    }
};

// Additional function to help verify the coach IDs exist before seeding
const verifyCoachIds = async () => {
    try {
        console.log( 'Verifying coach IDs before seeding seats...' );

        // Read CSV data
        const seats = readCSV( 'seats.csv' );

        if ( seats.length === 0 ) {
            throw new Error( 'No seat data found in the CSV file.' );
        }

        // Extract unique coach IDs from the seats data
        const uniqueCoachIds = [ ...new Set( seats.map( seat => seat.coachId ) ) ];
        console.log( `Found ${ uniqueCoachIds.length } unique coach IDs in the seats data.` );

        // Check if these coach IDs exist in the database
        const placeholders = uniqueCoachIds.map( () => '?' ).join( ',' );
        const [ existingCoaches ] = await pool.execute(
            `SELECT coachId FROM vehiclecoaches WHERE coachId IN (${ placeholders })`,
            uniqueCoachIds
        );

        const existingCoachIds = existingCoaches.map( coach => coach.coachId );
        const missingCoachIds = uniqueCoachIds.filter( id => !existingCoachIds.includes( id ) );

        if ( missingCoachIds.length > 0 ) {
            console.warn( `Warning: ${ missingCoachIds.length } coach IDs from seats data not found in the database.` );
            console.warn( 'Missing coach IDs:', missingCoachIds );
            return false;
        } else {
            console.log( 'All coach IDs verified successfully!' );
            return true;
        }
    } catch ( error ) {
        console.error( 'Error verifying coach IDs:', error );
        return false;
    }
};

// Function to verify vehicle IDs exist
const verifyVehicleIds = async () => {
    try {
        console.log( 'Verifying vehicle IDs before seeding seats...' );

        // Read CSV data
        const seats = readCSV( 'seats.csv' );

        // Extract unique vehicle IDs from the seats data
        const uniqueVehicleIds = [ ...new Set( seats.map( seat => seat.vehicleId ) ) ];
        console.log( `Found ${ uniqueVehicleIds.length } unique vehicle IDs in the seats data.` );

        // Check each vehicle ID
        let allValid = true;
        let validCount = 0;
        let invalidCount = 0;

        for ( const vehicleId of uniqueVehicleIds ) {
            try {
                const formattedVehicleId = formatUuidForUnhex( vehicleId );
                const [ result ] = await pool.execute(
                    'SELECT COUNT(*) as count FROM vehicles WHERE vehicleId = UNHEX(?)',
                    [ formattedVehicleId ]
                );

                if ( result[ 0 ].count > 0 ) {
                    validCount++;
                } else {
                    invalidCount++;
                    console.warn( `Vehicle ID not found: ${ vehicleId }` );
                    allValid = false;
                }
            } catch ( err ) {
                console.error( `Error checking vehicle ID ${ vehicleId }:`, err.message );
                allValid = false;
            }
        }

        console.log( `Vehicle ID verification complete: ${ validCount } valid, ${ invalidCount } invalid.` );
        return allValid;
    } catch ( error ) {
        console.error( 'Error verifying vehicle IDs:', error );
        return false;
    }
};

// Run the seeder function with verification
const runSeeder = async () => {
    try {
        // First verify that required data exists
        const vehiclesValid = await verifyVehicleIds();
        const coachesValid = await verifyCoachIds();

        if ( !vehiclesValid || !coachesValid ) {
            console.warn( '\nWarning: Some prerequisite data is missing. Proceeding anyway, but expect some insertion errors.' );
        }

        // Proceed with seeding
        await seedSeats();
        console.log( 'All seat seeding operations completed successfully!' );
        process.exit( 0 );
    } catch ( error ) {
        console.error( 'Failed to seed seat data:', error );
        process.exit( 1 );
    }
};

// Execute the seeder
runSeeder();