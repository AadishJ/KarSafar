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
    Card,
    CardContent,
    Rating
} from '@mui/material';
import {
    DirectionsBus,
    AccessTime,
    AirlineSeatReclineNormal,
    NightsStay,
    WbSunny,
    ArrowRightAlt
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';
import BusDateSelector from '../Component/BusDateSelector';

const Bus = () => {
    const [ searchParams, setSearchParams ] = useState( {
        source: '',
        destination: '',
        departureDate: null,
        returnDate: null,
        isRoundTrip: false,
        busType: ''
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

    const handleBusTypeChange = ( busType ) => {
        setSearchParams( prev => ( {
            ...prev,
            busType
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
            // For demo purposes, we'll use mock data instead of an actual API call
            // In a real application, you'd make an API call like:
            // const response = await axios.get('http://localhost:5000/bus', { params: searchParams });

            // Simulate API delay
            await new Promise( resolve => setTimeout( resolve, 1000 ) );

            // Mock bus data
            const mockBuses = [
                {
                    id: "BUS-12345",
                    name: "Sharma Travels",
                    type: "AC_SLEEPER",
                    typeName: "AC Sleeper",
                    origin: searchParams.source,
                    destination: searchParams.destination,
                    departureTime: new Date( searchParams.departureDate ).setHours( 21, 30 ),
                    arrivalTime: new Date( searchParams.departureDate ).setHours( 29, 45 ), // Next day
                    duration: { hours: 8, minutes: 15, display: "8h 15m" },
                    distance: "450 km",
                    availableSeats: 24,
                    totalSeats: 36,
                    amenities: [ "WiFi", "USB Charging", "Blanket", "Water Bottle" ],
                    price: 1200,
                    rating: 4.3,
                    isOvernight: true
                },
                {
                    id: "BUS-67890",
                    name: "Patel Tour & Travels",
                    type: "VOLVO",
                    typeName: "Volvo Multi-Axle",
                    origin: searchParams.source,
                    destination: searchParams.destination,
                    departureTime: new Date( searchParams.departureDate ).setHours( 9, 15 ),
                    arrivalTime: new Date( searchParams.departureDate ).setHours( 16, 30 ),
                    duration: { hours: 7, minutes: 15, display: "7h 15m" },
                    distance: "420 km",
                    availableSeats: 32,
                    totalSeats: 40,
                    amenities: [ "WiFi", "USB Charging", "Entertainment System", "Snacks" ],
                    price: 1500,
                    rating: 4.7,
                    isOvernight: false
                },
                {
                    id: "BUS-54321",
                    name: "Green Line Travels",
                    type: "NON_AC_SEATER",
                    typeName: "Non-AC Seater",
                    origin: searchParams.source,
                    destination: searchParams.destination,
                    departureTime: new Date( searchParams.departureDate ).setHours( 16, 45 ),
                    arrivalTime: new Date( searchParams.departureDate ).setHours( 23, 30 ),
                    duration: { hours: 6, minutes: 45, display: "6h 45m" },
                    distance: "380 km",
                    availableSeats: 18,
                    totalSeats: 42,
                    amenities: [ "Water Bottle", "Regular Stops" ],
                    price: 700,
                    rating: 3.8,
                    isOvernight: true
                }
            ];

            // Filter by bus type if selected
            const filteredBuses = searchParams.busType
                ? mockBuses.filter( bus => bus.type === searchParams.busType )
                : mockBuses;

            setBuses( filteredBuses );
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
                Bus Tickets
            </Typography>

            {/* Search Section */}
            <Paper elevation={3} className="mb-8">
                <Box p={3}>
                    <BusDateSelector
                        onDateChange={handleDateChange}
                        onLocationChange={handleLocationChange}
                        onBusTypeChange={handleBusTypeChange}
                    />

                    <Box mt={3} display="flex" justifyContent="center">
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            onClick={searchBuses}
                            startIcon={<DirectionsBus />}
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
                    <Typography variant="h5" component="h2" gutterBottom className="mb-4 flex items-center">
                        <DirectionsBus className="mr-2" />
                        {loading ? 'Searching...' :
                            buses.length > 0 ? `${ buses.length } Buses Found` : 'No Buses Found'}
                    </Typography>

                    {buses.length > 0 && (
                        <Grid container spacing={3}>
                            {buses.map( ( bus ) => (
                                <Grid item xs={12} key={bus.id}>
                                    <Card elevation={2} className="hover:shadow-lg transition-shadow duration-300">
                                        <CardContent>
                                            <Grid container spacing={2}>
                                                {/* Bus info */}
                                                <Grid item xs={12} sm={3}>
                                                    <Box display="flex" justifyContent="space-between">
                                                        <div>
                                                            <Typography variant="h6" className="font-medium flex items-center">
                                                                {bus.name}
                                                            </Typography>
                                                            <Box display="flex" alignItems="center" mt={0.5}>
                                                                <Typography variant="body2" color="textSecondary" mr={1}>
                                                                    {bus.typeName}
                                                                </Typography>
                                                                {bus.isOvernight ? (
                                                                    <Chip
                                                                        icon={<NightsStay fontSize="small" />}
                                                                        label="Overnight"
                                                                        size="small"
                                                                        color="default"
                                                                        variant="outlined"
                                                                    />
                                                                ) : (
                                                                    <Chip
                                                                        icon={<WbSunny fontSize="small" />}
                                                                        label="Day"
                                                                        size="small"
                                                                        color="primary"
                                                                        variant="outlined"
                                                                    />
                                                                )}
                                                            </Box>
                                                            <Box display="flex" alignItems="center" mt={1}>
                                                                <Rating value={bus.rating} precision={0.1} size="small" readOnly />
                                                                <Typography variant="body2" color="textSecondary" className="ml-1">
                                                                    ({bus.rating})
                                                                </Typography>
                                                            </Box>
                                                        </div>
                                                    </Box>
                                                </Grid>

                                                {/* Departure and arrival */}
                                                <Grid item xs={12} sm={5}>
                                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                                        <div>
                                                            <Typography variant="h6" className="font-medium">
                                                                {format( new Date( bus.departureTime ), 'hh:mm a' )}
                                                            </Typography>
                                                            <Typography variant="body2" color="textSecondary">
                                                                {bus.origin}
                                                            </Typography>
                                                        </div>

                                                        <div className="flex flex-col items-center">
                                                            <Typography variant="caption" color="textSecondary">
                                                                {bus.duration.display}
                                                            </Typography>
                                                            <Box className="relative w-20 mt-1 mb-1">
                                                                <Divider />
                                                                <ArrowRightAlt className="absolute top-1/2 right-0 transform -translate-y-1/2" />
                                                            </Box>
                                                            <Box display="flex" alignItems="center">
                                                                <AccessTime fontSize="small" className="mr-1" color="action" />
                                                                <Typography variant="caption" color="textSecondary">
                                                                    {bus.distance}
                                                                </Typography>
                                                            </Box>
                                                        </div>

                                                        <div>
                                                            <Typography variant="h6" className="font-medium">
                                                                {format( new Date( bus.arrivalTime ), 'hh:mm a' )}
                                                            </Typography>
                                                            <Typography variant="body2" color="textSecondary">
                                                                {bus.destination}
                                                            </Typography>
                                                        </div>
                                                    </Box>

                                                    <Box mt={1.5}>
                                                        <Typography variant="body2" className="font-medium">
                                                            Amenities:
                                                        </Typography>
                                                        <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                                                            {bus.amenities.map( ( amenity, index ) => (
                                                                <Chip key={index} label={amenity} size="small" variant="outlined" />
                                                            ) )}
                                                        </Box>
                                                    </Box>
                                                </Grid>

                                                {/* Seats and price */}
                                                <Grid item xs={12} sm={4}>
                                                    <Box display="flex" flexDirection="column" alignItems="flex-end" height="100%" justifyContent="space-between">
                                                        <div>
                                                            <Box display="flex" alignItems="center" justifyContent="flex-end">
                                                                <AirlineSeatReclineNormal color="primary" className="mr-1" />
                                                                <Typography variant="body2">
                                                                    <span className="font-medium">{bus.availableSeats}</span> seats available
                                                                </Typography>
                                                            </Box>
                                                            <Typography variant="caption" color="textSecondary">
                                                                out of {bus.totalSeats} seats
                                                            </Typography>
                                                        </div>

                                                        <Box mt={2}>
                                                            <Typography variant="h5" color="primary" className="font-bold">
                                                                {formatPrice( bus.price )}
                                                            </Typography>
                                                            <Typography variant="caption" color="textSecondary">
                                                                per passenger
                                                            </Typography>

                                                            <Box mt={1}>
                                                                <Button
                                                                    variant="contained"
                                                                    color="primary"
                                                                    fullWidth
                                                                >
                                                                    Select Seats
                                                                </Button>
                                                            </Box>
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