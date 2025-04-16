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

// Helper function to handle NULL values in datetime fields
const parseDateTime = ( value ) => {
    if ( !value || value === 'NULL' || value.toUpperCase() === 'NULL' ) {
        return null;
    }
    return value;
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

// Helper function to clear existing flight data
const clearExistingFlightData = async () => {
    try {
        // Only delete flight-related data
        await pool.execute( 'DELETE FROM vehiclestations WHERE vehicleId IN (SELECT vehicleId FROM vehicles WHERE vehicleType = "flight")' );
        await pool.execute( 'DELETE FROM vehiclecoaches WHERE vehicleId IN (SELECT vehicleId FROM vehicles WHERE vehicleType = "flight")' );
        await pool.execute( 'DELETE FROM flights' );
        await pool.execute( 'DELETE FROM vehicles WHERE vehicleType = "flight"' );

        console.log( 'Existing flight data cleared successfully.' );
    } catch ( error ) {
        console.error( 'Error clearing existing flight data:', error );
        throw error;
    }
};

// Main seeding function for flights
const seedFlights = async () => {
    try {
        // Test connection first
        const connected = await testConnection();
        if ( !connected ) {
            throw new Error( 'Failed to connect to database. Please check your credentials.' );
        }

        console.log( 'Starting flight data seeding with CSV data...' );

        // Clear existing flight data first to avoid conflicts
        await clearExistingFlightData();

        // Read CSV data
        const vehicles = readCSV( 'vehicles.csv' );
        const flights = readCSV( 'flights.csv' );
        const vehicleCoaches = readCSV( 'vehicleCoaches.csv' );
        const vehicleStations = readCSV( 'vehicleStations.csv' );

        // Insert vehicles
        console.log( 'Inserting flight vehicles...' );
        for ( const vehicle of vehicles ) {
            const formattedUuid = formatUuidForUnhex( vehicle.vehicleId );
            await pool.execute(
                'INSERT INTO vehicles (vehicleId, vehicleType, status, availableSeats) VALUES (UNHEX(?), ?, ?, ?)',
                [
                    formattedUuid,
                    vehicle.vehicleType,
                    vehicle.status,
                    parseInt( vehicle.availableSeats, 10 )
                ]
            );
        }
        console.log( 'Flight vehicles inserted successfully.' );

        // Insert flights
        console.log( 'Inserting flights...' );
        for ( const flight of flights ) {
            const formattedUuid = formatUuidForUnhex( flight.vehicleId );
            await pool.execute(
                'INSERT INTO flights (vehicleId, flightName) VALUES (UNHEX(?), ?)',
                [
                    formattedUuid,
                    flight.flightName
                ]
            );
        }
        console.log( 'Flights inserted successfully.' );

        // Insert vehicle coaches
        console.log( 'Inserting flight coaches...' );
        for ( const coach of vehicleCoaches ) {
            try {
                const formattedUuid = formatUuidForUnhex( coach.vehicleId );
                await pool.execute(
                    'INSERT INTO vehiclecoaches (vehicleId, coachId, coachType, seatsAvailable, price) VALUES (UNHEX(?), ?, ?, ?, ?)',
                    [
                        formattedUuid,
                        coach.coachId,
                        coach.coachType,
                        parseInt( coach.seatsAvailable, 10 ),
                        parseFloat( coach.price )
                    ]
                );
            } catch ( err ) {
                console.warn( `Skipping coach insertion due to error: vehicleId=${ coach.vehicleId }, coachId=${ coach.coachId }` );
                console.warn( `Error details: ${ err.message }` );
            }
        }
        console.log( 'Flight coaches inserted successfully.' );

        // Insert vehicle stations
        console.log( 'Inserting flight stations...' );
        for ( const station of vehicleStations ) {
            try {
                const formattedVehicleId = formatUuidForUnhex( station.vehicleId );
                const formattedStationId = formatUuidForUnhex( station.stationId );

                // Parse arrival and departure times
                const arrivalTime = parseDateTime( station.arrivalTime );
                const departureTime = parseDateTime( station.departureTime );

                console.log( `Processing station: ${ station.stationName }, arrivalTime: ${ arrivalTime }, departureTime: ${ departureTime }` );

                await pool.execute(
                    'INSERT INTO vehiclestations (stationId, vehicleId, stationName, arrivalTime, departureTime, stoppage, stationOrder) VALUES (UNHEX(?), UNHEX(?), ?, ?, ?, ?, ?)',
                    [
                        formattedStationId,
                        formattedVehicleId,
                        station.stationName,
                        arrivalTime,
                        departureTime,
                        parseInt( station.stoppage, 10 ),
                        parseInt( station.stationOrder, 10 )
                    ]
                );
                console.log( `Station inserted: ${ station.stationName }` );
            } catch ( err ) {
                console.warn( `Skipping station insertion due to error: stationId=${ station.stationId }, stationName=${ station.stationName }` );
                console.warn( `Error details: ${ err.message }` );
            }
        }
        console.log( 'Flight stations inserted successfully.' );

        console.log( 'Flight data seeding completed successfully!' );
    } catch ( error ) {
        console.error( 'Error seeding flight data:', error );
        throw error;
    } finally {
        // Close the pool when done
        await pool.end();
    }
};

// Run the seeder function
const runSeeder = async () => {
    try {
        await seedFlights();
        console.log( 'All flight seeding operations completed successfully!' );
        process.exit( 0 );
    } catch ( error ) {
        console.error( 'Failed to seed flight data:', error );
        process.exit( 1 );
    }
};

runSeeder();