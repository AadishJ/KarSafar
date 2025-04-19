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
    Chip,
    Avatar
} from '@mui/material';
import axiosInstance from '../../Config/axiosInstance';
import { format } from 'date-fns';
import {
    Home as HomeIcon,
    LocationOn,
    AccessTime,
    People,
    Star,
    HomeWork,
    NightShelter,
    Apartment,
    Weekend
} from '@mui/icons-material';

import AirbnbDateSelector from '../../Component/DateSelector/AirbnbDateSelector';

const Airbnb = () => {
    const [ searchParams, setSearchParams ] = useState( {
        location: '',
        checkInDate: null,
        checkOutDate: null,
        guests: 2,
        propertyType: 'entire_home'
    } );

    const [ airbnbs, setAirbnbs ] = useState( [] );
    const [ loading, setLoading ] = useState( false );
    const [ error, setError ] = useState( null );
    const [ searched, setSearched ] = useState( false );

    const handleDateChange = ( dateInfo ) => {
        setSearchParams( prev => ( {
            ...prev,
            checkInDate: dateInfo.checkInDate,
            checkOutDate: dateInfo.checkOutDate,
            nights: dateInfo.nights
        } ) );
    };

    const handleLocationChange = ( locationInfo ) => {
        setSearchParams( prev => ( {
            ...prev,
            location: locationInfo.location?.name || ''
        } ) );
    };

    const handleGuestsChange = ( guestInfo ) => {
        setSearchParams( prev => ( {
            ...prev,
            guests: guestInfo.guests
        } ) );
    };

    const handlePropertyTypeChange = ( propertyInfo ) => {
        setSearchParams( prev => ( {
            ...prev,
            propertyType: propertyInfo.propertyType
        } ) );
    };

    const searchAirbnbs = async () => {
        // Validate search parameters
        if ( !searchParams.location || !searchParams.checkInDate || !searchParams.checkOutDate ) {
            setError( 'Please select location and dates' );
            return;
        }

        setLoading( true );
        setError( null );
        setSearched( true );

        try {
            // Format dates for API
            const formattedCheckInDate = format( searchParams.checkInDate, 'yyyy-MM-dd' );
            const formattedCheckOutDate = format( searchParams.checkOutDate, 'yyyy-MM-dd' );

            // Build the query parameters
            const params = {
                location: searchParams.location,
                checkInDate: formattedCheckInDate,
                checkOutDate: formattedCheckOutDate,
                guests: searchParams.guests,
                propertyType: searchParams.propertyType
            };

            // Make API call
            const response = await axiosInstance.get( '/airbnb/list', { params } );

            if ( response.data.success ) {
                setAirbnbs( response.data.data );
            } else {
                setError( 'Failed to fetch listings' );
            }
        } catch ( err ) {
            console.error( 'Error fetching Airbnb listings:', err );
            setError( 'An error occurred while searching for accommodations' );
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

    // Get property type icon based on the type
    const getPropertyTypeIcon = ( type ) => {
        switch ( type ) {
            case 'entire_home':
                return <HomeIcon fontSize="small" />;
            case 'private_room':
                return <NightShelter fontSize="small" />;
            case 'shared_room':
                return <Weekend fontSize="small" />;
            default:
                return <Apartment fontSize="small" />;
        }
    };

    // Get property type label
    const getPropertyTypeLabel = ( type ) => {
        switch ( type ) {
            case 'entire_home':
                return 'Entire home';
            case 'private_room':
                return 'Private room';
            case 'shared_room':
                return 'Shared room';
            default:
                return 'Property';
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center" className="mb-6 font-bold text-gray-800">
                Airbnb Search
            </Typography>

            {/* Search Section */}
            <Paper elevation={3} className="mb-8">
                <Box p={3}>
                    <AirbnbDateSelector
                        onDateChange={handleDateChange}
                        onLocationChange={handleLocationChange}
                        onGuestsChange={handleGuestsChange}
                        onPropertyTypeChange={handlePropertyTypeChange}
                    />

                    <Box mt={3} display="flex" justifyContent="center">
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            onClick={searchAirbnbs}
                            startIcon={<HomeIcon />}
                            disabled={loading}
                            className="px-8 py-3"
                            sx={{ backgroundColor: '#FF5A5F', '&:hover': { backgroundColor: '#FF385F' } }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Search Airbnbs'}
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
                            airbnbs.length > 0 ? `${ airbnbs.length } Stays Found` : 'No Stays Found'}
                    </Typography>

                    {airbnbs.length > 0 && (
                        <Grid container spacing={3}>
                            {airbnbs.map( ( airbnb ) => (
                                <Grid item xs={12} key={airbnb.id}>
                                    <Paper elevation={2} className="p-4 hover:shadow-lg transition-shadow duration-300">
                                        <Grid container spacing={2}>
                                            {/* Airbnb info */}
                                            <Grid item xs={12} md={3}>
                                                <Typography variant="h6" className="font-medium">
                                                    {airbnb.name}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                                    {getPropertyTypeIcon( airbnb.propertyType || 'entire_home' )}
                                                    <Typography variant="body2" color="textSecondary" sx={{ ml: 0.5 }}>
                                                        {getPropertyTypeLabel( airbnb.propertyType || 'entire_home' )}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                                    {[ ...Array( Math.floor( airbnb.rating || 4 ) ) ].map( ( _, i ) => (
                                                        <Star key={i} sx={{ color: '#FF5A5F', fontSize: '1rem' }} />
                                                    ) )}
                                                    <Typography variant="body2" color="textSecondary" sx={{ ml: 0.5 }}>
                                                        {airbnb.rating || 4}/5
                                                    </Typography>
                                                </Box>
                                            </Grid>

                                            {/* Location and details */}
                                            <Grid item xs={12} md={5}>
                                                <Box display="flex" alignItems="center" className="mb-1">
                                                    <LocationOn sx={{ color: '#FF5A5F' }} className="mr-2" />
                                                    <div>
                                                        <Typography variant="body2" className="font-medium">
                                                            {airbnb.address?.city || airbnb.city || searchParams.location}
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            {airbnb.address?.street || ''}
                                                        </Typography>
                                                    </div>
                                                </Box>

                                                <Box display="flex" alignItems="center" className="mt-3">
                                                    <AccessTime fontSize="small" className="mr-1 text-gray-500" />
                                                    <Typography variant="body2" color="textSecondary">
                                                        {format( new Date( searchParams.checkInDate ), 'MMM dd' )} -
                                                        {format( new Date( searchParams.checkOutDate ), 'MMM dd' )}
                                                        ({searchParams.nights} nights)
                                                    </Typography>
                                                </Box>

                                                {airbnb.amenities && (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                                        {Object.entries( airbnb.amenities )
                                                            .filter( ( [ _, value ] ) => value === true )
                                                            .slice( 0, 3 )
                                                            .map( ( [ key ] ) => (
                                                                <Chip
                                                                    key={key}
                                                                    label={key.charAt( 0 ).toUpperCase() + key.slice( 1 )}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{ mr: 0.5 }}
                                                                />
                                                            ) )}
                                                        {Object.entries( airbnb.amenities ).filter( ( [ _, value ] ) => value === true ).length > 3 && (
                                                            <Chip
                                                                label={`+${ Object.entries( airbnb.amenities ).filter( ( [ _, value ] ) => value === true ).length - 3 } more`}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        )}
                                                    </Box>
                                                )}
                                            </Grid>

                                            {/* Capacity and price */}
                                            <Grid item xs={12} md={4}>
                                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                                    <Box display="flex" alignItems="center">
                                                        <People className="mr-1 text-gray-500" />
                                                        <Typography variant="body2" color="textSecondary">
                                                            Up to {airbnb.maxAllowedGuests || searchParams.guests} guests
                                                        </Typography>
                                                    </Box>

                                                    <Typography variant="h6" color="primary" className="font-bold" sx={{ color: '#FF5A5F' }}>
                                                        {formatPrice( airbnb.basePrice || airbnb.price )}
                                                        <Typography variant="caption" display="block" textAlign="right">
                                                            per night
                                                        </Typography>
                                                    </Typography>
                                                </Box>

                                                <Box mt={2} display="flex" justifyContent="flex-end">
                                                    <Button
                                                        variant="contained"
                                                        size="medium"
                                                        sx={{ backgroundColor: '#FF5A5F', '&:hover': { backgroundColor: '#FF385F' } }}
                                                    >
                                                        Reserve
                                                    </Button>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                </Grid>
                            ) )}
                        </Grid>
                    )}

                    {!loading && airbnbs.length === 0 && searched && (
                        <Paper elevation={1} className="p-8 text-center">
                            <Typography variant="body1" color="textSecondary">
                                No Airbnb listings found matching your search criteria.
                            </Typography>
                            <Typography variant="body2" color="textSecondary" className="mt-2">
                                Try changing your location, dates, or guest requirements.
                            </Typography>
                        </Paper>
                    )}
                </Box>
            )}
        </Container>
    );
};

export default Airbnb;