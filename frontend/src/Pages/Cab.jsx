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
    Rating
} from '@mui/material';
import axiosInstance from '../Config/axiosInstance';
import { format, addMinutes } from 'date-fns';
import {
    LocalTaxi as TaxiIcon,
    LocationOn,
    AccessTime,
    PersonOutline,
    LocalTaxiOutlined,
    StarOutline,
    AutoAwesome,
    CurrencyRupee
} from '@mui/icons-material';

import CabDateSelector from '../Component/DateSelector/CabDateSelector';
import cabStops from '../assets/cabStops.json';

const Cab = () => {
    const [ searchParams, setSearchParams ] = useState( {
        source: null,
        destination: null,
        departureDate: null,
        departureTime: null,
        returnDate: null,
        isRoundTrip: false
    } );

    const [ cabs, setCabs ] = useState( [] );
    const [ loading, setLoading ] = useState( false );
    const [ error, setError ] = useState( null );
    const [ searched, setSearched ] = useState( false );
    const [ cityOptions, setCityOptions ] = useState( [] );

    useEffect( () => {
        // Extract unique cities from cabStops.json for filtering
        const uniqueCities = [ ...new Set( cabStops.map( stop => stop.city ) ) ];
        setCityOptions( uniqueCities );
    }, [] );

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

    const searchCabs = async () => {
        // Validate search parameters
        if ( !searchParams.source || !searchParams.destination || !searchParams.departureDate ) {
            setError( 'Please select pickup location, drop location and departure date/time' );
            return;
        }

        setLoading( true );
        setError( null );
        setSearched( true );

        try {
            // Format date for API
            const formattedDepartureDate = format( searchParams.departureDate, 'yyyy-MM-dd' );
            const formattedDepartureTime = format( searchParams.departureDate, 'HH:mm:ss' );

            // Build the query parameters using stopId from cabStops
            const params = {
                source: searchParams.source.stopId,
                destination: searchParams.destination.stopId,
                departureDate: formattedDepartureDate,
                departureTime: formattedDepartureTime
            };

            // Make API call
            const response = await axiosInstance.get( '/cab/list', { params } );

            if ( response.data.success ) {
                setCabs( response.data.data );
            } else {
                setError( 'Failed to fetch cabs: ' + ( response.data.message || '' ) );
                // Generate mock data for demo purposes
                generateMockCabData();
            }
        } catch ( err ) {
            console.error( 'Error fetching cabs:', err );
            setError( 'An error occurred while searching for cabs' );

            // For development/demo - generate mock data when API is not available
            generateMockCabData();
        } finally {
            setLoading( false );
        }
    };

    // Mock data generator for development/demo purposes
    const generateMockCabData = () => {
        // Calculate distance between source and destination
        // This is a simplification - in reality you'd use coordinates and proper distance calculation
        const sourceCity = searchParams.source.city;
        const destinationCity = searchParams.destination.city;

        // Base distance and duration calculations
        let distance, durationMinutes;

        if ( sourceCity === destinationCity ) {
            // Within city travel
            distance = Math.floor( Math.random() * 15 ) + 5; // 5-20 km
            durationMinutes = distance * 3; // ~20 km/h in city with traffic
        } else {
            // Intercity travel - generate realistic distance
            // This is just a mock approximation
            const cityDistanceMap = {
                'New Delhi': {
                    'Mumbai': 1400,
                    'Bengaluru': 2000,
                    'Chennai': 2200,
                    'Hyderabad': 1500,
                    'Kolkata': 1500,
                },
                'Mumbai': {
                    'New Delhi': 1400,
                    'Bengaluru': 1000,
                    'Chennai': 1300,
                    'Hyderabad': 700,
                    'Kolkata': 2000,
                },
                'Bengaluru': {
                    'New Delhi': 2000,
                    'Mumbai': 1000,
                    'Chennai': 350,
                    'Hyderabad': 570,
                    'Kolkata': 1700,
                }
            };

            if ( cityDistanceMap[ sourceCity ]?.[ destinationCity ] ) {
                distance = cityDistanceMap[ sourceCity ][ destinationCity ];
            } else {
                distance = Math.floor( Math.random() * 1000 ) + 300; // 300-1300 km
            }

            durationMinutes = Math.round( distance * 0.8 ); // ~75 km/h for highways
        }

        // Calculate hours and remaining minutes
        const hours = Math.floor( durationMinutes / 60 );
        const minutes = durationMinutes % 60;

        // Generate different cab options based on the search criteria
        const cabTypes = [
            {
                id: 'CAB001',
                name: 'Premium Sedan',
                type: 'SEDAN',
                typeName: 'Sedan',
                origin: searchParams.source.name,
                destination: searchParams.destination.name,
                departureTime: searchParams.departureDate,
                arrivalTime: addMinutes( new Date( searchParams.departureDate ), durationMinutes ),
                duration: {
                    hours,
                    minutes,
                    display: hours > 0 ? `${ hours }h ${ minutes }m` : `${ minutes }m`
                },
                distance: `${ distance } km`,
                availableSeats: 4,
                basePrice: Math.round( ( distance * 12 + 100 ) / 10 ) * 10, // ~₹12/km + base fare
                amenities: {
                    ac: true,
                    waterBottle: true,
                    chargingPoint: true,
                    musicSystem: true
                },
                rating: 4.5,
                carModel: 'Toyota Camry',
                photo: 'https://example.com/sedan.jpg',
                driverName: 'Rahul Kumar'
            },
            {
                id: 'CAB002',
                name: 'SUV Premium',
                type: 'SUV',
                typeName: 'SUV',
                origin: searchParams.source.name,
                destination: searchParams.destination.name,
                departureTime: searchParams.departureDate,
                arrivalTime: addMinutes( new Date( searchParams.departureDate ), durationMinutes - 5 ),
                duration: {
                    hours,
                    minutes: minutes > 5 ? minutes - 5 : 55,
                    display: hours > 0 ? `${ hours }h ${ minutes - 5 }m` : `${ minutes - 5 }m`
                },
                distance: `${ distance } km`,
                availableSeats: 6,
                basePrice: Math.round( ( distance * 15 + 150 ) / 10 ) * 10, // ~₹15/km + base fare
                amenities: {
                    ac: true,
                    waterBottle: true,
                    chargingPoint: true,
                    musicSystem: true,
                    wifi: true
                },
                rating: 4.8,
                carModel: 'Toyota Innova Crysta',
                photo: 'https://example.com/suv.jpg',
                driverName: 'Ajay Singh'
            },
            {
                id: 'CAB003',
                name: 'Economy',
                type: 'MINI',
                typeName: 'Micro',
                origin: searchParams.source.name,
                destination: searchParams.destination.name,
                departureTime: searchParams.departureDate,
                arrivalTime: addMinutes( new Date( searchParams.departureDate ), durationMinutes + 10 ),
                duration: {
                    hours,
                    minutes: minutes + 10,
                    display: hours > 0 ? `${ hours }h ${ minutes + 10 }m` : `${ minutes + 10 }m`
                },
                distance: `${ distance } km`,
                availableSeats: 4,
                basePrice: Math.round( ( distance * 9 + 75 ) / 10 ) * 10, // ~₹9/km + base fare
                amenities: {
                    ac: true,
                    waterBottle: true,
                    chargingPoint: true
                },
                rating: 4.2,
                carModel: 'Maruti Swift Dzire',
                photo: 'https://example.com/mini.jpg',
                driverName: 'Vijay Sharma'
            }
        ];

        // For intercity travel, add a luxury option
        if ( sourceCity !== destinationCity ) {
            cabTypes.push( {
                id: 'CAB004',
                name: 'Luxury',
                type: 'LUXURY',
                typeName: 'Luxury',
                origin: searchParams.source.name,
                destination: searchParams.destination.name,
                departureTime: searchParams.departureDate,
                arrivalTime: addMinutes( new Date( searchParams.departureDate ), durationMinutes - 15 ),
                duration: {
                    hours,
                    minutes: minutes > 15 ? minutes - 15 : 45,
                    display: hours > 0 ? `${ hours }h ${ minutes - 15 }m` : `${ minutes - 15 }m`
                },
                distance: `${ distance } km`,
                availableSeats: 4,
                basePrice: Math.round( ( distance * 20 + 250 ) / 10 ) * 10, // ~₹20/km + base fare
                amenities: {
                    ac: true,
                    waterBottle: true,
                    chargingPoint: true,
                    musicSystem: true,
                    wifi: true,
                    refreshments: true,
                    leatherSeats: true
                },
                rating: 4.9,
                carModel: 'Mercedes-Benz E-Class',
                photo: 'https://example.com/luxury.jpg',
                driverName: 'Rajan Kapoor'
            } );
        }

        // For short distances within city, add a bike option
        if ( sourceCity === destinationCity && distance < 15 ) {
            cabTypes.push( {
                id: 'CAB005',
                name: 'Bike Taxi',
                type: 'BIKE',
                typeName: 'Bike',
                origin: searchParams.source.name,
                destination: searchParams.destination.name,
                departureTime: searchParams.departureDate,
                arrivalTime: addMinutes( new Date( searchParams.departureDate ), Math.round( durationMinutes * 0.8 ) ),
                duration: {
                    hours: 0,
                    minutes: Math.round( durationMinutes * 0.8 ),
                    display: `${ Math.round( durationMinutes * 0.8 ) }m`
                },
                distance: `${ distance } km`,
                availableSeats: 1,
                basePrice: Math.round( ( distance * 6 + 25 ) / 5 ) * 5, // ~₹6/km + base fare
                amenities: {
                    helmet: true
                },
                rating: 4.3,
                carModel: 'Hero Splendor+',
                photo: 'https://example.com/bike.jpg',
                driverName: 'Vivek Yadav'
            } );
        }

        setCabs( cabTypes );
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
            <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 3, fontWeight: 600, color: 'text.primary' }}>
                Cab Search
            </Typography>

            {/* Search Section */}
            <Paper elevation={3} sx={{ mb: 4, borderRadius: 2 }}>
                <Box p={3}>
                    <CabDateSelector
                        onDateChange={handleDateChange}
                        onLocationChange={handleLocationChange}
                    />

                    <Box mt={3} display="flex" justifyContent="center">
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            onClick={searchCabs}
                            startIcon={<TaxiIcon />}
                            disabled={loading}
                            sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Find Cabs'}
                        </Button>
                    </Box>

                    {error && (
                        <Typography color="error" align="center" sx={{ mt: 2 }}>
                            {error}
                        </Typography>
                    )}
                </Box>
            </Paper>

            {/* Results Section */}
            {searched && (
                <Box>
                    <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 500 }}>
                        {loading ? 'Searching for available cabs...' :
                            cabs.length > 0 ? `${ cabs.length } Cabs Available from ${ searchParams.source?.name || '' } to ${ searchParams.destination?.name || '' }` : 'No Cabs Found'}
                    </Typography>

                    {cabs.length > 0 && (
                        <Grid container spacing={3}>
                            {cabs.map( ( cab ) => (
                                <Grid item xs={12} key={cab.id}>
                                    <Paper
                                        elevation={2}
                                        sx={{
                                            p: 3,
                                            borderRadius: 2,
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                                transform: 'translateY(-2px)'
                                            }
                                        }}
                                    >
                                        <Grid container spacing={2}>
                                            {/* Cab info */}
                                            <Grid item xs={12} md={3}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <LocalTaxiOutlined color="primary" sx={{ mr: 1 }} />
                                                        <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                                            {cab.typeName || cab.type}
                                                        </Typography>
                                                    </Box>

                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                        {cab.carModel || cab.name}
                                                    </Typography>

                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <Rating
                                                            value={cab.rating || 4.5}
                                                            precision={0.1}
                                                            size="small"
                                                            readOnly
                                                        />
                                                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                                            {cab.rating || 4.5}/5
                                                        </Typography>
                                                    </Box>

                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <PersonOutline fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {cab.driverName || 'Professional Driver'}
                                                        </Typography>
                                                    </Box>

                                                    <Box sx={{ mt: 'auto', pt: 1 }}>
                                                        <Chip
                                                            size="small"
                                                            label={cab.availableSeats + ' Seater'}
                                                            color="primary"
                                                            variant="outlined"
                                                            sx={{ mr: 1 }}
                                                        />
                                                    </Box>
                                                </Box>
                                            </Grid>

                                            {/* Journey details */}
                                            <Grid item xs={12} md={5}>
                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                                                    <TaxiIcon color="primary" sx={{ mr: 1.5, mt: 0.5 }} />
                                                    <Box>
                                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                            {format( new Date( cab.departureTime ), 'hh:mm a' )}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {cab.origin}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Box sx={{ display: 'flex', ml: 1.8, pl: 0.2 }}>
                                                    <Box sx={{ borderLeft: '2px dashed rgba(0,0,0,0.1)', height: '30px' }} />
                                                </Box>

                                                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                                    <LocationOn color="error" sx={{ mr: 1.5, mt: 0.5 }} />
                                                    <Box>
                                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                            {format( new Date( cab.arrivalTime ), 'hh:mm a' )}
                                                            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                                                (estimated)
                                                            </Typography>
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {cab.destination}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                                    <AccessTime fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {cab.duration?.display} {cab.distance && `• ${ cab.distance }`}
                                                    </Typography>
                                                </Box>
                                            </Grid>

                                            {/* Price and booking */}
                                            <Grid item xs={12} md={4}>
                                                <Box sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    height: '100%',
                                                    justifyContent: 'space-between'
                                                }}>
                                                    <Box>
                                                        <Box sx={{
                                                            display: 'flex',
                                                            justifyContent: 'flex-end',
                                                            alignItems: 'baseline',
                                                            mb: 2
                                                        }}>
                                                            <Typography variant="h5" color="primary" sx={{ fontWeight: 600 }}>
                                                                {formatPrice( cab.basePrice )}
                                                            </Typography>
                                                        </Box>

                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 0.5 }}>
                                                            {cab.amenities && Object.entries( cab.amenities )
                                                                .filter( ( [ _, value ] ) => value === true )
                                                                .map( ( [ key ] ) => (
                                                                    <Chip
                                                                        key={key}
                                                                        label={key.charAt( 0 ).toUpperCase() + key.slice( 1 ).replace( /([A-Z])/g, ' $1' )}
                                                                        size="small"
                                                                        variant="outlined"
                                                                        sx={{ mb: 0.5 }}
                                                                    />
                                                                ) )
                                                            }
                                                        </Box>
                                                    </Box>

                                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                                        <Button
                                                            variant="contained"
                                                            color="primary"
                                                            size="large"
                                                            startIcon={<AutoAwesome />}
                                                            sx={{ borderRadius: 2 }}
                                                        >
                                                            Book Now
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                </Grid>
                            ) )}
                        </Grid>
                    )}

                    {!loading && cabs.length === 0 && searched && (
                        <Paper elevation={1} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                            <TaxiIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">
                                No cabs found between {searchParams.source?.name} and {searchParams.destination?.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Try changing your pickup/drop locations or select a different time.
                            </Typography>
                        </Paper>
                    )}
                </Box>
            )}
        </Container>
    );
};

export default Cab;