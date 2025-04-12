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
    Hotel as HotelIcon,
    LocationOn,
    AccessTime,
    People,
    Star
} from '@mui/icons-material';

import HotelDateSelector from '../Component/HotelDateSelector';

const Hotel = () => {
    const [ searchParams, setSearchParams ] = useState( {
        location: '',
        checkInDate: null,
        checkOutDate: null,
        guests: 2,
        rooms: 1
    } );

    const [ hotels, setHotels ] = useState( [] );
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
            guests: guestInfo.guests,
            rooms: guestInfo.rooms
        } ) );
    };

    const searchHotels = async () => {
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
                rooms: searchParams.rooms
            };

            // Make API call
            const response = await axiosInstance.get( '/hotel/list', { params } );

            if ( response.data.success ) {
                setHotels( response.data.data );
            } else {
                setError( 'Failed to fetch hotels' );
            }
        } catch ( err ) {
            console.error( 'Error fetching hotels:', err );
            setError( 'An error occurred while searching for hotels' );
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
                Hotel Search
            </Typography>

            {/* Search Section */}
            <Paper elevation={3} className="mb-8">
                <Box p={3}>
                    <HotelDateSelector
                        onDateChange={handleDateChange}
                        onLocationChange={handleLocationChange}
                        onGuestsChange={handleGuestsChange}
                    />

                    <Box mt={3} display="flex" justifyContent="center">
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            onClick={searchHotels}
                            startIcon={<HotelIcon />}
                            disabled={loading}
                            className="px-8 py-3"
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Search Hotels'}
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
                            hotels.length > 0 ? `${ hotels.length } Hotels Found` : 'No Hotels Found'}
                    </Typography>

                    {hotels.length > 0 && (
                        <Grid container spacing={3}>
                            {hotels.map( ( hotel ) => (
                                <Grid item xs={12} key={hotel.id}>
                                    <Paper elevation={2} className="p-4 hover:shadow-lg transition-shadow duration-300">
                                        <Grid container spacing={2}>
                                            {/* Hotel info */}
                                            <Grid item xs={12} md={3}>
                                                <Typography variant="h6" className="font-medium">
                                                    {hotel.name}
                                                </Typography>
                                                <Typography variant="body2" color="textSecondary">
                                                    {hotel.accomType || 'Standard Hotel'}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                                    {[ ...Array( Math.floor( hotel.rating || 4 ) ) ].map( ( _, i ) => (
                                                        <Star key={i} sx={{ color: '#FFD700', fontSize: '1rem' }} />
                                                    ) )}
                                                    <Typography variant="body2" color="textSecondary" sx={{ ml: 0.5 }}>
                                                        {hotel.rating || 4}/5
                                                    </Typography>
                                                </Box>
                                            </Grid>

                                            {/* Location and details */}
                                            <Grid item xs={12} md={5}>
                                                <Box display="flex" alignItems="center" className="mb-1">
                                                    <LocationOn color="primary" className="mr-2" />
                                                    <div>
                                                        <Typography variant="body2" className="font-medium">
                                                            {hotel.address?.city || hotel.city || searchParams.location}
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            {hotel.address?.street || ''}
                                                        </Typography>
                                                    </div>
                                                </Box>

                                                <Box display="flex" alignItems="center" className="mt-3">
                                                    <AccessTime fontSize="small" className="mr-1 text-gray-500" />
                                                    <Typography variant="body2" color="textSecondary">
                                                        Check-in: {format( new Date( searchParams.checkInDate ), 'MMM dd' )} -
                                                        Check-out: {format( new Date( searchParams.checkOutDate ), 'MMM dd' )}
                                                        ({searchParams.nights} nights)
                                                    </Typography>
                                                </Box>

                                                {hotel.amenities && (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                                        {Object.entries( hotel.amenities )
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
                                                        {Object.entries( hotel.amenities ).filter( ( [ _, value ] ) => value === true ).length > 3 && (
                                                            <Chip
                                                                label={`+${ Object.entries( hotel.amenities ).filter( ( [ _, value ] ) => value === true ).length - 3 } more`}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        )}
                                                    </Box>
                                                )}
                                            </Grid>

                                            {/* Rooms and price */}
                                            <Grid item xs={12} md={4}>
                                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                                    <Box display="flex" alignItems="center">
                                                        <People className="mr-1 text-gray-500" />
                                                        <Typography variant="body2" color="textSecondary">
                                                            {hotel.roomsAvailable || 'Limited'} rooms available
                                                        </Typography>
                                                    </Box>

                                                    <Typography variant="h6" color="primary" className="font-bold">
                                                        {formatPrice( hotel.basePrice || hotel.price )}
                                                        <Typography variant="caption" display="block" textAlign="right">
                                                            per night
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

                    {!loading && hotels.length === 0 && searched && (
                        <Paper elevation={1} className="p-8 text-center">
                            <Typography variant="body1" color="textSecondary">
                                No hotels found matching your search criteria.
                            </Typography>
                            <Typography variant="body2" color="textSecondary" className="mt-2">
                                Try changing your location, dates or guest requirements.
                            </Typography>
                        </Paper>
                    )}
                </Box>
            )}
        </Container>
    );
};

export default Hotel;