import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Paper,
    Grid,
    Button,
    TextField,
    FormControl,
    FormLabel,
    RadioGroup,
    Radio,
    FormControlLabel,
    Stepper,
    Step,
    StepLabel,
    Divider,
    CircularProgress,
    Alert,
    Select,
    MenuItem,
    InputLabel,
    Chip,
    Card,
    CardContent,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    DialogContentText,
    IconButton,
    Avatar,
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    House,
    Person,
    Restaurant,
    CheckCircle,
    ArrowBack,
    Event,
    Add,
    Remove,
    LocationOn,
    WifiOutlined,
    Pool,
    LocalParking,
    Pets,
    CreditCard,
    Kitchen,
    Weekend,
    AcUnit,
    Bathtub,
    ChevronRight
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format, parseISO, differenceInDays } from 'date-fns';
import axiosInstance from '../../Config/axiosInstance';
import { useAuth } from '../../Contexts/auth.context';

const BookingAirbnb = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [ activeStep, setActiveStep ] = useState( 0 );
    const [ property, setProperty ] = useState( null );
    const [ loading, setLoading ] = useState( true );
    const [ error, setError ] = useState( null );
    const [ bookingConfirmed, setBookingConfirmed ] = useState( false );
    const [ bookingId, setBookingId ] = useState( null );

    // Booking details
    const [ bookingDetails, setBookingDetails ] = useState( {
        checkInDate: location.state?.checkInDate || new Date(),
        checkOutDate: location.state?.checkOutDate || new Date( Date.now() + 86400000 ), // Tomorrow
        guestsCount: location.state?.guests || 1,
        specialRequests: ''
    } );

    // Property availability
    const [ isAvailable, setIsAvailable ] = useState( true );
    const [ priceDetails, setPriceDetails ] = useState( {
        basePrice: 0,
        cleaningFee: 500,
        serviceFee: 0
    } );

    // Guest information
    const [ guestInfo, setGuestInfo ] = useState( {
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || ''
    } );

    // Payment information
    const [ paymentMethod, setPaymentMethod ] = useState( 'credit_card' );
    const [ paymentInfo, setPaymentInfo ] = useState( {
        cardNumber: '',
        cardName: '',
        expiry: '',
        cvv: ''
    } );

    // Terms acceptance
    const [ termsAccepted, setTermsAccepted ] = useState( false );

    // Trip information
    const [ tripDetails, setTripDetails ] = useState( {
        addToTrip: false,
        selectedTripId: '',
        createNewTrip: false,
        newTripName: ''
    } );

    // User's existing trips
    const [ userTrips, setUserTrips ] = useState( [] );

    // Confirmation dialog
    const [ confirmationOpen, setConfirmationOpen ] = useState( false );

    // Steps for the booking process
    const steps = [
        'Property Details',
        'Guest Information',
        'Payment',
        'Confirmation'
    ];

    useEffect( () => {
        if ( !localStorage.getItem( 'user' ) ) {
            navigate( '/login' );
        }
    }, [ user ] );

    useEffect( () => {
        // Fetch airbnb details
        const fetchPropertyDetails = async () => {
            try {
                setLoading( true );
                const response = await axiosInstance.get( `/airbnb/${ id }` );

                if ( response.data.success ) {
                    const propertyData = response.data.data;
                    setProperty( propertyData );

                    // Set base price from property data
                    if ( propertyData.rooms && propertyData.rooms.length > 0 ) {
                        const basePriceValue = Math.min( ...propertyData.rooms.map( room => room.price ) );
                        setPriceDetails( prev => ( {
                            ...prev,
                            basePrice: basePriceValue,
                            serviceFee: Math.round( basePriceValue * 0.12 ) // 12% service fee
                        } ) );
                    }

                    // Check availability
                    checkAvailability();
                } else {
                    setError( 'Failed to fetch property details' );
                }
            } catch ( err ) {
                console.error( 'Error fetching property details:', err );
                setError( 'An error occurred while retrieving property information' );
            } finally {
                setLoading( false );
            }
        };

        // Fetch user's trips for the trip selection dropdown
        const fetchUserTrips = async () => {
            try {
                const response = await axiosInstance.get( '/trips' );
                if ( response.data.success ) {
                    setUserTrips( response.data.data );
                }
            } catch ( error ) {
                console.error( 'Error fetching user trips:', error );
            }
        };

        if ( id ) {
            fetchPropertyDetails();
            if ( user ) {
                fetchUserTrips();
            }
        }
    }, [ id, user, location.state ] );

    // Check property availability for the selected dates
    const checkAvailability = async () => {
        try {
            const { checkInDate, checkOutDate, guestsCount } = bookingDetails;

            const formattedCheckIn = format( new Date( checkInDate ), 'yyyy-MM-dd' );
            const formattedCheckOut = format( new Date( checkOutDate ), 'yyyy-MM-dd' );

            const response = await axiosInstance.get( `/airbnb/${ id }/availability`, {
                params: {
                    checkInDate: formattedCheckIn,
                    checkOutDate: formattedCheckOut,
                    guests: guestsCount
                }
            } );

            if ( response.data.success ) {
                setIsAvailable( response.data.data.isAvailable );

                // Update pricing if available in response
                if ( response.data.data.pricing ) {
                    setPriceDetails( prev => ( {
                        ...prev,
                        basePrice: response.data.data.pricing.basePrice,
                        serviceFee: Math.round( response.data.data.pricing.basePrice * 0.12 )
                    } ) );
                }
            } else {
                setError( 'Failed to check property availability' );
            }
        } catch ( error ) {
            console.error( 'Error checking availability:', error );
            setError( 'An error occurred while checking property availability' );
        }
    };

    // Format date
    const formatDate = ( dateStr ) => {
        if ( !dateStr ) return '';
        try {
            const date = typeof dateStr === 'string' ? parseISO( dateStr ) : dateStr;
            return format( date, 'MMM dd, yyyy' );
        } catch ( e ) {
            console.error( 'Date parsing error:', e );
            return dateStr;
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

    // Calculate number of nights
    const calculateNights = () => {
        const { checkInDate, checkOutDate } = bookingDetails;
        return differenceInDays( new Date( checkOutDate ), new Date( checkInDate ) );
    };

    // Handle booking details change
    const handleBookingChange = ( field, value ) => {
        setBookingDetails( {
            ...bookingDetails,
            [ field ]: value
        } );

        // If check-in, check-out date, or guest count changes, recheck availability
        if ( field === 'checkInDate' || field === 'checkOutDate' || field === 'guestsCount' ) {
            checkAvailability();
        }
    };

    // Handle guest information change
    const handleGuestInfoChange = ( field, value ) => {
        setGuestInfo( {
            ...guestInfo,
            [ field ]: value
        } );
    };

    // Handle payment information change
    const handlePaymentChange = ( field, value ) => {
        setPaymentInfo( {
            ...paymentInfo,
            [ field ]: value
        } );
    };

    // Handle trip selection change
    const handleTripChange = ( field, value ) => {
        setTripDetails( {
            ...tripDetails,
            [ field ]: value
        } );
    };

    // Calculate total price
    const calculateTotalPrice = () => {
        const nights = calculateNights();
        const nightlyTotal = priceDetails.basePrice * nights;
        return nightlyTotal + priceDetails.cleaningFee + priceDetails.serviceFee;
    };

    // Get amenity icon based on amenity type
    const getAmenityIcon = ( amenity ) => {
        const amenityLower = amenity.toLowerCase();
        if ( amenityLower.includes( 'wifi' ) ) return <WifiOutlined fontSize="small" />;
        if ( amenityLower.includes( 'pool' ) ) return <Pool fontSize="small" />;
        if ( amenityLower.includes( 'parking' ) ) return <LocalParking fontSize="small" />;
        if ( amenityLower.includes( 'pet' ) ) return <Pets fontSize="small" />;
        if ( amenityLower.includes( 'kitchen' ) ) return <Kitchen fontSize="small" />;
        if ( amenityLower.includes( 'living' ) ) return <Weekend fontSize="small" />;
        if ( amenityLower.includes( 'air' ) || amenityLower.includes( 'ac' ) ) return <AcUnit fontSize="small" />;
        if ( amenityLower.includes( 'bath' ) ) return <Bathtub fontSize="small" />;
        return <ChevronRight fontSize="small" />;
    };

    // Move to the next step
    const handleNext = () => {
        // Validate current step
        if ( activeStep === 0 ) {
            if ( !property ) {
                setError( 'Property information not available' );
                return;
            }

            // Validate dates
            const { checkInDate, checkOutDate, guestsCount } = bookingDetails;
            if ( new Date( checkInDate ) >= new Date( checkOutDate ) ) {
                setError( 'Check-out date must be after check-in date' );
                return;
            }

            // Ensure check-in date is not in the past
            if ( new Date( checkInDate ) < new Date( new Date().setHours( 0, 0, 0, 0 ) ) ) {
                setError( 'Check-in date cannot be in the past' );
                return;
            }

            // Validate against property max guest limit
            if ( guestsCount > property.maxGuests ) {
                setError( `This property can only accommodate up to ${ property.maxGuests } guests` );
                return;
            }

            // Check availability
            if ( !isAvailable ) {
                setError( 'This property is not available for the selected dates' );
                return;
            }
        } else if ( activeStep === 1 ) {
            // Validate guest information
            if ( !guestInfo.name || !guestInfo.email || !guestInfo.phone ) {
                setError( 'Please fill in all guest information fields' );
                return;
            }

            // Simple email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if ( !emailRegex.test( guestInfo.email ) ) {
                setError( 'Please enter a valid email address' );
                return;
            }
        } else if ( activeStep === 2 ) {
            // Validate payment information and terms acceptance
            if ( !termsAccepted ) {
                setError( 'Please accept the terms and conditions' );
                return;
            }

            if ( paymentMethod === 'credit_card' ) {
                if (
                    paymentInfo.cardNumber.trim() === '' ||
                    paymentInfo.cardName.trim() === '' ||
                    paymentInfo.expiry.trim() === '' ||
                    paymentInfo.cvv.trim() === ''
                ) {
                    setError( 'Please fill in all payment details' );
                    return;
                }
            }
        }

        setError( null );
        setActiveStep( ( prevActiveStep ) => prevActiveStep + 1 );

        // If moving to confirmation step, open the confirmation dialog
        if ( activeStep === 2 ) {
            setConfirmationOpen( true );
        }
    };

    // Move to the previous step
    const handleBack = () => {
        setActiveStep( ( prevActiveStep ) => prevActiveStep - 1 );
    };

    // Handle booking submission
    const handleBookingSubmit = async () => {
        setConfirmationOpen( false );

        try {
            setLoading( true );

            // Format dates for backend
            const formattedCheckIn = format( new Date( bookingDetails.checkInDate ), 'yyyy-MM-dd' );
            const formattedCheckOut = format( new Date( bookingDetails.checkOutDate ), 'yyyy-MM-dd' );

            // Get the room ID (for Airbnb, typically there's just one "Entire Space" room)
            const roomId = property.rooms && property.rooms.length > 0 ? property.rooms[ 0 ].roomId : null;

            if ( !roomId ) {
                throw new Error( 'No room information found for this property' );
            }

            // Prepare booking data
            const bookingData = {
                airbnbId: id,
                roomId: roomId,
                checkInDate: formattedCheckIn,
                checkOutDate: formattedCheckOut,
                numberOfGuests: bookingDetails.guestsCount,
                guestInfo: {
                    name: guestInfo.name,
                    email: guestInfo.email,
                    phone: guestInfo.phone
                },
                specialRequests: bookingDetails.specialRequests,
                paymentMethod,
                tripDetails: tripDetails.addToTrip ? {
                    tripId: tripDetails.selectedTripId || null,
                    createNewTrip: tripDetails.createNewTrip,
                    newTripName: tripDetails.newTripName
                } : null,
                bookingDetails: {
                    propertyName: property.propertyName,
                    price: {
                        basePrice: priceDetails.basePrice,
                        cleaningFee: priceDetails.cleaningFee,
                        serviceFee: priceDetails.serviceFee,
                        totalPrice: calculateTotalPrice()
                    },
                    nights: calculateNights()
                }
            };

            // Submit booking
            const response = await axiosInstance.post( `/booking/airbnb/${ id }`, bookingData );

            if ( response.data.success ) {
                setBookingConfirmed( true );
                setBookingId( response.data.data.bookingId );
                setActiveStep( 3 ); // Move to confirmation step
            } else {
                setError( response.data.message || 'Failed to create booking' );
            }
        } catch ( err ) {
            console.error( 'Error creating booking:', err );
            setError( 'An error occurred while creating your booking' );
        } finally {
            setLoading( false );
        }
    };

    // Go back to property details
    const goBack = () => {
        navigate( `/airbnbs/${ id }` );
    };

    // Navigate to all bookings
    const viewAllBookings = () => {
        navigate( '/bookings' );
    };

    // Navigate to the specific booking
    const viewBookingDetails = () => {
        navigate( `/booking/${ bookingId }` );
    };

    if ( loading && !property ) {
        return (
            <Container>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if ( error && !property ) {
        return (
            <Container>
                <Button startIcon={<ArrowBack />} onClick={goBack} sx={{ mt: 3, mb: 2 }}>
                    Back to Property Details
                </Button>
                <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="error" variant="h6">
                        {error}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        Unable to proceed with booking. Please try again later.
                    </Typography>
                </Paper>
            </Container>
        );
    }

    // Render the current step content
    const getStepContent = ( step ) => {
        switch ( step ) {
            case 0: // Property Details
                return (
                    <Box>
                        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                            <Typography variant="h6" gutterBottom>
                                Property Summary
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Box
                                        component="img"
                                        src={property.photos && property.photos.length > 0 ? property.photos[ 0 ] : 'https://via.placeholder.com/400x300?text=No+Image'}
                                        alt={property.propertyName}
                                        sx={{
                                            width: '100%',
                                            height: 200,
                                            objectFit: 'cover',
                                            borderRadius: 1,
                                            mb: 2
                                        }}
                                    />
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                        {property.propertyName}
                                    </Typography>
                                    <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
                                        <LocationOn fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {property.address.street}, {property.address.city}, {property.address.country}
                                        </Typography>
                                    </Box>
                                    {property.host && (
                                        <Box display="flex" alignItems="center" sx={{ mt: 2 }}>
                                            <Avatar
                                                src={property.host.hostProfilePic || ''}
                                                alt={property.host.hostName}
                                                sx={{ width: 32, height: 32, mr: 1 }}
                                            />
                                            <Typography variant="body2">
                                                Hosted by {property.host.hostName}
                                            </Typography>
                                        </Box>
                                    )}
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Select your stay dates:
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                                    <DatePicker
                                                        label="Check-in Date"
                                                        value={bookingDetails.checkInDate}
                                                        onChange={( date ) => handleBookingChange( 'checkInDate', date )}
                                                        renderInput={( params ) => <TextField {...params} fullWidth />}
                                                        disablePast
                                                    />
                                                </LocalizationProvider>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                                    <DatePicker
                                                        label="Check-out Date"
                                                        value={bookingDetails.checkOutDate}
                                                        onChange={( date ) => handleBookingChange( 'checkOutDate', date )}
                                                        renderInput={( params ) => <TextField {...params} fullWidth />}
                                                        minDate={new Date( new Date( bookingDetails.checkInDate ).getTime() + 86400000 )}
                                                    />
                                                </LocalizationProvider>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                    <Box sx={{ bgcolor: 'primary.light', p: 2, borderRadius: 1, color: 'white' }}>
                                        <Typography variant="subtitle1">
                                            {calculateNights()} Night{calculateNights() !== 1 ? 's' : ''}
                                        </Typography>
                                        <Typography variant="body2">
                                            {formatDate( bookingDetails.checkInDate )} to {formatDate( bookingDetails.checkOutDate )}
                                        </Typography>
                                    </Box>

                                    {!isAvailable && (
                                        <Alert severity="warning" sx={{ mt: 2 }}>
                                            This property is not available for the selected dates.
                                        </Alert>
                                    )}

                                    <Box sx={{ mt: 3 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Number of guests:
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    if ( bookingDetails.guestsCount > 1 ) {
                                                        handleBookingChange( 'guestsCount', bookingDetails.guestsCount - 1 );
                                                    }
                                                }}
                                                disabled={bookingDetails.guestsCount <= 1}
                                            >
                                                <Remove fontSize="small" />
                                            </IconButton>
                                            <Typography sx={{ mx: 2 }}>
                                                {bookingDetails.guestsCount} {bookingDetails.guestsCount === 1 ? 'Guest' : 'Guests'}
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    if ( bookingDetails.guestsCount < property.maxGuests ) {
                                                        handleBookingChange( 'guestsCount', bookingDetails.guestsCount + 1 );
                                                    }
                                                }}
                                                disabled={bookingDetails.guestsCount >= property.maxGuests}
                                            >
                                                <Add fontSize="small" />
                                            </IconButton>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                            Max {property.maxGuests} guests allowed
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="h6" gutterBottom>
                                Property Details
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                {property.description}
                            </Typography>

                            <Typography variant="subtitle1" gutterBottom>
                                Amenities
                            </Typography>
                            <Grid container spacing={1}>
                                {property.amenities && property.amenities.map( ( amenity, index ) => (
                                    <Grid item xs={12} sm={6} md={4} key={index}>
                                        <Box display="flex" alignItems="center">
                                            {getAmenityIcon( amenity )}
                                            <Typography variant="body2" sx={{ ml: 1 }}>
                                                {amenity}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                ) )}
                            </Grid>

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="h6" gutterBottom>
                                Price Details
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography>
                                    {formatPrice( priceDetails.basePrice )} x {calculateNights()} nights
                                </Typography>
                                <Typography>
                                    {formatPrice( priceDetails.basePrice * calculateNights() )}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography>
                                    Cleaning fee
                                </Typography>
                                <Typography>
                                    {formatPrice( priceDetails.cleaningFee )}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography>
                                    Service fee
                                </Typography>
                                <Typography>
                                    {formatPrice( priceDetails.serviceFee )}
                                </Typography>
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                <Typography variant="subtitle1">
                                    Total
                                </Typography>
                                <Typography variant="subtitle1" color="primary">
                                    {formatPrice( calculateTotalPrice() )}
                                </Typography>
                            </Box>
                        </Paper>
                    </Box>
                );

            case 1: // Guest Information
                return (
                    <Box>
                        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                            <Typography variant="h6" gutterBottom>
                                Guest Details
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Please enter the details of the primary guest. This information will be used for check-in.
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Full Name"
                                        value={guestInfo.name}
                                        onChange={( e ) => handleGuestInfoChange( 'name', e.target.value )}
                                        fullWidth
                                        required
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Email"
                                        type="email"
                                        value={guestInfo.email}
                                        onChange={( e ) => handleGuestInfoChange( 'email', e.target.value )}
                                        fullWidth
                                        required
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Phone Number"
                                        value={guestInfo.phone}
                                        onChange={( e ) => handleGuestInfoChange( 'phone', e.target.value )}
                                        fullWidth
                                        required
                                        margin="normal"
                                    />
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Special Requests or Questions for Host (Optional):
                                </Typography>
                                <TextField
                                    multiline
                                    rows={3}
                                    fullWidth
                                    placeholder="E.g., Check-in time requests, questions about nearby attractions, etc."
                                    value={bookingDetails.specialRequests}
                                    onChange={( e ) => handleBookingChange( 'specialRequests', e.target.value )}
                                />
                            </Box>

                            <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    Booking Summary
                                </Typography>
                                <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                Check-in
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                {formatDate( bookingDetails.checkInDate )}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                After 3:00 PM
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                Check-out
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                {formatDate( bookingDetails.checkOutDate )}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Before 11:00 AM
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Divider sx={{ my: 1 }} />
                                            <Typography variant="body2" color="text.secondary">
                                                Property
                                            </Typography>
                                            <Typography variant="body1">
                                                {property.propertyName}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary">
                                                Guests
                                            </Typography>
                                            <Typography variant="body1">
                                                {bookingDetails.guestsCount} {bookingDetails.guestsCount === 1 ? 'Guest' : 'Guests'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary">
                                                Duration
                                            </Typography>
                                            <Typography variant="body1">
                                                {calculateNights()} {calculateNights() === 1 ? 'Night' : 'Nights'}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
                );

            case 2: // Payment
                return (
                    <Box>
                        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                            <Typography variant="h6" gutterBottom>
                                Trip Details (Optional)
                            </Typography>

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={tripDetails.addToTrip}
                                        onChange={( e ) => handleTripChange( 'addToTrip', e.target.checked )}
                                    />
                                }
                                label="Add this booking to a trip"
                            />

                            {tripDetails.addToTrip && (
                                <Box sx={{ mt: 2 }}>
                                    {userTrips.length > 0 ? (
                                        <FormControl fullWidth sx={{ mb: 2 }}>
                                            <InputLabel>Select a Trip</InputLabel>
                                            <Select
                                                value={tripDetails.selectedTripId}
                                                onChange={( e ) => handleTripChange( 'selectedTripId', e.target.value )}
                                                label="Select a Trip"
                                                disabled={tripDetails.createNewTrip}
                                            >
                                                <MenuItem value="">
                                                    <em>Select a trip</em>
                                                </MenuItem>
                                                {userTrips.map( ( trip ) => (
                                                    <MenuItem key={trip.tripId} value={trip.tripId}>
                                                        {trip.name} ({format( new Date( trip.startDate ), 'MMM dd, yyyy' )})
                                                    </MenuItem>
                                                ) )}
                                            </Select>
                                        </FormControl>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            You don't have any existing trips. Create a new one below.
                                        </Typography>
                                    )}

                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={tripDetails.createNewTrip}
                                                onChange={( e ) => {
                                                    handleTripChange( 'createNewTrip', e.target.checked );
                                                    if ( e.target.checked ) {
                                                        handleTripChange( 'selectedTripId', '' );
                                                    }
                                                }}
                                            />
                                        }
                                        label="Create a new trip"
                                    />

                                    {tripDetails.createNewTrip && (
                                        <TextField
                                            label="Trip Name"
                                            value={tripDetails.newTripName}
                                            onChange={( e ) => handleTripChange( 'newTripName', e.target.value )}
                                            fullWidth
                                            margin="normal"
                                        />
                                    )}
                                </Box>
                            )}

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="h6" gutterBottom>
                                Payment Method
                            </Typography>

                            <RadioGroup
                                value={paymentMethod}
                                onChange={( e ) => setPaymentMethod( e.target.value )}
                            >
                                <FormControlLabel
                                    value="credit_card"
                                    control={<Radio />}
                                    label="Credit/Debit Card"
                                />
                                <FormControlLabel
                                    value="net_banking"
                                    control={<Radio />}
                                    label="Net Banking (Pay at Checkout)"
                                />
                                <FormControlLabel
                                    value="upi"
                                    control={<Radio />}
                                    label="UPI (Pay at Checkout)"
                                />
                            </RadioGroup>

                            {paymentMethod === 'credit_card' && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Enter your card details below. Your information is secure.
                                    </Typography>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <TextField
                                                label="Card Number"
                                                value={paymentInfo.cardNumber}
                                                onChange={( e ) => handlePaymentChange( 'cardNumber', e.target.value )}
                                                fullWidth
                                                required
                                                margin="normal"
                                                placeholder="1234 5678 9012 3456"
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                label="Cardholder Name"
                                                value={paymentInfo.cardName}
                                                onChange={( e ) => handlePaymentChange( 'cardName', e.target.value )}
                                                fullWidth
                                                required
                                                margin="normal"
                                            />
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <TextField
                                                label="Expiry (MM/YY)"
                                                value={paymentInfo.expiry}
                                                onChange={( e ) => handlePaymentChange( 'expiry', e.target.value )}
                                                fullWidth
                                                required
                                                margin="normal"
                                                placeholder="MM/YY"
                                            />
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <TextField
                                                label="CVV"
                                                value={paymentInfo.cvv}
                                                onChange={( e ) => handlePaymentChange( 'cvv', e.target.value )}
                                                fullWidth
                                                required
                                                margin="normal"
                                                type="password"
                                                inputProps={{ maxLength: 3 }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="h6" gutterBottom>
                                Price Details
                            </Typography>

                            <List disablePadding>
                                <ListItem disablePadding sx={{ py: 1 }}>
                                    <ListItemText
                                        primary={`${ formatPrice( priceDetails.basePrice ) } x ${ calculateNights() } nights`}
                                    />
                                    <Typography>
                                        {formatPrice( priceDetails.basePrice * calculateNights() )}
                                    </Typography>
                                </ListItem>
                                <ListItem disablePadding sx={{ py: 1 }}>
                                    <ListItemText primary="Cleaning fee" />
                                    <Typography>
                                        {formatPrice( priceDetails.cleaningFee )}
                                    </Typography>
                                </ListItem>
                                <ListItem disablePadding sx={{ py: 1 }}>
                                    <ListItemText primary="Service fee" />
                                    <Typography>
                                        {formatPrice( priceDetails.serviceFee )}
                                    </Typography>
                                </ListItem>
                                <Divider sx={{ my: 1 }} />
                                <ListItem disablePadding sx={{ py: 1 }}>
                                    <ListItemText
                                        primary="Total"
                                        primaryTypographyProps={{ fontWeight: 'bold' }}
                                    />
                                    <Typography color="primary" sx={{ fontWeight: 'bold' }}>
                                        {formatPrice( calculateTotalPrice() )}
                                    </Typography>
                                </ListItem>
                            </List>

                            <Divider sx={{ my: 3 }} />

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={termsAccepted}
                                        onChange={( e ) => setTermsAccepted( e.target.checked )}
                                        required
                                    />
                                }
                                label="I accept the terms and conditions, including the cancellation policy"
                            />
                        </Paper>
                    </Box>
                );

            case 3: // Confirmation
                return (
                    <Box>
                        <Paper elevation={3} sx={{ p: 3, mb: 4, textAlign: 'center' }}>
                            <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
                            <Typography variant="h5" gutterBottom>
                                Booking Confirmed!
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 3 }}>
                                Your stay at {property.propertyName} has been successfully confirmed. A confirmation email has been sent to {guestInfo.email}.
                            </Typography>

                            <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.light', color: 'white', borderRadius: 1 }}>
                                <Typography variant="h6">Booking ID: {bookingId}</Typography>
                            </Box>

                            <Typography variant="body2" sx={{ mb: 3 }}>
                                The host will be notified of your booking and will be in touch if needed. Your check-in details will be provided closer to your arrival date.
                            </Typography>

                            <Box sx={{ mt: 3 }}>
                                <Button
                                    variant="contained"
                                    onClick={viewBookingDetails}
                                    sx={{ mr: 2 }}
                                >
                                    View Booking Details
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={viewAllBookings}
                                >
                                    View All Bookings
                                </Button>
                            </Box>
                        </Paper>
                    </Box>
                );

            default:
                return 'Unknown step';
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {activeStep !== 3 && (
                <Button startIcon={<ArrowBack />} onClick={goBack} sx={{ mb: 3 }}>
                    Back to Property Details
                </Button>
            )}

            <Typography variant="h4" component="h1" gutterBottom>
                {activeStep === 3 ? 'Booking Confirmation' : 'Book Your Stay'}
            </Typography>

            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map( ( label ) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ) )}
            </Stepper>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {getStepContent( activeStep )}

            {activeStep !== 3 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button
                        disabled={activeStep === 0}
                        onClick={handleBack}
                    >
                        Back
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={loading || !isAvailable}
                    >
                        {activeStep === steps.length - 2 ? 'Confirm Booking' : 'Next'}
                        {loading && <CircularProgress size={24} sx={{ ml: 1 }} />}
                    </Button>
                </Box>
            )}

            {/* Confirmation Dialog */}
            <Dialog
                open={confirmationOpen}
                onClose={() => setConfirmationOpen( false )}
            >
                <DialogTitle>Confirm Your Booking</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        You are about to book {property?.propertyName} for {calculateNights()} {calculateNights() === 1 ? 'night' : 'nights'} from {formatDate( bookingDetails.checkInDate )} to {formatDate( bookingDetails.checkOutDate )} for {bookingDetails.guestsCount} {bookingDetails.guestsCount === 1 ? 'guest' : 'guests'} for a total of {formatPrice( calculateTotalPrice() )}.
                    </DialogContentText>
                    <DialogContentText sx={{ mt: 2 }}>
                        Do you want to proceed with this booking?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmationOpen( false )}>Cancel</Button>
                    <Button onClick={handleBookingSubmit} variant="contained" autoFocus>
                        Confirm Booking
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default BookingAirbnb;