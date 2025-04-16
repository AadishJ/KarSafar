import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import mysql from 'mysql2/promise';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

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

// Helper function to clear existing data
const clearExistingData = async () => {
    try {
        // Delete in reverse order of dependencies
        await pool.execute( 'DELETE FROM seats' );
        await pool.execute( 'DELETE FROM vehiclestations' );
        await pool.execute( 'DELETE FROM vehiclecoaches' );
        await pool.execute( 'DELETE FROM trains' );
        await pool.execute( 'DELETE FROM flights' );
        await pool.execute( 'DELETE FROM buses' );
        await pool.execute( 'DELETE FROM cabs' );
        await pool.execute( 'DELETE FROM cruises' );
        await pool.execute( 'DELETE FROM vehicles' );

        console.log( 'Existing data cleared successfully.' );
    } catch ( error ) {
        console.error( 'Error clearing existing data:', error );
        throw error;
    }
};

// Main seeding function
const seedVehicles = async () => {
    try {
        // Test connection first
        const connected = await testConnection();
        if ( !connected ) {
            throw new Error( 'Failed to connect to database. Please check your credentials.' );
        }

        console.log( 'Starting database seeding with CSV data...' );

        // Clear existing data first to avoid conflicts
        await clearExistingData();

        // Read CSV data
        const vehicleCoaches = readCSV( 'vehicleCoaches.csv' );
        const vehicleStations = readCSV( 'vehicleStations.csv' );
        const seats = readCSV( 'seats.csv' );

        // Create a set of unique coach entries to filter out duplicates
        const uniqueCoachEntries = new Map();
        vehicleCoaches.forEach( coach => {
            // Create a unique key combining vehicleId and coachId
            const uniqueKey = `${ coach.vehicleId }_${ coach.coachId }`;
            // Only keep the first occurrence of each coachId
            if ( !uniqueCoachEntries.has( uniqueKey ) ) {
                uniqueCoachEntries.set( uniqueKey, coach );
            } else {
                console.warn( `Skipping duplicate coach entry: vehicleId=${ coach.vehicleId }, coachId=${ coach.coachId }` );
            }
        } );

        // Convert back to array
        const uniqueCoaches = Array.from( uniqueCoachEntries.values() );
        console.log( `Found ${ uniqueCoaches.length } unique coaches after filtering duplicates` );

        // Extract unique vehicle IDs from coaches data
        const uniqueVehicleIds = [ ...new Set( uniqueCoaches.map( coach => coach.vehicleId ) ) ];
        console.log( `Found ${ uniqueVehicleIds.length } unique vehicles in CSV data` );

        // Map vehicle types based on coach IDs
        const getVehicleType = ( coachIds ) => {
            if ( coachIds.some( id => id.startsWith( 'T' ) ) ) return 'train';
            if ( coachIds.some( id => id.startsWith( 'F' ) ) ) return 'flight';
            if ( coachIds.some( id => id.startsWith( 'B' ) ) ) return 'bus';
            if ( coachIds.some( id => id.startsWith( 'C' ) && !id.startsWith( 'CR' ) ) ) return 'cab';
            if ( coachIds.some( id => id.startsWith( 'CR' ) ) ) return 'cruise';
            return 'unknown';
        };

        // Group coaches by vehicle ID
        const coachesByVehicle = {};
        uniqueCoaches.forEach( coach => {
            if ( !coachesByVehicle[ coach.vehicleId ] ) {
                coachesByVehicle[ coach.vehicleId ] = [];
            }
            coachesByVehicle[ coach.vehicleId ].push( coach );
        } );

        // Determine vehicle types and total seats
        const vehicleDetails = {};
        for ( const vehicleId of uniqueVehicleIds ) {
            const coaches = coachesByVehicle[ vehicleId ] || [];
            const coachIds = coaches.map( coach => coach.coachId );
            const vehicleType = getVehicleType( coachIds );
            const totalSeats = coaches.reduce( ( sum, coach ) => sum + parseInt( coach.seatsAvailable || 0, 10 ), 0 );

            vehicleDetails[ vehicleId ] = {
                vehicleType,
                totalSeats,
                coaches
            };
        }

        // Insert vehicles
        console.log( 'Inserting vehicles...' );
        for ( const vehicleId of uniqueVehicleIds ) {
            const details = vehicleDetails[ vehicleId ];
            await pool.execute(
                'INSERT INTO vehicles (vehicleId, vehicleType, status, availableSeats) VALUES (UNHEX(?), ?, ?, ?)',
                [ vehicleId, details.vehicleType, 'active', details.totalSeats ]
            );
        }
        console.log( 'Vehicles inserted successfully.' );

        // Extract vehicle stations for route information
        const stationsByVehicle = {};
        vehicleStations.forEach( station => {
            if ( !stationsByVehicle[ station.vehicleId ] ) {
                stationsByVehicle[ station.vehicleId ] = [];
            }
            stationsByVehicle[ station.vehicleId ].push( station );
        } );

        // Insert specific vehicle types
        for ( const vehicleId of uniqueVehicleIds ) {
            const details = vehicleDetails[ vehicleId ];
            const stations = stationsByVehicle[ vehicleId ] || [];
            const firstStation = stations.find( s => parseInt( s.stationOrder ) === 1 );
            const lastStation = stations.sort( ( a, b ) =>
                parseInt( b.stationOrder ) - parseInt( a.stationOrder ) )[ 0 ];

            let source = firstStation ? firstStation.stationName : 'Unknown';
            let destination = lastStation ? lastStation.stationName : 'Unknown';

            switch ( details.vehicleType ) {
                case 'train':
                    console.log( `Inserting train: ${ vehicleId }` );
                    const trainName = `${ source }-${ destination } Express`;
                    await pool.execute(
                        'INSERT INTO trains (vehicleId, trainName) VALUES (UNHEX(?), ?)',
                        [ vehicleId, trainName ]
                    );
                    break;

                case 'flight':
                    console.log( `Inserting flight: ${ vehicleId }` );
                    const flightName = `${ source.split( ' ' )[ 0 ] }-${ destination.split( ' ' )[ 0 ] } Airways`;
                    await pool.execute(
                        'INSERT INTO flights (vehicleId, flightName) VALUES (UNHEX(?), ?)',
                        [ vehicleId, flightName ]
                    );
                    break;

                case 'bus':
                    console.log( `Inserting bus: ${ vehicleId }` );
                    const busName = `${ source.split( ' ' )[ 0 ] } Travels`;
                    await pool.execute(
                        'INSERT INTO buses (vehicleId, busName, photo) VALUES (UNHEX(?), ?, NULL)',
                        [ vehicleId, busName ]
                    );
                    break;

                case 'cab':
                    console.log( `Inserting cab: ${ vehicleId }` );
                    const cabModel = details.coaches.length > 0 && details.coaches[ 0 ].coachType === 'Premium Sedan'
                        ? 'Toyota Camry'
                        : 'Honda Civic';
                    await pool.execute(
                        'INSERT INTO cabs (vehicleId, carModel, photo) VALUES (UNHEX(?), ?, NULL)',
                        [ vehicleId, cabModel ]
                    );
                    break;

                case 'cruise':
                    console.log( `Inserting cruise: ${ vehicleId }` );
                    const cruiseName = `${ destination } Star Cruise`;
                    await pool.execute(
                        'INSERT INTO cruises (vehicleId, cruiseName, photo) VALUES (UNHEX(?), ?, NULL)',
                        [ vehicleId, cruiseName ]
                    );
                    break;
            }
        }
        console.log( 'Specific vehicle types inserted successfully.' );

        // Insert vehicle coaches
        console.log( 'Inserting vehicle coaches...' );
        for ( const coach of uniqueCoaches ) {
            try {
                await pool.execute(
                    'INSERT INTO vehiclecoaches (vehicleId, coachId, coachType, seatsAvailable, price) VALUES (UNHEX(?), ?, ?, ?, ?)',
                    [
                        coach.vehicleId,
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
        console.log( 'Vehicle coaches inserted successfully.' );

        // Insert seats
        console.log( 'Inserting seats...' );
        for ( const seat of seats ) {
            try {
                await pool.execute(
                    'INSERT INTO seats (seatId, vehicleId, coachId, seatNumber) VALUES (?, UNHEX(?), ?, ?)',
                    [ seat.seatId, seat.vehicleId, seat.coachId, seat.seatNumber ]
                );
            } catch ( err ) {
                console.warn( `Skipping seat insertion due to error: seatId=${ seat.seatId }` );
                console.warn( `Error details: ${ err.message }` );
            }
        }
        console.log( 'Seats inserted successfully.' );

        // Insert vehicle stations
        console.log( 'Inserting vehicle stations...' );
        for ( const station of vehicleStations ) {
            try {
                await pool.execute(
                    'INSERT INTO vehiclestations (stationId, vehicleId, stationName, arrivalTime, departureTime, stoppage, stationOrder) VALUES (?, UNHEX(?), ?, ?, ?, ?, ?)',
                    [
                        station.stationId,
                        station.vehicleId,
                        station.stationName,
                        station.arrivalTime,
                        station.departureTime,
                        parseInt( station.stoppage, 10 ),
                        parseInt( station.stationOrder, 10 )
                    ]
                );
            } catch ( err ) {
                console.warn( `Skipping station insertion due to error: stationId=${ station.stationId }` );
                console.warn( `Error details: ${ err.message }` );
            }
        }
        console.log( 'Vehicle stations inserted successfully.' );

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