import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Card,
    CardContent,
    Grid2 as Grid,
    Chip,
    Divider,
    Button,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    Alert,
    Paper,
    Tabs,
    Tab
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
    ExpandMore, Flight, DirectionsBus, DirectionsBoat, Hotel,
    Train, DirectionsCar, Receipt, Download, CancelOutlined
} from '@mui/icons-material';
import axiosInstance from '../Config/axiosInstance';
import { useAuth } from '../Contexts/auth.context';

// Function to format date and time
const formatDateTime = ( dateTimeStr ) => {
    if ( !dateTimeStr ) return '';
    const date = new Date( dateTimeStr );
    return date.toLocaleString( 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    } );
};

// Function to format date
const formatDate = ( dateStr ) => {
    if ( !dateStr ) return '';
    const date = new Date( dateStr );
    return date.toLocaleDateString( 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    } );
};

// Function to format price
const formatPrice = ( price ) => {
    return `₹${ parseFloat( price ).toLocaleString( 'en-IN' ) }`;
};

// Get vehicle icon based on type
const getVehicleIcon = ( type ) => {
    switch ( type?.toLowerCase() ) {
        case 'flight': return <Flight />;
        case 'train': return <Train />;
        case 'bus': return <DirectionsBus />;
        case 'cab': return <DirectionsCar />;
        case 'cruise': return <DirectionsBoat />;
        default: return <Flight />;
    }
};

// Get vehicle color based on type
const getVehicleColor = ( type ) => {
    switch ( type?.toLowerCase() ) {
        case 'flight': return 'primary';
        case 'train': return 'secondary';
        case 'bus': return 'success';
        case 'cab': return 'warning';
        case 'cruise': return 'info';
        default: return 'primary';
    }
};

// Get status color
const getStatusColor = ( status ) => {
    switch ( status?.toLowerCase() ) {
        case 'confirmed': return 'success';
        case 'pending': return 'warning';
        case 'cancelled': return 'error';
        default: return 'default';
    }
};

const Bookings = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [ bookings, setBookings ] = useState( [] );
    const [ loading, setLoading ] = useState( true );
    const [ error, setError ] = useState( null );
    const [ tabValue, setTabValue ] = useState( 0 );

    // Authentication check
    useEffect( () => {
        if ( !localStorage.getItem('user') ) {
            navigate( '/login', { state: { from: '/bookings' } } );
        }
    }, [ isAuthenticated, navigate ] );

    // Fetch bookings
    useEffect( () => {
        const fetchBookings = async () => {
            try {
                setLoading( true );
                const response = await axiosInstance.get( '/booking/list' );

                if ( response.data.success ) {
                    setBookings( response.data.data );
                } else {
                    setError( response.data.message || 'Failed to fetch bookings' );
                }
            } catch ( err ) {
                console.error( 'Error fetching bookings:', err );
                setError( err.response?.data?.message || 'Something went wrong' );
            } finally {
                setLoading( false );
            }
        };

        if ( isAuthenticated ) {
            fetchBookings();
        }
    }, [ isAuthenticated ] );

    // Handle tab change
    const handleTabChange = ( event, newValue ) => {
        setTabValue( newValue );
    };

    // Filter bookings based on tab
    const filteredBookings = bookings.filter( booking => {
        if ( tabValue === 0 ) return true; // All bookings
        if ( tabValue === 1 ) return booking.status === 'confirmed';
        if ( tabValue === 2 ) return booking.status === 'pending';
        if ( tabValue === 3 ) return booking.status === 'cancelled';
        return true;
    } );

    // Function to cancel a booking
    const handleCancelBooking = async ( bookingId ) => {
        if ( !window.confirm( 'Are you sure you want to cancel this booking?' ) ) {
            return;
        }

        try {
            const response = await axiosInstance.put( `/booking/${ bookingId }/cancel` );

            if ( response.data.success ) {
                // Update the booking status in the UI
                setBookings( bookings.map( booking =>
                    booking.bookingId === bookingId
                        ? { ...booking, status: 'cancelled' }
                        : booking
                ) );
            } else {
                setError( response.data.message || 'Failed to cancel booking' );
            }
        } catch ( err ) {
            console.error( 'Error cancelling booking:', err );
            setError( err.response?.data?.message || 'Something went wrong' );
        }
    };

    // Function to download ticket/invoice
    const handleDownloadTicket = ( bookingId ) => {
        window.open( `/api/booking/${ bookingId }/ticket`, '_blank' );
    };

    if ( loading ) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                My Bookings
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    indicatorColor="primary"
                    textColor="primary"
                >
                    <Tab label="All Bookings" />
                    <Tab label="Confirmed" />
                    <Tab label="Pending" />
                    <Tab label="Cancelled" />
                </Tabs>
            </Paper>

            {filteredBookings.length === 0 ? (
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 5,
                    backgroundColor: 'background.paper',
                    borderRadius: 1,
                    boxShadow: 1
                }}>
                    <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
                        No bookings found
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => navigate( '/' )}
                    >
                        Explore and Book
                    </Button>
                </Box>
            ) : (
                filteredBookings.map( booking => (
                    <Accordion key={booking.bookingId} sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        Booking ID: {booking.bookingId.substring( 0, 8 )}...
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Booked on: {formatDateTime( booking.createDate )}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, mt: { xs: 1, sm: 0 } }}>
                                    <Chip
                                        label={booking.status}
                                        color={getStatusColor( booking.status )}
                                        size="small"
                                        sx={{ mr: 1 }}
                                    />
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        {formatPrice( booking.totalPrice )}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Divider sx={{ mb: 2 }} />

                            {/* Trip information if available */}
                            {booking.tripId && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" color="primary">
                                        Part of trip: {booking.tripName}
                                    </Typography>
                                </Box>
                            )}

                            {/* Booking items */}
                            {booking.items.map( ( item, index ) => (
                                <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        {item.itemType === 'vehicle' ? (
                                                            <>
                                                                {getVehicleIcon( item.vehicleType )}
                                                                <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 'bold' }}>
                                                                    {item.vehicleName || 'Unknown Vehicle'}
                                                                </Typography>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Hotel />
                                                                <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 'bold' }}>
                                                                    {item.accommodationName}
                                                                </Typography>
                                                            </>
                                                        )}
                                                    </Box>
                                                    <Chip
                                                        label={item.status}
                                                        color={getStatusColor( item.status )}
                                                        size="small"
                                                    />
                                                </Box>
                                            </Grid>

                                            {item.itemType === 'vehicle' ? (
                                                // Vehicle booking details
                                                <>
                                                    <Grid item xs={12} sm={6}>
                                                        <Typography variant="body2" color="textSecondary">
                                                            From
                                                        </Typography>
                                                        <Typography variant="body1">
                                                            {item.onboardingLocation}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {formatDateTime( item.onboardingTime )}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={12} sm={6}>
                                                        <Typography variant="body2" color="textSecondary">
                                                            To
                                                        </Typography>
                                                        <Typography variant="body1">
                                                            {item.deboardingLocation}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {formatDateTime( item.deboardingTime )}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={12}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                                            <Typography variant="body2">
                                                                {item.coachType} Class • {item.passengerCount} Passenger(s)
                                                            </Typography>
                                                            <Typography variant="body2" fontWeight="bold">
                                                                {formatPrice( item.price )}
                                                            </Typography>
                                                        </Box>
                                                    </Grid>
                                                </>
                                            ) : (
                                                // Accommodation booking details
                                                <>
                                                    <Grid item xs={12} sm={6}>
                                                        <Typography variant="body2" color="textSecondary">
                                                            Check-in
                                                        </Typography>
                                                        <Typography variant="body1">
                                                            {formatDate( item.checkInDate )}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={12} sm={6}>
                                                        <Typography variant="body2" color="textSecondary">
                                                            Check-out
                                                        </Typography>
                                                        <Typography variant="body1">
                                                            {formatDate( item.checkOutDate )}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={12}>
                                                        <Typography variant="body2">
                                                            {item.city}, {item.country}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                                            <Typography variant="body2">
                                                                Contact: {item.contactName}
                                                            </Typography>
                                                            <Typography variant="body2" fontWeight="bold">
                                                                {formatPrice( item.price )}
                                                            </Typography>
                                                        </Box>
                                                    </Grid>
                                                </>
                                            )}
                                        </Grid>
                                    </CardContent>
                                </Card>
                            ) )}

                            {/* Payment information */}
                            {booking.payment && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Payment Details
                                    </Typography>
                                    <Grid container spacing={1}>
                                        <Grid item xs={12} sm={4}>
                                            <Typography variant="body2" color="textSecondary">
                                                Payment Method: {booking.payment.paymentMethod || 'N/A'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Typography variant="body2" color="textSecondary">
                                                Status: {booking.payment.status}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Typography variant="body2" color="textSecondary">
                                                Paid: {booking.payment.paid ? 'Yes' : 'No'}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}

                            {/* Action buttons */}
                            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                {booking.status !== 'cancelled' && (
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<CancelOutlined />}
                                        onClick={() => handleCancelBooking( booking.bookingId )}
                                        sx={{ mr: 1 }}
                                    >
                                        Cancel
                                    </Button>
                                )}

                                <Button
                                    variant="contained"
                                    startIcon={<Receipt />}
                                    onClick={() => handleDownloadTicket( booking.bookingId )}
                                >
                                    Download Ticket
                                </Button>
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                ) )
            )}
        </Container>
    );
};

export default Bookings;