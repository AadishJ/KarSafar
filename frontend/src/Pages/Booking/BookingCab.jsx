import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Paper,
    Grid2 as Grid,
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
    Avatar
} from '@mui/material';
import {
    DirectionsCar,
    Person,
    Luggage,
    AccessTime,
    CreditCard,
    CheckCircle,
    ArrowBack,
    LocationOn,
    AcUnit,
    Wifi,
    PhoneAndroid,
    ChildCare
} from '@mui/icons-material';
import { format, parseISO, addHours } from 'date-fns';
import axiosInstance from '../../Config/axiosInstance';
import { useAuth } from '../../Contexts/auth.context';

const BookingCab = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [ activeStep, setActiveStep ] = useState( 0 );
    const [ cab, setCab ] = useState( null );
    const [ loading, setLoading ] = useState( true );
    const [ error, setError ] = useState( null );
    const [ bookingConfirmed, setBookingConfirmed ] = useState( false );
    const [ bookingId, setBookingId ] = useState( null );

    // Selected coach from previous page
    const [ selectedCoach, setSelectedCoach ] = useState(
        location.state?.selectedCoach || null
    );

    // Passenger information - simplified for cab bookings
    const [ passengers, setPassengers ] = useState( [
        {
            name: user?.name || '',
            age: '',
            gender: 'male',
            luggage: 'small',
            seatId: '' // Not visibly used for cabs, but kept for API compatibility
        }
    ] );

    // Pickup and drop-off details
    const [ tripDetails, setTripDetails ] = useState( {
        pickupAddress: '',
        dropoffAddress: '',
        pickupTime: '',
        estimatedDuration: 1, // in hours
        specialRequirements: '',
        addToTrip: false,
        selectedTripId: '',
        createNewTrip: false,
        newTripName: ''
    } );

    // Contact information
    const [ contactInfo, setContactInfo ] = useState( {
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

    // User's existing trips
    const [ userTrips, setUserTrips ] = useState( [] );

    // Confirmation dialog
    const [ confirmationOpen, setConfirmationOpen ] = useState( false );

    // Steps for the booking process
    const steps = [
        'Cab Details',
        'Passenger & Trip Details',
        'Payment',
        'Confirmation'
    ];

    useEffect( () => {
        if ( !localStorage.getItem( 'user' ) ) {
            navigate( '/login' );
        }
    }, [ user, navigate ] );

    useEffect( () => {
        // If we have coach data from the previous page, use it
        if ( location.state?.selectedCoach ) {
            setSelectedCoach( location.state.selectedCoach );
        }

        // Fetch cab details
        const fetchCabDetails = async () => {
            try {
                setLoading( true );
                const response = await axiosInstance.get( `/cab/${ id }` );

                if ( response.data.success ) {
                    const cabData = response.data.data;
                    setCab( cabData );

                    // If we don't have coach data from the previous page, use the first coach
                    if ( !selectedCoach && cabData.coaches && cabData.coaches.length > 0 ) {
                        setSelectedCoach( cabData.coaches[ 0 ] );
                    }
                } else {
                    setError( 'Failed to fetch cab details' );
                }
            } catch ( err ) {
                console.error( 'Error fetching cab details:', err );
                setError( 'An error occurred while retrieving cab information' );
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
            fetchCabDetails();
            if ( user ) {
                fetchUserTrips();
            }
        }
    }, [ id, user, location.state, selectedCoach ] );

    // Format date and time
    const formatDateTime = ( dateTimeStr ) => {
        if ( !dateTimeStr ) return '';
        try {
            const date = parseISO( dateTimeStr );
            return format( date, 'MMM dd, yyyy h:mm a' );
        } catch ( e ) {
            console.error( 'Date parsing error:', e );
            return dateTimeStr;
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

    // Calculate dropoff time based on pickup time and estimated duration
    const calculateDropoffTime = () => {
        if ( !tripDetails.pickupTime ) return '';
        try {
            const pickupTime = new Date( tripDetails.pickupTime );
            const dropoffTime = addHours( pickupTime, tripDetails.estimatedDuration );
            return format( dropoffTime, "yyyy-MM-dd'T'HH:mm" );
        } catch ( e ) {
            console.error( 'Time calculation error:', e );
            return '';
        }
    };

    // Handle passenger information change
    const handlePassengerChange = ( index, field, value ) => {
        const updatedPassengers = [ ...passengers ];
        updatedPassengers[ index ] = {
            ...updatedPassengers[ index ],
            [ field ]: value
        };
        setPassengers( updatedPassengers );
    };

    // Handle contact information change
    const handleContactChange = ( field, value ) => {
        setContactInfo( {
            ...contactInfo,
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

    // Handle trip details change
    const handleTripDetailChange = ( field, value ) => {
        setTripDetails( {
            ...tripDetails,
            [ field ]: value
        } );
    };

    // Calculate total price
    const calculateTotalPrice = () => {
        if ( !selectedCoach ) return 0;
        // For cabs, price can be based on the duration or distance
        // Here we use a simple formula: base price * estimated duration
        return selectedCoach.price * tripDetails.estimatedDuration;
    };

    // Move to the next step
    const handleNext = () => {
        // Validate current step
        if ( activeStep === 0 ) {
            if ( !selectedCoach ) {
                setError( 'Please select a cab type' );
                return;
            }
        } else if ( activeStep === 1 ) {
            // Validate passenger and trip details
            if (
                !tripDetails.pickupAddress ||
                !tripDetails.dropoffAddress ||
                !tripDetails.pickupTime
            ) {
                setError( 'Please fill in all required trip details' );
                return;
            }

            // Validate passenger information
            const isValid = passengers.every( passenger =>
                passenger.name.trim() !== '' &&
                passenger.age !== '' &&
                passenger.gender !== ''
            );

            if ( !isValid ) {
                setError( 'Please fill in all passenger details' );
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

            // Calculate dropoff time
            const dropoffTime = calculateDropoffTime();

            // Prepare booking data
            const bookingData = {
                cabId: id,
                coachId: selectedCoach.coachId,
                passengers: passengers.map( passenger => ( {
                    name: passenger.name,
                    age: parseInt( passenger.age, 10 ),
                    gender: passenger.gender,
                    luggage: passenger.luggage,
                    seatId: passenger.seatId || null // May not be used for cabs
                } ) ),
                contactInfo: {
                    name: contactInfo.name,
                    email: contactInfo.email,
                    phone: contactInfo.phone
                },
                paymentMethod,
                tripDetails: {
                    tripId: tripDetails.addToTrip ? ( tripDetails.selectedTripId || null ) : null,
                    createNewTrip: tripDetails.addToTrip ? tripDetails.createNewTrip : false,
                    newTripName: tripDetails.addToTrip ? tripDetails.newTripName : '',
                    specialRequirements: tripDetails.specialRequirements
                },
                bookingDetails: {
                    onboardingLocation: tripDetails.pickupAddress,
                    deboardingLocation: tripDetails.dropoffAddress,
                    onboardingTime: tripDetails.pickupTime,
                    deboardingTime: dropoffTime,
                    coachType: selectedCoach.coachType,
                    price: selectedCoach.price,
                    totalPrice: calculateTotalPrice(),
                    duration: tripDetails.estimatedDuration
                }
            };

            // Submit booking
            const response = await axiosInstance.post( `/booking/cab/${ id }`, bookingData );

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

    // Go back to cab details
    const goBack = () => {
        navigate( `/cabs/${ id }` );
    };

    // Navigate to all bookings
    const viewAllBookings = () => {
        navigate( '/bookings' );
    };

    // Navigate to the specific booking
    const viewBookingDetails = () => {
        navigate( `/booking/${ bookingId }` );
    };

    if ( loading && !cab ) {
        return (
            <Container>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if ( error && !cab ) {
        return (
            <Container>
                <Button startIcon={<ArrowBack />} onClick={goBack} sx={{ mt: 3, mb: 2 }}>
                    Back to Cab Details
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
            case 0: // Cab Details
                return (
                    <Box>
                        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                            <Typography variant="h6" gutterBottom>
                                Cab Summary
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Box display="flex" alignItems="center">
                                        {cab.photo ? (
                                            <Avatar
                                                src={cab.photo}
                                                variant="rounded"
                                                sx={{ width: 70, height: 50, mr: 2 }}
                                                alt={cab.carModel}
                                            />
                                        ) : (
                                            <DirectionsCar color="primary" sx={{ mr: 1, fontSize: 40 }} />
                                        )}
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                {cab.carModel}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Cab ID: {cab.cabId ? cab.cabId.substring( 0, 8 ) : id.substring( 0, 8 )}...
                                            </Typography>
                                            <Chip
                                                size="small"
                                                label={cab.status}
                                                color={cab.status === 'active' ? 'success' : 'default'}
                                                sx={{ mt: 1 }}
                                            />
                                        </Box>
                                    </Box>
                                    {cab.drivers && cab.drivers.length > 0 && (
                                        <Typography variant="body2" sx={{ mt: 2 }}>
                                            Driver: {cab.drivers[ 0 ].driverName}
                                        </Typography>
                                    )}
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Select a cab type to see pricing and features
                                    </Typography>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="h6" gutterBottom>
                                Select Cab Type
                            </Typography>

                            <RadioGroup
                                value={selectedCoach ? selectedCoach.coachId : ''}
                                onChange={( e ) => {
                                    const selectedId = e.target.value;
                                    const coach = cab.coaches.find( c => c.coachId === selectedId );
                                    if ( coach ) setSelectedCoach( coach );
                                }}
                            >
                                {cab.coaches && cab.coaches.map( ( coach ) => (
                                    <Paper
                                        key={coach.coachId}
                                        elevation={1}
                                        sx={{
                                            p: 2,
                                            mb: 2,
                                            border: selectedCoach?.coachId === coach.coachId ? '2px solid #1976d2' : 'none',
                                            borderRadius: 1,
                                            '&:hover': { bgcolor: 'action.hover' }
                                        }}
                                    >
                                        <FormControlLabel
                                            value={coach.coachId}
                                            control={<Radio />}
                                            label={
                                                <Box>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                        {coach.coachType}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Capacity: {coach.seatsAvailable} passengers
                                                    </Typography>
                                                    <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                                                        {formatPrice( coach.price )}/hour
                                                    </Typography>
                                                    <Box display="flex" gap={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                                                        {coach.coachType === 'Economy' && (
                                                            <>
                                                                <Chip size="small" icon={<Luggage />} label="Small luggage" />
                                                                <Chip size="small" icon={<PhoneAndroid />} label="Phone charger" />
                                                            </>
                                                        )}
                                                        {coach.coachType === 'Premium' && (
                                                            <>
                                                                <Chip size="small" icon={<Luggage />} label="Medium luggage" />
                                                                <Chip size="small" icon={<AcUnit />} label="AC" />
                                                                <Chip size="small" icon={<PhoneAndroid />} label="Phone charger" />
                                                            </>
                                                        )}
                                                        {coach.coachType === 'Luxury' && (
                                                            <>
                                                                <Chip size="small" icon={<Luggage />} label="Large luggage" />
                                                                <Chip size="small" icon={<AcUnit />} label="Premium AC" />
                                                                <Chip size="small" icon={<Wifi />} label="Wi-Fi" />
                                                                <Chip size="small" icon={<PhoneAndroid />} label="Charging ports" />
                                                            </>
                                                        )}
                                                        {coach.coachType === 'Family Van' && (
                                                            <>
                                                                <Chip size="small" icon={<Luggage />} label="Extra large luggage" />
                                                                <Chip size="small" icon={<AcUnit />} label="AC" />
                                                                <Chip size="small" icon={<ChildCare />} label="Child seat" />
                                                                <Chip size="small" icon={<PhoneAndroid />} label="Charging ports" />
                                                            </>
                                                        )}
                                                    </Box>
                                                </Box>
                                            }
                                            sx={{ alignItems: 'flex-start', width: '100%' }}
                                        />
                                    </Paper>
                                ) )}
                            </RadioGroup>
                        </Paper>
                    </Box>
                );

            case 1: // Passenger & Trip Details
                return (
                    <Box>
                        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                            <Typography variant="h6" gutterBottom>
                                Trip Details
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Please enter your pickup and dropoff details
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Pickup Address"
                                        value={tripDetails.pickupAddress}
                                        onChange={( e ) => handleTripDetailChange( 'pickupAddress', e.target.value )}
                                        fullWidth
                                        required
                                        margin="normal"
                                        placeholder="Enter your pickup location"
                                        InputProps={{
                                            startAdornment: <LocationOn color="action" sx={{ mr: 1 }} />
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Dropoff Address"
                                        value={tripDetails.dropoffAddress}
                                        onChange={( e ) => handleTripDetailChange( 'dropoffAddress', e.target.value )}
                                        fullWidth
                                        required
                                        margin="normal"
                                        placeholder="Enter your destination"
                                        InputProps={{
                                            startAdornment: <LocationOn color="action" sx={{ mr: 1 }} />
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Pickup Date & Time"
                                        type="datetime-local"
                                        value={tripDetails.pickupTime}
                                        onChange={( e ) => handleTripDetailChange( 'pickupTime', e.target.value )}
                                        fullWidth
                                        required
                                        margin="normal"
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{
                                            min: new Date().toISOString().slice( 0, 16 )
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth margin="normal">
                                        <InputLabel>Estimated Trip Duration (hours)</InputLabel>
                                        <Select
                                            value={tripDetails.estimatedDuration}
                                            onChange={( e ) => handleTripDetailChange( 'estimatedDuration', e.target.value )}
                                            label="Estimated Trip Duration (hours)"
                                        >
                                            {[ 1, 2, 3, 4, 6, 8, 10, 12 ].map( hours => (
                                                <MenuItem key={hours} value={hours}>
                                                    {hours} {hours === 1 ? 'hour' : 'hours'}
                                                </MenuItem>
                                            ) )}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Special Requirements (Optional)"
                                        value={tripDetails.specialRequirements}
                                        onChange={( e ) => handleTripDetailChange( 'specialRequirements', e.target.value )}
                                        fullWidth
                                        multiline
                                        rows={3}
                                        margin="normal"
                                        placeholder="Any special requests or notes for the driver"
                                    />
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="h6" gutterBottom>
                                Passenger Details
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Please enter details for the main passenger
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Full Name"
                                        value={passengers[ 0 ].name}
                                        onChange={( e ) => handlePassengerChange( 0, 'name', e.target.value )}
                                        fullWidth
                                        required
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Age"
                                        type="number"
                                        value={passengers[ 0 ].age}
                                        onChange={( e ) => handlePassengerChange( 0, 'age', e.target.value )}
                                        fullWidth
                                        required
                                        margin="normal"
                                        inputProps={{ min: 0, max: 120 }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControl component="fieldset" sx={{ mt: 2 }}>
                                        <FormLabel component="legend">Gender</FormLabel>
                                        <RadioGroup
                                            row
                                            value={passengers[ 0 ].gender}
                                            onChange={( e ) => handlePassengerChange( 0, 'gender', e.target.value )}
                                        >
                                            <FormControlLabel value="male" control={<Radio />} label="Male" />
                                            <FormControlLabel value="female" control={<Radio />} label="Female" />
                                            <FormControlLabel value="other" control={<Radio />} label="Other" />
                                        </RadioGroup>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth margin="normal">
                                        <InputLabel>Luggage Size</InputLabel>
                                        <Select
                                            value={passengers[ 0 ].luggage}
                                            onChange={( e ) => handlePassengerChange( 0, 'luggage', e.target.value )}
                                            label="Luggage Size"
                                        >
                                            <MenuItem value="none">No Luggage</MenuItem>
                                            <MenuItem value="small">Small (1 bag)</MenuItem>
                                            <MenuItem value="medium">Medium (2 bags)</MenuItem>
                                            <MenuItem value="large">Large (3+ bags)</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="h6" gutterBottom>
                                Contact Information
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                We'll use this information for booking confirmation and updates
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label="Contact Name"
                                        value={contactInfo.name}
                                        onChange={( e ) => handleContactChange( 'name', e.target.value )}
                                        fullWidth
                                        required
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label="Email"
                                        type="email"
                                        value={contactInfo.email}
                                        onChange={( e ) => handleContactChange( 'email', e.target.value )}
                                        fullWidth
                                        required
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label="Phone Number"
                                        value={contactInfo.phone}
                                        onChange={( e ) => handleContactChange( 'phone', e.target.value )}
                                        fullWidth
                                        required
                                        margin="normal"
                                    />
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 3 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={tripDetails.addToTrip}
                                            onChange={( e ) => handleTripDetailChange( 'addToTrip', e.target.checked )}
                                        />
                                    }
                                    label="Add this booking to a trip (Optional)"
                                />

                                {tripDetails.addToTrip && (
                                    <Box sx={{ mt: 2, ml: 3 }}>
                                        {userTrips.length > 0 ? (
                                            <FormControl fullWidth sx={{ mb: 2 }}>
                                                <InputLabel>Select a Trip</InputLabel>
                                                <Select
                                                    value={tripDetails.selectedTripId}
                                                    onChange={( e ) => handleTripDetailChange( 'selectedTripId', e.target.value )}
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
                                                        handleTripDetailChange( 'createNewTrip', e.target.checked );
                                                        if ( e.target.checked ) {
                                                            handleTripDetailChange( 'selectedTripId', '' );
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
                                                onChange={( e ) => handleTripDetailChange( 'newTripName', e.target.value )}
                                                fullWidth
                                                margin="normal"
                                            />
                                        )}
                                    </Box>
                                )}
                            </Box>
                        </Paper>
                    </Box>
                );

            case 2: // Payment
                return (
                    <Box>
                        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                            <Typography variant="h6" gutterBottom>
                                Booking Summary
                            </Typography>

                            <Box sx={{ my: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Cab Type
                                        </Typography>
                                        <Typography variant="body1" sx={{ mb: 1 }}>
                                            {cab.carModel} ({selectedCoach.coachType})
                                        </Typography>

                                        <Typography variant="subtitle2" color="text.secondary">
                                            Pickup
                                        </Typography>
                                        <Typography variant="body1" sx={{ mb: 1 }}>
                                            {tripDetails.pickupAddress}
                                        </Typography>
                                        <Typography variant="body2">
                                            {tripDetails.pickupTime ? formatDateTime( tripDetails.pickupTime ) : ''}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Duration
                                        </Typography>
                                        <Typography variant="body1" sx={{ mb: 1 }}>
                                            {tripDetails.estimatedDuration} {tripDetails.estimatedDuration === 1 ? 'hour' : 'hours'}
                                        </Typography>

                                        <Typography variant="subtitle2" color="text.secondary">
                                            Dropoff
                                        </Typography>
                                        <Typography variant="body1" sx={{ mb: 1 }}>
                                            {tripDetails.dropoffAddress}
                                        </Typography>
                                        <Typography variant="body2">
                                            {calculateDropoffTime() ? formatDateTime( calculateDropoffTime() ) : ''}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>

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
                                <FormControlLabel
                                    value="cash"
                                    control={<Radio />}
                                    label="Cash (Pay to Driver)"
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

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography>
                                    {selectedCoach.coachType} cab for {tripDetails.estimatedDuration} {tripDetails.estimatedDuration === 1 ? 'hour' : 'hours'}
                                </Typography>
                                <Typography>
                                    {formatPrice( selectedCoach.price )} x {tripDetails.estimatedDuration}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Total Amount</Typography>
                                <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'bold' }}>
                                    {formatPrice( calculateTotalPrice() )}
                                </Typography>
                            </Box>

                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                                * Additional charges may apply for waiting time, tolls, or route changes
                            </Typography>

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
                                Your cab booking has been successfully confirmed. A confirmation email has been sent to {contactInfo.email}.
                            </Typography>

                            <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.light', color: 'white', borderRadius: 1 }}>
                                <Typography variant="h6">Booking ID: {bookingId}</Typography>
                            </Box>

                            <Box sx={{ mb: 4, p: 3, bgcolor: 'action.hover', borderRadius: 1, textAlign: 'left' }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Pickup
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {tripDetails.pickupAddress}
                                        </Typography>
                                        <Typography variant="body2" gutterBottom>
                                            {tripDetails.pickupTime ? formatDateTime( tripDetails.pickupTime ) : ''}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Dropoff
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {tripDetails.dropoffAddress}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>

                            <Typography variant="body1" sx={{ mb: 3, fontWeight: 'bold' }}>
                                The driver will contact you shortly before pickup time.
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
                    Back to Cab Details
                </Button>
            )}

            <Typography variant="h4" component="h1" gutterBottom>
                {activeStep === 3 ? 'Booking Confirmation' : 'Book Your Cab'}
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
                        disabled={loading}
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
                        You are about to book a {selectedCoach?.coachType} cab from {tripDetails.pickupAddress} to {tripDetails.dropoffAddress} for {tripDetails.estimatedDuration} {tripDetails.estimatedDuration === 1 ? 'hour' : 'hours'} at a cost of {formatPrice( calculateTotalPrice() )}.
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

export default BookingCab;