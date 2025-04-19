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
    DirectionsRailway,
    TrainOutlined,
    AccessTime,
    EventSeat,
    Train as TrainIcon
} from '@mui/icons-material';

import TrainDateSelector from '../../Component/DateSelector/TrainDateSelector';
import { Link } from 'react-router-dom';

const Train = () => {
    const [ searchParams, setSearchParams ] = useState( {
        source: null,
        destination: null,
        departureDate: null,
        returnDate: null,
        isRoundTrip: true,
        travelClass: ''
    } );

    const [ trains, setTrains ] = useState( [] );
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
            source: locationInfo.source,
            destination: locationInfo.destination
        } ) );
    };

    const handleClassChange = ( travelClass ) => {
        setSearchParams( prev => ( {
            ...prev,
            travelClass: travelClass
        } ) );
    };

    const searchTrains = async () => {
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
                source: searchParams.source.stationName,
                destination: searchParams.destination.stationName,
                departureDate: formattedDepartureDate
            };

            // Add travel class if selected
            if ( searchParams.travelClass ) {
                params.travelClass = searchParams.travelClass;
            }

            // Make API call
            const response = await axiosInstance.get( '/train/list', { params } );

            if ( response.data && response.data.success ) {
                setTrains( response.data.data );
            } else {
                setError( 'Failed to fetch trains: ' + ( response.data?.message || 'Unknown error' ) );
            }
        } catch ( err ) {
            console.error( 'Error fetching trains:', err );
            setError( `An error occurred while searching for trains: ${ err.message || 'Unknown error' }` );
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
                Train Search
            </Typography>

            {/* Search Section */}
            <Paper elevation={3} className="mb-8">
                <Box p={3}>
                    <TrainDateSelector
                        onDateChange={handleDateChange}
                        onLocationChange={handleLocationChange}
                    />

                    <Box mt={3} display="flex" justifyContent="center">
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            onClick={searchTrains}
                            startIcon={<TrainIcon />}
                            disabled={loading}
                            className="px-8 py-3"
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Search Trains'}
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
                            trains.length > 0 ? `${ trains.length } Trains Found` : 'No Trains Found'}
                    </Typography>

                    {trains.length > 0 && (
                        <Grid container spacing={3}>
                            {trains.map( ( train ) => (
                                <Grid item xs={12} key={train.id}>
                                    <Paper elevation={2} className="p-4 hover:shadow-lg transition-shadow duration-300">
                                        <Grid container spacing={2}>
                                            {/* Train info */}
                                            <Grid item xs={12} md={3}>
                                                <Box display="flex" alignItems="center">
                                                    <TrainOutlined color="primary" sx={{ mr: 1 }} />
                                                    <Typography variant="h6" className="font-medium">
                                                        {train.name}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" color="textSecondary">
                                                    Train #{train.number || train.id.substring( 0, 6 )}
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    label={train.status || 'active'}
                                                    color={train.status === 'active' ? 'success' : 'default'}
                                                    className="mt-2"
                                                />
                                            </Grid>

                                            {/* Departure and arrival */}
                                            <Grid item xs={12} md={5}>
                                                <Box display="flex" alignItems="center" className="mb-1">
                                                    <DirectionsRailway color="primary" className="mr-2" />
                                                    <div>
                                                        <Typography variant="body2" className="font-medium">
                                                            {format( new Date( train.departureTime ), 'hh:mm a' )}
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            {train.source || train.origin}
                                                        </Typography>
                                                    </div>
                                                </Box>

                                                <Box className="border-l-2 border-gray-300 h-6 ml-3"></Box>

                                                <Box display="flex" alignItems="center">
                                                    <DirectionsRailway color="primary" className="mr-2" />
                                                    <div>
                                                        <Typography variant="body2" className="font-medium">
                                                            {format( new Date( train.arrivalTime ), 'hh:mm a' )}
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            {train.destination}
                                                        </Typography>
                                                    </div>
                                                </Box>

                                                <Box display="flex" alignItems="center" className="mt-2">
                                                    <AccessTime fontSize="small" className="mr-1 text-gray-500" />
                                                    <Typography variant="body2" color="textSecondary">
                                                        {train.duration?.display || ''}
                                                        {train.distance && ` • ${ train.distance }`}
                                                    </Typography>
                                                </Box>
                                            </Grid>

                                            {/* Seats and price */}
                                            <Grid item xs={12} md={4}>
                                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                                    <Box display="flex" alignItems="center">
                                                        <EventSeat className="mr-1 text-gray-500" />
                                                        <Typography variant="body2" color="textSecondary">
                                                            {Object.values( train.availableSeats || {} ).reduce( ( a, b ) => a + b, 0 ) || 'Limited'} seats available
                                                        </Typography>
                                                    </Box>

                                                    <Typography variant="h6" color="primary" className="font-bold">
                                                        {formatPrice( train.basePrice )}
                                                    </Typography>
                                                </Box>

                                                {/* Available classes */}
                                                <Box mt={1} display="flex" flexWrap="wrap" gap={1}>
                                                    {Object.keys( train.price || {} ).map( coachType => (
                                                        <Chip
                                                            key={coachType}
                                                            label={coachType}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    ) )}
                                                </Box>

                                                <Box mt={2} display="flex" justifyContent="flex-end">
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        size="medium"
                                                        component={Link}
                                                        to={`/trains/${ train.id }`}
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

                    {!loading && trains.length === 0 && searched && (
                        <Paper elevation={1} className="p-8 text-center">
                            <Typography variant="body1" color="textSecondary">
                                No trains found matching your search criteria.
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

export default Train;