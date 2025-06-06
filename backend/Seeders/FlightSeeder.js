import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid'; // Add this import for UUID generation

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
const csvBasePath = path.resolve( __dirname, '../../Safe/Flight' );

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

// Helper function to clear existing flight-related data
const clearExistingData = async () => {
    try {
        console.log( 'Checking for existing flight data to clear...' );

        // First check for each table
        const [ flightCount ] = await pool.execute( 'SELECT COUNT(*) as count FROM flights' );
        const [ stationCount ] = await pool.execute( 'SELECT COUNT(*) as count FROM vehiclestations WHERE vehicleId IN (SELECT vehicleId FROM vehicles WHERE vehicleType = "flight")' );
        const [ coachCount ] = await pool.execute( 'SELECT COUNT(*) as count FROM vehiclecoaches WHERE vehicleId IN (SELECT vehicleId FROM vehicles WHERE vehicleType = "flight")' );
        const [ seatCount ] = await pool.execute( 'SELECT COUNT(*) as count FROM seats WHERE vehicleId IN (SELECT vehicleId FROM vehicles WHERE vehicleType = "flight")' );

        // Delete in the correct order to respect foreign key constraints
        if ( seatCount[ 0 ].count > 0 ) {
            console.log( `Found ${ seatCount[ 0 ].count } existing seat records to clear.` );
            await pool.execute( 'DELETE FROM seats WHERE vehicleId IN (SELECT vehicleId FROM vehicles WHERE vehicleType = "flight")' );
            console.log( 'Existing seat data cleared successfully.' );
        }

        if ( stationCount[ 0 ].count > 0 ) {
            console.log( `Found ${ stationCount[ 0 ].count } existing station records to clear.` );
            await pool.execute( 'DELETE FROM vehiclestations WHERE vehicleId IN (SELECT vehicleId FROM vehicles WHERE vehicleType = "flight")' );
            console.log( 'Existing vehicle station data cleared successfully.' );
        }

        if ( coachCount[ 0 ].count > 0 ) {
            console.log( `Found ${ coachCount[ 0 ].count } existing coach records to clear.` );
            await pool.execute( 'DELETE FROM vehiclecoaches WHERE vehicleId IN (SELECT vehicleId FROM vehicles WHERE vehicleType = "flight")' );
            console.log( 'Existing vehicle coach data cleared successfully.' );
        }

        if ( flightCount[ 0 ].count > 0 ) {
            console.log( `Found ${ flightCount[ 0 ].count } existing flight records to clear.` );
            await pool.execute( 'DELETE FROM flights' );
            console.log( 'Existing flight data cleared successfully.' );
        }

        // Finally, delete flight vehicles
        await pool.execute( 'DELETE FROM vehicles WHERE vehicleType = "flight"' );
        console.log( 'Existing flight vehicle data cleared successfully.' );

    } catch ( error ) {
        console.error( 'Error clearing existing data:', error );
        throw error;
    }
};

// Function to check if vehicle IDs already exist
const checkExistingVehicleIds = async ( flights ) => {
    try {
        console.log( 'Checking for existing vehicle IDs...' );

        // Extract all vehicle IDs from the flights data
        const vehicleIds = flights.map( flight => flight.vehicleId );
        let existingIds = [];

        // Check each vehicle ID in batches to avoid overly long queries
        const batchSize = 20;
        for ( let i = 0; i < vehicleIds.length; i += batchSize ) {
            const batchIds = vehicleIds.slice( i, i + batchSize );
            const placeholders = batchIds.map( () => 'UNHEX(?)' ).join( ',' );

            const [ results ] = await pool.execute(
                `SELECT HEX(vehicleId) as hexId FROM vehicles WHERE vehicleId IN (${ placeholders })`,
                batchIds.map( id => formatUuidForUnhex( id ) )
            );

            // Convert HEX results back to dashed format for comparison
            const hexIds = results.map( row => {
                const hex = row.hexId.toLowerCase();
                return `${ hex.slice( 0, 8 ) }-${ hex.slice( 8, 12 ) }-${ hex.slice( 12, 16 ) }-${ hex.slice( 16, 20 ) }-${ hex.slice( 20 ) }`;
            } );

            existingIds = [ ...existingIds, ...hexIds ];
        }

        if ( existingIds.length > 0 ) {
            console.log( `Found ${ existingIds.length } vehicle IDs that already exist in the database.` );
        } else {
            console.log( 'No existing vehicle IDs found. All flight data will be inserted as new.' );
        }

        return existingIds;
    } catch ( error ) {
        console.error( 'Error checking existing vehicle IDs:', error );
        return [];
    }
};

// Insert flights data
const seedFlights = async ( flights, existingVehicleIds ) => {
    try {
        console.log( 'Inserting flights...' );

        // Define batch size
        const batchSize = 10;
        let successCount = 0;
        let errorCount = 0;

        for ( let i = 0; i < flights.length; i += batchSize ) {
            const batch = flights.slice( i, i + batchSize );

            // Process each flight in the current batch
            for ( const flight of batch ) {
                try {
                    const formattedVehicleId = formatUuidForUnhex( flight.vehicleId );

                    // Check if vehicle already exists
                    if ( !existingVehicleIds.includes( flight.vehicleId ) ) {
                        // Insert into vehicles table only if it doesn't exist
                        await pool.execute(
                            'INSERT INTO vehicles (vehicleId, vehicleType, status, availableSeats) VALUES (UNHEX(?), ?, ?, ?)',
                            [
                                formattedVehicleId,
                                'flight',
                                'active',
                                100 // Default available seats, adjust as needed
                            ]
                        );
                    }

                    // Then insert into flights table
                    await pool.execute(
                        'INSERT INTO flights (vehicleId, flightName) VALUES (UNHEX(?), ?)',
                        [
                            formattedVehicleId,
                            flight.flightName
                        ]
                    );

                    successCount++;
                } catch ( err ) {
                    errorCount++;
                    if ( errorCount <= 5 ) {
                        console.warn( `Error inserting flight: vehicleId=${ flight.vehicleId }, flightName=${ flight.flightName }` );
                        console.warn( `Error details: ${ err.message }` );
                    } else if ( errorCount === 6 ) {
                        console.warn( 'Additional errors are occurring but will not be logged individually...' );
                    }
                }
            }

            // Log progress
            console.log( `Processed ${ Math.min( i + batchSize, flights.length ) } of ${ flights.length } flights.` );
        }

        console.log( `Flight insertion complete: ${ successCount } successful, ${ errorCount } failed.` );

        // Verify insertion
        const [ countResult ] = await pool.execute( 'SELECT COUNT(*) as total FROM flights' );
        console.log( `Total flights in database after seeding: ${ countResult[ 0 ].total }` );

        return successCount > 0;
    } catch ( error ) {
        console.error( 'Error seeding flight data:', error );
        throw error;
    }
};

// Seed stations data
const seedStations = async () => {
    try {
        console.log( 'Inserting stations...' );

        // Read CSV data
        const stations = readCSV( 'stations.csv' );

        if ( stations.length === 0 ) {
            console.log( 'No station data found in the CSV file.' );
            return false;
        }

        console.log( `Found ${ stations.length } station records to import.` );

        // Define batch size
        const batchSize = 20;
        let successCount = 0;
        let errorCount = 0;

        for ( let i = 0; i < stations.length; i += batchSize ) {
            const batch = stations.slice( i, i + batchSize );

            // Process each station in the current batch
            for ( const station of batch ) {
                try {
                    const formattedStationId = formatUuidForUnhex( station.stationId );

                    // Check if station already exists
                    const [ existingStation ] = await pool.execute(
                        'SELECT COUNT(*) as count FROM stations WHERE stationId = UNHEX(?)',
                        [ formattedStationId ]
                    );

                    if ( existingStation[ 0 ].count === 0 ) {
                        // Insert into stations table
                        await pool.execute(
                            'INSERT INTO stations (stationId, stationName, stationType, city, state, country, latitude, longitude) VALUES (UNHEX(?), ?, ?, ?, ?, ?, ?, ?)',
                            [
                                formattedStationId,
                                station.stationName,
                                station.stationType,
                                station.city,
                                station.state,
                                station.country,
                                parseFloat( station.latitude ) || null,
                                parseFloat( station.longitude ) || null
                            ]
                        );
                        successCount++;
                    } else {
                        console.log( `Station ${ station.stationName } already exists, skipping.` );
                    }
                } catch ( err ) {
                    errorCount++;
                    if ( errorCount <= 5 ) {
                        console.warn( `Error inserting station: stationId=${ station.stationId }, stationName=${ station.stationName }` );
                        console.warn( `Error details: ${ err.message }` );
                    } else if ( errorCount === 6 ) {
                        console.warn( 'Additional station insertion errors are occurring but will not be logged individually...' );
                    }
                }
            }

            // Log progress
            console.log( `Processed ${ Math.min( i + batchSize, stations.length ) } of ${ stations.length } stations.` );
        }

        console.log( `Station insertion complete: ${ successCount } successful, ${ errorCount } failed.` );

        // Verify insertion
        const [ countResult ] = await pool.execute( 'SELECT COUNT(*) as total FROM stations WHERE stationType = "airport"' );
        console.log( `Total airport stations in database after seeding: ${ countResult[ 0 ].total }` );

        return successCount > 0;
    } catch ( error ) {
        console.error( 'Error seeding station data:', error );
        throw error;
    }
};

// Insert vehicle stations
const seedVehicleStations = async () => {
    try {
        console.log( 'Inserting vehicle stations...' );

        // Read CSV data
        const vehicleStations = readCSV( 'vehiclestations.csv' );

        if ( vehicleStations.length === 0 ) {
            console.log( 'No vehicle station data found in the CSV file.' );
            return false;
        }

        console.log( `Found ${ vehicleStations.length } vehicle station records to import.` );

        // Define batch size
        const batchSize = 20;
        let successCount = 0;
        let errorCount = 0;

        for ( let i = 0; i < vehicleStations.length; i += batchSize ) {
            const batch = vehicleStations.slice( i, i + batchSize );

            // Process each vehicle station in the current batch
            for ( const vs of batch ) {
                try {
                    const formattedVehicleStationId = formatUuidForUnhex( vs.vehicleStationId );
                    const formattedVehicleId = formatUuidForUnhex( vs.vehicleId );
                    const formattedStationId = formatUuidForUnhex( vs.stationId );

                    // Parse arrival and departure times, handling NULL values
                    const arrivalTime = vs.arrivalTime && vs.arrivalTime !== 'NULL'
                        ? vs.arrivalTime
                        : null;

                    const departureTime = vs.departureTime && vs.departureTime !== 'NULL'
                        ? vs.departureTime
                        : null;

                    // Insert into vehiclestations table with the new schema
                    await pool.execute(
                        'INSERT INTO vehiclestations (vehicleStationId, vehicleId, stationId, arrivalTime, departureTime, stoppage, stationOrder) VALUES (UNHEX(?), UNHEX(?), UNHEX(?), ?, ?, ?, ?)',
                        [
                            formattedVehicleStationId,
                            formattedVehicleId,
                            formattedStationId,
                            arrivalTime,
                            departureTime,
                            parseInt( vs.stoppage ) || 0,
                            parseInt( vs.stationOrder ) || 0
                        ]
                    );

                    successCount++;
                } catch ( err ) {
                    errorCount++;
                    if ( errorCount <= 5 ) {
                        console.warn( `Error inserting vehicle station: vehicleStationId=${ vs.vehicleStationId }, vehicleId=${ vs.vehicleId }, stationId=${ vs.stationId }` );
                        console.warn( `Error details: ${ err.message }` );
                    } else if ( errorCount === 6 ) {
                        console.warn( 'Additional vehicle station insertion errors are occurring but will not be logged individually...' );
                    }
                }
            }

            // Log progress
            console.log( `Processed ${ Math.min( i + batchSize, vehicleStations.length ) } of ${ vehicleStations.length } vehicle stations.` );
        }

        console.log( `Vehicle station insertion complete: ${ successCount } successful, ${ errorCount } failed.` );

        // Verify insertion
        const [ countResult ] = await pool.execute( 'SELECT COUNT(*) as total FROM vehiclestations WHERE vehicleId IN (SELECT vehicleId FROM flights)' );
        console.log( `Total flight vehicle stations in database after seeding: ${ countResult[ 0 ].total }` );

        return successCount > 0;
    } catch ( error ) {
        console.error( 'Error seeding vehicle station data:', error );
        throw error;
    }
};

// Insert vehicle coaches
const seedVehicleCoaches = async () => {
    try {
        console.log( 'Inserting vehicle coaches...' );

        // Read CSV data
        const coaches = readCSV( 'vehiclecoaches.csv' );

        if ( coaches.length === 0 ) {
            console.log( 'No vehicle coach data found in the CSV file.' );
            return false;
        }

        console.log( `Found ${ coaches.length } vehicle coach records to import.` );

        // Define batch size
        const batchSize = 20;
        let successCount = 0;
        let errorCount = 0;

        for ( let i = 0; i < coaches.length; i += batchSize ) {
            const batch = coaches.slice( i, i + batchSize );

            // Process each coach in the current batch
            for ( const coach of batch ) {
                try {
                    const formattedVehicleId = formatUuidForUnhex( coach.vehicleId );

                    // Insert into vehiclecoaches table
                    await pool.execute(
                        'INSERT INTO vehiclecoaches (coachId, vehicleId, coachType, seatsAvailable, price) VALUES (?, UNHEX(?), ?, ?, ?)',
                        [
                            coach.coachId,
                            formattedVehicleId,
                            coach.coachType,
                            parseInt( coach.seatsAvailable ) || 0,
                            parseFloat( coach.price ) || 0
                        ]
                    );

                    successCount++;
                } catch ( err ) {
                    errorCount++;
                    if ( errorCount <= 5 ) {
                        console.warn( `Error inserting coach: coachId=${ coach.coachId }, vehicleId=${ coach.vehicleId }` );
                        console.warn( `Error details: ${ err.message }` );
                    } else if ( errorCount === 6 ) {
                        console.warn( 'Additional coach insertion errors are occurring but will not be logged individually...' );
                    }
                }
            }

            // Log progress
            console.log( `Processed ${ Math.min( i + batchSize, coaches.length ) } of ${ coaches.length } coaches.` );
        }

        console.log( `Coach insertion complete: ${ successCount } successful, ${ errorCount } failed.` );

        // Verify insertion
        const [ countResult ] = await pool.execute( 'SELECT COUNT(*) as total FROM vehiclecoaches WHERE vehicleId IN (SELECT vehicleId FROM flights)' );
        console.log( `Total flight coaches in database after seeding: ${ countResult[ 0 ].total }` );

        return successCount > 0;
    } catch ( error ) {
        console.error( 'Error seeding vehicle coach data:', error );
        throw error;
    }
};

// Insert seats
const seedSeats = async () => {
    try {
        console.log( 'Inserting seats...' );

        // Read CSV data
        const seats = readCSV( 'seats.csv' );

        if ( seats.length === 0 ) {
            console.log( 'No seat data found in the CSV file.' );
            return false;
        }

        console.log( `Found ${ seats.length } seat records to import.` );

        // First get all valid coach IDs from the database
        const [ validCoaches ] = await pool.execute( 'SELECT coachId FROM vehiclecoaches WHERE vehicleId IN (SELECT vehicleId FROM flights)' );
        const validCoachIds = validCoaches.map( coach => coach.coachId );

        console.log( `Found ${ validCoachIds.length } valid flight coach IDs in the database.` );

        // Define batch size
        const batchSize = 50;
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for ( let i = 0; i < seats.length; i += batchSize ) {
            const batch = seats.slice( i, i + batchSize );

            // Process each seat in the current batch
            for ( const seat of batch ) {
                try {
                    // Skip if coach ID is not valid
                    if ( !validCoachIds.includes( seat.coachId ) ) {
                        skippedCount++;
                        if ( skippedCount <= 5 ) {
                            console.warn( `Skipping seat with invalid coachId: seatId=${ seat.seatId }, coachId=${ seat.coachId }` );
                        } else if ( skippedCount === 6 ) {
                            console.warn( 'Additional seats with invalid coach IDs will be skipped without individual logging...' );
                        }
                        continue;
                    }

                    const formattedSeatId = formatUuidForUnhex( seat.seatId );
                    const formattedVehicleId = formatUuidForUnhex( seat.vehicleId );

                    // Insert into seats table
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
                    if ( errorCount <= 5 ) {
                        console.warn( `Error inserting seat: seatId=${ seat.seatId }, vehicleId=${ seat.vehicleId }, seatNumber=${ seat.seatNumber }` );
                        console.warn( `Error details: ${ err.message }` );
                    } else if ( errorCount === 6 ) {
                        console.warn( 'Additional seat insertion errors are occurring but will not be logged individually...' );
                    }
                }
            }

            // Log progress
            console.log( `Processed ${ Math.min( i + batchSize, seats.length ) } of ${ seats.length } seats.` );
        }

        console.log( `Seat insertion complete: ${ successCount } successful, ${ errorCount } failed, ${ skippedCount } skipped due to invalid coach IDs.` );

        // Verify insertion
        const [ countResult ] = await pool.execute( 'SELECT COUNT(*) as total FROM seats WHERE vehicleId IN (SELECT vehicleId FROM flights)' );
        console.log( `Total flight seats in database after seeding: ${ countResult[ 0 ].total }` );

        return successCount > 0;
    } catch ( error ) {
        console.error( 'Error seeding seat data:', error );
        throw error;
    }
};

// Main function to run all seeders
const runAllSeeders = async () => {
    try {
        // Test connection first
        const connected = await testConnection();
        if ( !connected ) {
            throw new Error( 'Failed to connect to database. Please check your credentials.' );
        }

        console.log( '\n=== STARTING FLIGHT DATA SEEDING PROCESS ===\n' );

        // Clear existing data first
        await clearExistingData();

        // Read flight data
        const flights = readCSV( 'flights.csv' );

        if ( flights.length === 0 ) {
            console.error( 'No flight data found in the CSV file. Aborting seeding process.' );
            process.exit( 1 );
        }

        // Check for existing vehicle IDs
        const existingVehicleIds = await checkExistingVehicleIds( flights );

        // First seed the stations
        console.log( '\n--- SEEDING STATIONS ---\n' );
        await seedStations();

        // Seed flights next (with vehicles)
        console.log( '\n--- SEEDING FLIGHTS ---\n' );
        const flightsSuccess = await seedFlights( flights, existingVehicleIds );

        if ( !flightsSuccess ) {
            console.warn( 'Warning: No flights were successfully inserted.' );
        }

        // Seed vehicle stations
        console.log( '\n--- SEEDING VEHICLE STATIONS ---\n' );
        await seedVehicleStations();

        // Seed vehicle coaches
        console.log( '\n--- SEEDING VEHICLE COACHES ---\n' );
        await seedVehicleCoaches();

        // Seed seats
        console.log( '\n--- SEEDING SEATS ---\n' );
        await seedSeats();

        console.log( '\n=== FLIGHT DATA SEEDING COMPLETED ===\n' );
        console.log( 'All flight-related data has been imported successfully.' );

        process.exit( 0 );
    } catch ( error ) {
        console.error( 'Failed to seed flight data:', error );
        process.exit( 1 );
    } finally {
        // Close the pool when done
        await pool.end();
    }
};

// Execute the seeder
runAllSeeders();