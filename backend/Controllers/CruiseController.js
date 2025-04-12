import { pool } from '../Config/ConnectDB.js';
import { v4 as uuidv4 } from 'uuid';

async function handleCruiseListGet( req, res ) {
    try {
        // Extract query parameters (for filtering)
        const { departurePort, destinationPort, departureDate, duration } = req.query;

        // Base query to get cruises with their details
        let query = `
            SELECT 
                HEX(c.vehicleId) as cruiseId, 
                c.cruiseName,
                c.photo,
                v.availableSeats,
                v.status,
                origin.stationName as departurePort, 
                origin.departureTime as departureTime,
                destination.stationName as destinationPort,
                destination.arrivalTime as arrivalTime,
                MIN(vc.price) as basePrice
            FROM 
                cruises c
            JOIN 
                vehicles v ON c.vehicleId = v.vehicleId
            JOIN 
                vehiclestations origin ON c.vehicleId = origin.vehicleId
            JOIN 
                vehiclestations destination ON c.vehicleId = destination.vehicleId
            LEFT JOIN
                vehiclecoaches vc ON c.vehicleId = vc.vehicleId
            WHERE 
                origin.stationOrder < destination.stationOrder
                AND v.status = 'active'
        `;

        // Add parameters for filtering
        const params = [];

        if ( departurePort ) {
            query += " AND origin.stationName LIKE ?";
            params.push( `%${ departurePort }%` );
        }

        if ( destinationPort ) {
            query += " AND destination.stationName LIKE ?";
            params.push( `%${ destinationPort }%` );
        }

        if ( departureDate ) {
            // Convert to date format and filter by date part
            query += " AND DATE(origin.departureTime) = DATE(?)";
            params.push( departureDate );
        }

        if ( duration ) {
            // Filter by approximate cruise duration in days
            query += " AND DATEDIFF(destination.arrivalTime, origin.departureTime) BETWEEN ? AND ?";
            // Allow for +/- 1 day flexibility in duration
            params.push( parseInt( duration ) - 1, parseInt( duration ) + 1 );
        }

        // Group by to avoid duplicates and for price aggregation
        query += " GROUP BY c.vehicleId, origin.stationName, destination.stationName, origin.departureTime, destination.arrivalTime, c.cruiseName, c.photo, v.availableSeats, v.status";

        // Execute the query
        const [ cruises ] = await pool.execute( query, params );

        // Process cruise data
        const processedCruises = cruises.map( cruise => ( {
            id: cruise.cruiseId,
            name: cruise.cruiseName,
            photo: cruise.photo,
            availableSeats: cruise.availableSeats,
            status: cruise.status,
            departurePort: cruise.departurePort,
            destinationPort: cruise.destinationPort,
            departureTime: cruise.departureTime,
            arrivalTime: cruise.arrivalTime,
            duration: calculateDuration( cruise.departureTime, cruise.arrivalTime ),
            basePrice: cruise.basePrice
        } ) );

        res.status( 200 ).json( {
            success: true,
            count: processedCruises.length,
            data: processedCruises
        } );
    } catch ( error ) {
        console.error( 'Error fetching cruises:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

// Helper function to calculate cruise duration
function calculateDuration( departure, arrival ) {
    const departureTime = new Date( departure );
    const arrivalTime = new Date( arrival );

    // Duration in milliseconds
    const durationMs = arrivalTime - departureTime;

    // Convert to days
    const days = Math.round( durationMs / ( 24 * 60 * 60 * 1000 ) );
    const nights = days - 1;

    return {
        days,
        nights,
        display: `${ days } Days, ${ nights } Nights`
    };
}

// Function to get detailed information about a specific cruise
async function handleCruiseDetailGet( req, res ) {
    try {
        const { cruiseId } = req.params;

        if ( !cruiseId ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Cruise ID is required'
            } );
        }

        // Query to get cruise details
        const [ cruiseDetails ] = await pool.execute(
            `SELECT 
                HEX(c.vehicleId) as cruiseId, 
                c.cruiseName,
                c.photo,
                v.availableSeats,
                v.status
            FROM 
                cruises c
            JOIN 
                vehicles v ON c.vehicleId = v.vehicleId
            WHERE 
                c.vehicleId = UNHEX(?)`,
            [ cruiseId ]
        );

        if ( cruiseDetails.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'Cruise not found'
            } );
        }

        // Query to get all stations (ports of call)
        const [ ports ] = await pool.execute(
            `SELECT 
                stationName as portName,
                arrivalTime,
                departureTime,
                stoppage as portDuration,
                stationOrder
            FROM 
                vehicleStations
            WHERE 
                vehicleId = UNHEX(?)
            ORDER BY 
                stationOrder`,
            [ cruiseId ]
        );

        // Query to get available cabin types and prices
        const [ cabins ] = await pool.execute(
            `SELECT 
                coachId as cabinId,
                coachType as cabinType,
                seatsAvailable as capacity,
                price
            FROM 
                vehicleCoaches
            WHERE 
                vehicleId = UNHEX(?)`,
            [ cruiseId ]
        );

        // Query to get amenities (by querying drivers table for cruise staff info)
        const [ staff ] = await pool.execute(
            `SELECT 
                HEX(driverId) as staffId,
                driverName as staffName,
                driverPhoneNo as contactNumber
            FROM 
                vehicleDrivers
            WHERE 
                vehicleId = UNHEX(?)`,
            [ cruiseId ]
        );

        // Calculate overall duration
        let cruiseDuration = null;
        if ( ports.length >= 2 ) {
            const firstPort = ports[ 0 ];
            const lastPort = ports[ ports.length - 1 ];
            cruiseDuration = calculateDuration( firstPort.departureTime, lastPort.arrivalTime );
        }

        // Combine all data
        const cruiseData = {
            ...cruiseDetails[ 0 ],
            duration: cruiseDuration,
            itinerary: ports,
            cabinTypes: cabins,
            staff: staff
        };

        res.status( 200 ).json( {
            success: true,
            data: cruiseData
        } );

    } catch ( error ) {
        console.error( 'Error fetching cruise details:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

// Function to search available cabins for a cruise
async function handleCruiseAvailabilityCheck( req, res ) {
    try {
        const { cruiseId } = req.params;
        const { cabinType, passengers } = req.query;

        if ( !cruiseId ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Cruise ID is required'
            } );
        }

        // Base query to check cabin availability
        let query = `
            SELECT 
                vc.coachId as cabinId,
                vc.coachType as cabinType,
                vc.seatsAvailable as totalCapacity,
                vc.price as basePrice,
                COUNT(s.seatId) as bookedSeats,
                (vc.seatsAvailable - COUNT(DISTINCT s.seatId)) as availableSeats
            FROM 
                vehicleCoaches vc
            LEFT JOIN 
                seats s ON vc.vehicleId = s.vehicleId AND vc.coachId = s.coachId
            WHERE 
                vc.vehicleId = UNHEX(?)
        `;

        const params = [ cruiseId ];

        if ( cabinType ) {
            query += " AND vc.coachType = ?";
            params.push( cabinType );
        }

        query += " GROUP BY vc.coachId";

        // Execute the query
        const [ cabinAvailability ] = await pool.execute( query, params );

        // Filter by passenger count if specified
        const availableCabins = passengers
            ? cabinAvailability.filter( cabin => cabin.availableSeats >= parseInt( passengers ) )
            : cabinAvailability;

        res.status( 200 ).json( {
            success: true,
            count: availableCabins.length,
            data: availableCabins
        } );

    } catch ( error ) {
        console.error( 'Error checking cruise availability:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
}

export { handleCruiseListGet, handleCruiseDetailGet, handleCruiseAvailabilityCheck };