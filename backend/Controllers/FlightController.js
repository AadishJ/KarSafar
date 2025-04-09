import { pool } from '../Config/ConnectDB.js';
import { v4 as uuidv4 } from 'uuid';

async function handleFlightListGet( req, res ) {
    try {
        // Extract query parameters (for filtering)
        const { origin, destination, departureDate, returnDate } = req.query;

        // Base query to get flights with their details
        let query = `
            SELECT 
                HEX(f.vehicleId) as flightId, 
                f.flightName,
                v.availableSeats,
                v.status,
                origin.stationName as originStation, 
                origin.departureTime as departureTime,
                destination.stationName as destinationStation,
                destination.arrivalTime as arrivalTime,
                MIN(vc.price) as basePrice
            FROM 
                flights f
            JOIN 
                vehicles v ON f.vehicleId = v.vehicleId
            JOIN 
                vehiclestations origin ON f.vehicleId = origin.vehicleId
            JOIN 
                vehiclestations destination ON f.vehicleId = destination.vehicleId
            LEFT JOIN
                vehiclecoaches vc ON f.vehicleId = vc.vehicleId
            WHERE 
                origin.stationOrder < destination.stationOrder
                AND v.status = 'active'
        `;

        // Add parameters for filtering
        const params = [];

        if ( origin ) {
            query += " AND origin.stationName LIKE ?";
            params.push( `%${ origin }%` );
        }

        if ( destination ) {
            query += " AND destination.stationName LIKE ?";
            params.push( `%${ destination }%` );
        }

        if ( departureDate ) {
            // Convert to date format and filter by date part
            query += " AND DATE(origin.departureTime) = DATE(?)";
            params.push( departureDate );
        }

        // Group by to avoid duplicates and for price aggregation - UPDATED GROUP BY
        query += " GROUP BY f.vehicleId, origin.stationName, destination.stationName, origin.departureTime, destination.arrivalTime, f.flightName, v.availableSeats, v.status";

        // Execute the query
        const [ flights ] = await pool.execute( query, params );

        // Process flight data
        const processedFlights = flights.map( flight => ( {
            id: flight.flightId,
            name: flight.flightName,
            availableSeats: flight.availableSeats,
            status: flight.status,
            origin: flight.originStation,
            destination: flight.destinationStation,
            departureTime: flight.departureTime,
            arrivalTime: flight.arrivalTime,
            duration: calculateDuration( flight.departureTime, flight.arrivalTime ),
            basePrice: flight.basePrice
        } ) );

        res.status( 200 ).json( {
            success: true,
            count: processedFlights.length,
            data: processedFlights
        } );
    } catch ( error ) {
        console.error( 'Error fetching flights:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

// Helper function to calculate flight duration
function calculateDuration( departure, arrival ) {
    const departureTime = new Date( departure );
    const arrivalTime = new Date( arrival );

    // Duration in milliseconds
    const durationMs = arrivalTime - departureTime;

    // Convert to hours and minutes
    const hours = Math.floor( durationMs / ( 60 * 60 * 1000 ) );
    const minutes = Math.floor( ( durationMs % ( 60 * 60 * 1000 ) ) / ( 60 * 1000 ) );

    return {
        hours,
        minutes,
        display: `${ hours }h ${ minutes }m`
    };
}

// Function to get detailed information about a specific flight
async function handleFlightDetailGet( req, res ) {
    try {
        const { flightId } = req.params;

        if ( !flightId ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Flight ID is required'
            } );
        }

        // Query to get flight details
        const [ flightDetails ] = await pool.execute(
            `SELECT 
                HEX(f.vehicleId) as flightId, 
                f.flightName,
                v.availableSeats,
                v.status
            FROM 
                flights f
            JOIN 
                vehicles v ON f.vehicleId = v.vehicleId
            WHERE 
                f.vehicleId = UNHEX(?)`,
            [ flightId ]
        );

        if ( flightDetails.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Flight not found'
            } );
        }

        // Query to get all stations (route)
        const [ stations ] = await pool.execute(
            `SELECT 
                stationName,
                arrivalTime,
                departureTime,
                stoppage,
                stationOrder
            FROM 
                vehicleStations
            WHERE 
                vehicleId = UNHEX(?)
            ORDER BY 
                stationOrder`,
            [ flightId ]
        );

        // Query to get available coach types and prices
        const [ coaches ] = await pool.execute(
            `SELECT 
                coachId,
                coachType,
                seatsAvailable,
                price
            FROM 
                vehicleCoaches
            WHERE 
                vehicleId = UNHEX(?)`,
            [ flightId ]
        );

        // Combine all data
        const flightData = {
            ...flightDetails[ 0 ],
            route: stations,
            coaches: coaches,
        };

        res.status( 200 ).json( {
            success: true,
            data: flightData
        } );

    } catch ( error ) {
        console.error( 'Error fetching flight details:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

export { handleFlightListGet, handleFlightDetailGet };