import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Grid2 as Grid,
    Button,
    Divider,
    CircularProgress,
    Chip,
    Card,
    CardContent
} from '@mui/material';
import {
    DirectionsRailway,
    AccessTime,
    EventSeat,
    Speed,
    ArrowRightAlt
} from '@mui/icons-material';
import { format } from 'date-fns';
import axiosInstance from '../Config/axiosInstance';
import TrainDateSelector from '../Component/TrainDateSelector';

const Train = () => {
    const [ searchParams, setSearchParams ] = useState( {
        source: '',
        destination: '',
        departureDate: null,
        returnDate: null,
        isRoundTrip: true,
        travelClass: 'SL' // Default to Sleeper Class
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
            source: locationInfo.source?.name || '',
            destination: locationInfo.destination?.name || ''
        } ) );
    };

    const handleClassChange = ( travelClass ) => {
        setSearchParams( prev => ( {
            ...prev,
            travelClass
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
                source: searchParams.source,
                destination: searchParams.destination,
                departureDate: formattedDepartureDate,
                travelClass: searchParams.travelClass
            };

            // Make API call
            const response = await axiosInstance.get( '/train/list', { params } );

            if ( response.data.success ) {
                setTrains( response.data.data );
            } else {
                setError( 'Failed to fetch trains' );
            }
        } catch ( err ) {
            console.error( 'Error fetching trains:', err );
            setError( 'An error occurred while searching for trains' );
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

    // Get class label from value
    const getClassLabel = ( classValue ) => {
        const classMap = {
            '1A': '1st AC',
            '2A': '2nd AC',
            '3A': '3rd AC',
            'SL': 'Sleeper',
            'CC': 'Chair Car',
            'EC': 'Executive Chair Car',
            '2S': '2nd Sitting'
        };
        return classMap[ classValue ] || classValue;
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
                        onClassChange={handleClassChange}
                    />

                    <Box mt={3} display="flex" justifyContent="center">
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            onClick={searchTrains}
                            startIcon={<DirectionsRailway />}
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
                    <Typography variant="h5" component="h2" gutterBottom className="mb-4 flex items-center">
                        <DirectionsRailway className="mr-2" />
                        {loading ? 'Searching...' :
                            trains.length > 0 ? `${ trains.length } Trains Found` : 'No Trains Found'}
                    </Typography>

                    {trains.length > 0 && (
                        <Grid container spacing={3}>
                            {trains.map( ( train ) => (
                                <Grid item xs={12} key={train.id}>
                                    <Card elevation={2} className="hover:shadow-lg transition-shadow duration-300">
                                        <CardContent>
                                            <Grid container spacing={2}>
                                                {/* Train info */}
                                                <Grid item xs={12} md={3}>
                                                    <Typography variant="h6" className="font-medium flex items-center">
                                                        <DirectionsRailway className="mr-2" color="primary" />
                                                        {train.name}
                                                    </Typography>
                                                    <Typography variant="body2" color="textSecondary">
                                                        Train #{train.number || train.id.substring( 0, 6 )}
                                                    </Typography>
                                                    <Box mt={1}>
                                                        <Chip
                                                            size="small"
                                                            icon={<Speed fontSize="small" />}
                                                            label={train.distance}
                                                            color="default"
                                                            variant="outlined"
                                                            className="mr-2"
                                                        />
                                                        {train.status && (
                                                            <Chip
                                                                size="small"
                                                                label={train.status}
                                                                color={train.status === 'active' ? 'success' : 'default'}
                                                            />
                                                        )}
                                                    </Box>
                                                </Grid>

                                                {/* Departure and arrival */}
                                                <Grid item xs={12} md={5}>
                                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                                        <div>
                                                            <Typography variant="h6" className="font-medium">
                                                                {format( new Date( train.departureTime ), 'hh:mm a' )}
                                                            </Typography>
                                                            <Typography variant="body2" color="textSecondary">
                                                                {train.origin || train.source}
                                                            </Typography>
                                                        </div>

                                                        <div className="flex flex-col items-center">
                                                            <Typography variant="caption" color="textSecondary">
                                                                {train.duration?.display || ""}
                                                            </Typography>
                                                            <Box className="relative w-20 mt-1 mb-1">
                                                                <Divider />
                                                                <ArrowRightAlt className="absolute top-1/2 right-0 transform -translate-y-1/2" />
                                                            </Box>
                                                            <div className="flex items-center">
                                                                <AccessTime fontSize="small" className="mr-1" color="action" />
                                                                <Typography variant="caption" color="textSecondary">
                                                                    {train.distance}
                                                                </Typography>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <Typography variant="h6" className="font-medium">
                                                                {format( new Date( train.arrivalTime ), 'hh:mm a' )}
                                                            </Typography>
                                                            <Typography variant="body2" color="textSecondary">
                                                                {train.destination}
                                                            </Typography>
                                                        </div>
                                                    </Box>
                                                </Grid>

                                                {/* Classes and price */}
                                                <Grid item xs={12} md={4}>
                                                    <Box>
                                                        <Typography variant="subtitle2" gutterBottom>
                                                            Available Classes:
                                                        </Typography>
                                                        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                                                            {Object.entries( train.availableSeats || {} ).map( ( [ classType, seats ] ) => (
                                                                <Chip
                                                                    key={classType}
                                                                    label={`${ getClassLabel( classType ) } (${ seats })`}
                                                                    size="small"
                                                                    color={classType === searchParams.travelClass ? "primary" : "default"}
                                                                    variant={classType === searchParams.travelClass ? "filled" : "outlined"}
                                                                    icon={<EventSeat fontSize="small" />}
                                                                />
                                                            ) )}
                                                        </Box>

                                                        {searchParams.travelClass && train.price && train.price[ searchParams.travelClass ] ? (
                                                            <Typography variant="h6" color="primary" className="font-bold">
                                                                {formatPrice( train.price[ searchParams.travelClass ] )}
                                                                <Typography component="span" variant="caption" className="ml-1">
                                                                    per person
                                                                </Typography>
                                                            </Typography>
                                                        ) : train.basePrice ? (
                                                            <Typography variant="h6" color="primary" className="font-bold">
                                                                {formatPrice( train.basePrice )}
                                                                <Typography component="span" variant="caption" className="ml-1">
                                                                    per person
                                                                </Typography>
                                                            </Typography>
                                                        ) : (
                                                            <Typography variant="body2" color="textSecondary">
                                                                Select a class to see price
                                                            </Typography>
                                                        )}

                                                        <Box mt={2} display="flex" justifyContent="flex-end">
                                                            <Button
                                                                variant="contained"
                                                                color="primary"
                                                                disabled={!( searchParams.travelClass &&
                                                                    ( ( train.price && train.price[ searchParams.travelClass ] ) ||
                                                                        train.basePrice ) )}
                                                            >
                                                                Book Now
                                                            </Button>
                                                        </Box>
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
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