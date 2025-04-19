import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Grid,
    Button,
    Divider,
    CircularProgress,
    Chip
} from '@mui/material';
import axiosInstance from '../../Config/axiosInstance';
import { format } from 'date-fns';
import {
    DirectionsBus,
    LocationOn,
    AccessTime,
    EventSeat,
    AirlineSeatReclineNormal,
    DirectionsBus as BusIcon
} from '@mui/icons-material';

import BusDateSelector from '../../Component/DateSelector/BusDateSelector';

const Bus = () => {
    const [ searchParams, setSearchParams ] = useState( {
        source: '',
        destination: '',
        departureDate: null,
        returnDate: null,
        isRoundTrip: true
    } );

    const [ buses, setBuses ] = useState( [] );
    const [ loading, setLoading ] = useState( false );
    const [ error, setError ] = useState( null );
    const [ searched, setSearched ] = useState( false );

    const handleDateChange = ( dateInfo ) => {
        setSearchParams( prev => ( {
            ...prev,
            departureDate: dateInfo.departureDate,
            returnDate: dateInfo.returnDate,
            isRoundTrip: dateInfo.isRoundTrip
        } ) );
    };

    const handleLocationChange = ( locationInfo ) => {
        setSearchParams( prev => ( {
            ...prev,
            source: locationInfo.source?.name || '',
            destination: locationInfo.destination?.name || ''
        } ) );
    };

    const searchBuses = async () => {
        // Validate search parameters
        if ( !searchParams.source || !searchParams.destination || !searchParams.departureDate ) {
            setError( 'Please select source, destination and departure date' );
            return;
        }

        setLoading( true );
        setError( null );
        setSearched( true );

        try {
            // Format date for API
            const formattedDepartureDate = format( searchParams.departureDate, 'yyyy-MM-dd' );

            // Build the query parameters
            const params = {
                source: searchParams.source,
                destination: searchParams.destination,
                departureDate: formattedDepartureDate
            };

            // Make API call
            const response = await axiosInstance.get( '/bus/list', { params } );

            if ( response.data.success ) {
                setBuses( response.data.data );
            } else {
                setError( 'Failed to fetch buses: ' + ( response.data.message || '' ) );
            }
        } catch ( err ) {
            console.error( 'Error fetching buses:', err );
            setError( 'An error occurred while searching for buses' );
        } finally {
            setLoading( false );
        }
    };

    // Format price with Indian Rupee symbol
    const formatPrice = ( price ) => {
        return new Intl.NumberFormat( 'en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        } ).format( price );
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center" className="mb-6 font-bold text-gray-800">
                Bus Search
            </Typography>

            {/* Search Section */}
            <Paper elevation={3} className="mb-8">
                <Box p={3}>
                    <BusDateSelector
                        onDateChange={handleDateChange}
                        onLocationChange={handleLocationChange}
                    />

                    <Box mt={3} display="flex" justifyContent="center">
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            onClick={searchBuses}
                            startIcon={<BusIcon />}
                            disabled={loading}
                            className="px-8 py-3"
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Search Buses'}
                        </Button>
                    </Box>

                    {error && (
                        <Typography color="error" align="center" className="mt-3">
                            {error}
                        </Typography>
                    )}
                </Box>
            </Paper>

            {/* Results Section */}
            {searched && (
                <Box>
                    <Typography variant="h5" component="h2" gutterBottom className="mb-4">
                        {loading ? 'Searching...' :
                            buses.length > 0 ? `${ buses.length } Buses Found` : 'No Buses Found'}
                    </Typography>

                    {buses.length > 0 && (
                        <Grid container spacing={3}>
                            {buses.map( ( bus ) => (
                                <Grid item xs={12} key={bus.id}>
                                    <Paper elevation={2} className="p-4 hover:shadow-lg transition-shadow duration-300">
                                        <Grid container spacing={2}>
                                            {/* Bus info */}
                                            <Grid item xs={12} md={3}>
                                                <Typography variant="h6" className="font-medium">
                                                    {bus.name || bus.operatorName}
                                                </Typography>
                                                <Typography variant="body2" color="textSecondary">
                                                    {bus.type || 'Express'} • {bus.busNumber || bus.id.substring( 0, 6 )}
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    label={bus.amenities?.ac ? 'AC' : 'Non-AC'}
                                                    color={bus.amenities?.ac ? 'success' : 'default'}
                                                    className="mt-2 mr-1"
                                                />
                                                {bus.amenities?.sleeper && (
                                                    <Chip
                                                        size="small"
                                                        label="Sleeper"
                                                        color="primary"
                                                        variant="outlined"
                                                        className="mt-2"
                                                    />
                                                )}
                                            </Grid>

                                            {/* Departure and arrival */}
                                            <Grid item xs={12} md={5}>
                                                <Box display="flex" alignItems="center" className="mb-1">
                                                    <DirectionsBus color="primary" className="mr-2" />
                                                    <div>
                                                        <Typography variant="body2" className="font-medium">
                                                            {format( new Date( bus.departureTime ), 'hh:mm a' )}
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            {bus.source || bus.from}
                                                        </Typography>
                                                    </div>
                                                </Box>

                                                <Box className="border-l-2 border-gray-300 h-6 ml-3"></Box>

                                                <Box display="flex" alignItems="center">
                                                    <LocationOn color="primary" className="mr-2" />
                                                    <div>
                                                        <Typography variant="body2" className="font-medium">
                                                            {format( new Date( bus.arrivalTime ), 'hh:mm a' )}
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            {bus.destination || bus.to}
                                                        </Typography>
                                                    </div>
                                                </Box>

                                                <Box display="flex" alignItems="center" className="mt-2">
                                                    <AccessTime fontSize="small" className="mr-1 text-gray-500" />
                                                    <Typography variant="body2" color="textSecondary">
                                                        {bus.duration?.display || bus.durationText || '10h 30m'}
                                                        {bus.distance && ` • ${ bus.distance }`}
                                                    </Typography>
                                                </Box>
                                            </Grid>

                                            {/* Seats and price */}
                                            <Grid item xs={12} md={4}>
                                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                                    <Box display="flex" alignItems="center">
                                                        <EventSeat className="mr-1 text-gray-500" />
                                                        <Typography variant="body2" color="textSecondary">
                                                            {bus.availableSeats || 'Limited'} seats available
                                                        </Typography>
                                                    </Box>

                                                    <Typography variant="h6" color="primary" className="font-bold">
                                                        {formatPrice( bus.basePrice || bus.fare || 899 )}
                                                    </Typography>
                                                </Box>

                                                {bus.amenities && (
                                                    <Box mt={1} display="flex" flexWrap="wrap" gap={0.5}>
                                                        {Object.entries( bus.amenities )
                                                            .filter( ( [ _, value ] ) => value === true )
                                                            .map( ( [ key ] ) => (
                                                                <Chip
                                                                    key={key}
                                                                    label={key.charAt( 0 ).toUpperCase() + key.slice( 1 )}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{ mr: 0.5, mb: 0.5 }}
                                                                />
                                                            ) )}
                                                    </Box>
                                                )}

                                                <Box mt={2} display="flex" justifyContent="flex-end">
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        size="medium"
                                                    >
                                                        Book Now
                                                    </Button>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                </Grid>
                            ) )}
                        </Grid>
                    )}

                    {!loading && buses.length === 0 && searched && (
                        <Paper elevation={1} className="p-8 text-center">
                            <Typography variant="body1" color="textSecondary">
                                No buses found matching your search criteria.
                            </Typography>
                            <Typography variant="body2" color="textSecondary" className="mt-2">
                                Try changing your search parameters or dates.
                            </Typography>
                        </Paper>
                    )}
                </Box>
            )}
        </Container>
    );
};

export default Bus; 