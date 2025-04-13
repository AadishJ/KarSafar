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
import axiosInstance from '../Config/axiosInstance';
import { format } from 'date-fns';
import {
    DirectionsBoat,
    LocationOn,
    AccessTime,
    People,
    DirectionsBoat as BoatIcon
} from '@mui/icons-material';

import CruiseDateSelector from '../Component/DateSelector/CruiseDateSelector';

const Cruise = () => {
    const [ searchParams, setSearchParams ] = useState( {
        departurePort: '',
        destinationPort: '',
        departureDate: null,
        returnDate: null,
        duration: 7,
        isRoundTrip: true
    } );

    const [ cruises, setCruises ] = useState( [] );
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
            departurePort: locationInfo.departurePort?.name || '',
            destinationPort: locationInfo.destinationPort?.name || ''
        } ) );
    };

    const handleDurationChange = ( durationInfo ) => {
        setSearchParams( prev => ( {
            ...prev,
            duration: durationInfo.duration
        } ) );
    };

    const searchCruises = async () => {
        // Validate search parameters
        if ( !searchParams.departurePort || !searchParams.destinationPort || !searchParams.departureDate ) {
            setError( 'Please select departure port, destination port, and departure date' );
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
                departurePort: searchParams.departurePort,
                destinationPort: searchParams.destinationPort,
                departureDate: formattedDepartureDate,
                duration: searchParams.duration
            };

            // Make API call
            const response = await axiosInstance.get( '/cruise/list', { params } );

            if ( response.data.success ) {
                setCruises( response.data.data );
            } else {
                setError( 'Failed to fetch cruises' );
            }
        } catch ( err ) {
            console.error( 'Error fetching cruises:', err );
            setError( 'An error occurred while searching for cruises' );
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
                Cruise Search
            </Typography>

            {/* Search Section */}
            <Paper elevation={3} className="mb-8">
                <Box p={3}>
                    <CruiseDateSelector
                        onDateChange={handleDateChange}
                        onLocationChange={handleLocationChange}
                        onDurationChange={handleDurationChange}
                    />

                    <Box mt={3} display="flex" justifyContent="center">
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            onClick={searchCruises}
                            startIcon={<BoatIcon />}
                            disabled={loading}
                            className="px-8 py-3"
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Search Cruises'}
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
                            cruises.length > 0 ? `${ cruises.length } Cruises Found` : 'No Cruises Found'}
                    </Typography>

                    {cruises.length > 0 && (
                        <Grid container spacing={3}>
                            {cruises.map( ( cruise ) => (
                                <Grid item xs={12} key={cruise.id}>
                                    <Paper elevation={2} className="p-4 hover:shadow-lg transition-shadow duration-300">
                                        <Grid container spacing={2}>
                                            {/* Cruise info */}
                                            <Grid item xs={12} md={3}>
                                                <Typography variant="h6" className="font-medium">
                                                    {cruise.name}
                                                </Typography>
                                                <Typography variant="body2" color="textSecondary">
                                                    Cruise #{cruise.id.substring( 0, 6 )}
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    label={cruise.status}
                                                    color={cruise.status === 'active' ? 'success' : 'default'}
                                                    className="mt-2"
                                                />
                                            </Grid>

                                            {/* Departure and arrival */}
                                            <Grid item xs={12} md={5}>
                                                <Box display="flex" alignItems="center" className="mb-1">
                                                    <DirectionsBoat color="primary" className="mr-2" />
                                                    <div>
                                                        <Typography variant="body2" className="font-medium">
                                                            {format( new Date( cruise.departureTime ), 'MMM dd, yyyy' )}
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            {cruise.departurePort}
                                                        </Typography>
                                                    </div>
                                                </Box>

                                                <Box className="border-l-2 border-dashed border-gray-300 h-6 ml-3"></Box>

                                                <Box display="flex" alignItems="center">
                                                    <LocationOn color="primary" className="mr-2" />
                                                    <div>
                                                        <Typography variant="body2" className="font-medium">
                                                            {format( new Date( cruise.arrivalTime ), 'MMM dd, yyyy' )}
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            {cruise.destinationPort}
                                                        </Typography>
                                                    </div>
                                                </Box>

                                                <Box display="flex" alignItems="center" className="mt-2">
                                                    <AccessTime fontSize="small" className="mr-1 text-gray-500" />
                                                    <Typography variant="body2" color="textSecondary">
                                                        {cruise.duration.display}
                                                    </Typography>
                                                </Box>
                                            </Grid>

                                            {/* Seats and price */}
                                            <Grid item xs={12} md={4}>
                                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                                    <Box display="flex" alignItems="center">
                                                        <People className="mr-1 text-gray-500" />
                                                        <Typography variant="body2" color="textSecondary">
                                                            {cruise.availableSeats} cabins available
                                                        </Typography>
                                                    </Box>

                                                    <Typography variant="h6" color="primary" className="font-bold">
                                                        {formatPrice( cruise.basePrice )}
                                                        <Typography variant="caption" sx={{ display: 'block', textAlign: 'right' }}>
                                                            per person
                                                        </Typography>
                                                    </Typography>
                                                </Box>

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

                    {!loading && cruises.length === 0 && searched && (
                        <Paper elevation={1} className="p-8 text-center">
                            <Typography variant="body1" color="textSecondary">
                                No cruises found matching your search criteria.
                            </Typography>
                            <Typography variant="body2" color="textSecondary" className="mt-2">
                                Try changing your search parameters, dates, or duration.
                            </Typography>
                        </Paper>
                    )}
                </Box>
            )}
        </Container>
    );
};

export default Cruise;