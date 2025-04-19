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
    DialogContentText
} from '@mui/material';
import {
    DirectionsBoat,
    Person,
    Restaurant,
    MeetingRoom,
    CreditCard,
    CheckCircle,
    ArrowBack,
    Pool,
    Spa,
    TheaterComedy,
    Deck,
    AirlineSeatReclineExtra
} from '@mui/icons-material';
import { format, parseISO, addDays } from 'date-fns';
import axiosInstance from '../../Config/axiosInstance';
import { useAuth } from '../../Contexts/auth.context';

const BookingCruise = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [ activeStep, setActiveStep ] = useState( 0 );
    const [ cruise, setCruise ] = useState( null );
    const [ loading, setLoading ] = useState( true );
    const [ error, setError ] = useState( null );
    const [ bookingConfirmed, setBookingConfirmed ] = useState( false );
    const [ bookingId, setBookingId ] = useState( null );

    // Selected cabin from previous page
    const [ selectedCoach, setSelectedCoach ] = useState(
        location.state?.selectedCoach || null
    );

    // Passenger information
    const [ passengers, setPassengers ] = useState( [
        {
            name: user?.name || '',
            age: '',
            gender: 'male',
            diningPreference: 'standard',
            cabinId: ''
        }
    ] );

    // Available cabins
    const [ availableCabins, setAvailableCabins ] = useState( [] );

    // Contact information
    const [ contactInfo, setContactInfo ] = useState( {
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || ''
    } );

    // Cruise add-ons
    const [ addons, setAddons ] = useState( {
        wifiPackage: false,
        specialDining: false,
        excursions: false,
        spaPackage: false,
        premiumBeverage: false
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
        'Cruise Details',
        'Passenger Information',
        'Cabin Selection',
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

        // Fetch cruise details
        const fetchCruiseDetails = async () => {
            try {
                setLoading( true );
                const response = await axiosInstance.get( `/cruise/${ id }` );

                if ( response.data.success ) {
                    const cruiseData = response.data.data;
                    setCruise( cruiseData );

                    // If we don't have coach data from the previous page, use the first coach
                    if ( !selectedCoach && cruiseData.coaches && cruiseData.coaches.length > 0 ) {
                        setSelectedCoach( cruiseData.coaches[ 0 ] );
                    }

                    // Fetch available cabins for the selected coach
                    if ( location.state?.coachId ) {
                        fetchAvailableCabins( id, location.state.coachId );
                    }
                } else {
                    setError( 'Failed to fetch cruise details' );
                }
            } catch ( err ) {
                console.error( 'Error fetching cruise details:', err );
                setError( 'An error occurred while retrieving cruise information' );
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
            fetchCruiseDetails();
            if ( user ) {
                fetchUserTrips();
            }
        }
    }, [ id, user, location.state, selectedCoach, navigate ] );

    // Fetch available cabins for the selected coach
    const fetchAvailableCabins = async ( cruiseId, coachId ) => {
        try {
            const response = await axiosInstance.get( `/cruise/${ cruiseId }/cabins`, {
                params: { coachId }
            } );

            if ( response.data.success ) {
                setAvailableCabins( response.data.data );
            } else {
                console.error( 'Failed to fetch available cabins' );
            }
        } catch ( error ) {
            console.error( 'Error fetching cabins:', error );
        }
    };

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

    // Format date only
    const formatDate = ( dateTimeStr ) => {
        if ( !dateTimeStr ) return '';
        try {
            const date = parseISO( dateTimeStr );
            return format( date, 'MMM dd, yyyy' );
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

    // Handle passenger information change
    const handlePassengerChange = ( index, field, value ) => {
        const updatedPassengers = [ ...passengers ];
        updatedPassengers[ index ] = {
            ...updatedPassengers[ index ],
            [ field ]: value
        };
        setPassengers( updatedPassengers );
    };

    // Add a new passenger
    const addPassenger = () => {
        if ( passengers.length < 4 ) { // Limit for a cabin
            setPassengers( [
                ...passengers,
                {
                    name: '',
                    age: '',
                    gender: 'male',
                    diningPreference: 'standard',
                    cabinId: ''
                }
            ] );
        }
    };

    // Remove a passenger
    const removePassenger = ( index ) => {
        if ( passengers.length > 1 ) {
            const updatedPassengers = [ ...passengers ];
            updatedPassengers.splice( index, 1 );
            setPassengers( updatedPassengers );
        }
    };

    // Handle cabin selection for a passenger
    const handleCabinSelection = ( passengerId, cabinId ) => {
        // Check if the cabin is already selected by another passenger
        const isAlreadySelected = passengers.some(
            ( p, idx ) => idx !== passengerId && p.cabinId === cabinId
        );

        if ( isAlreadySelected ) {
            return;
        }

        const updatedPassengers = [ ...passengers ];
        updatedPassengers[ passengerId ] = {
            ...updatedPassengers[ passengerId ],
            cabinId
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

    // Handle trip selection change
    const handleTripChange = ( field, value ) => {
        setTripDetails( {
            ...tripDetails,
            [ field ]: value
        } );
    };

    // Handle add-ons change
    const handleAddonChange = ( addon, value ) => {
        setAddons( {
            ...addons,
            [ addon ]: value
        } );
    };

    // Calculate additional costs from add-ons
    const calculateAddonsCost = () => {
        let total = 0;
        if ( addons.wifiPackage ) total += 1500;
        if ( addons.specialDining ) total += 3000;
        if ( addons.excursions ) total += 5000;
        if ( addons.spaPackage ) total += 4000;
        if ( addons.premiumBeverage ) total += 2500;
        return total;
    };

    // Calculate total price
    const calculateTotalPrice = () => {
        if ( !selectedCoach ) return 0;
        const basePrice = selectedCoach.price * passengers.length;
        const addonsPrice = calculateAddonsCost();
        return basePrice + addonsPrice;
    };

    // Get the cruise itinerary start and end points
    const getItineraryPoints = () => {
        if ( !cruise || !cruise.itinerary || cruise.itinerary.length === 0 ) {
            return { departurePort: null, arrivalPort: null };
        }

        const itinerary = cruise.itinerary;
        const departurePort = itinerary[ 0 ];
        const arrivalPort = itinerary[ itinerary.length - 1 ];

        return { departurePort, arrivalPort };
    };

    // Move to the next step
    const handleNext = () => {
        // Validate current step
        if ( activeStep === 0 ) {
            if ( !selectedCoach ) {
                setError( 'Please select a cabin type' );
                return;
            }
        } else if ( activeStep === 1 ) {
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
            // Validate cabin selection
            const isValid = passengers.every( passenger => passenger.cabinId !== '' );

            if ( !isValid ) {
                setError( 'Please select cabins for all passengers' );
                return;
            }
        } else if ( activeStep === 3 ) {
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
        if ( activeStep === 3 ) {
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

            // Get port information
            const { departurePort, arrivalPort } = getItineraryPoints();

            // Prepare booking data
            const bookingData = {
                cruiseId: id,
                coachId: selectedCoach.coachId,
                passengers: passengers.map( passenger => ( {
                    name: passenger.name,
                    age: parseInt( passenger.age, 10 ),
                    gender: passenger.gender,
                    diningPreference: passenger.diningPreference,
                    cabinId: passenger.cabinId
                } ) ),
                contactInfo: {
                    name: contactInfo.name,
                    email: contactInfo.email,
                    phone: contactInfo.phone
                },
                paymentMethod,
                addons: Object.keys( addons ).filter( key => addons[ key ] ),
                tripDetails: tripDetails.addToTrip ? {
                    tripId: tripDetails.selectedTripId || null,
                    createNewTrip: tripDetails.createNewTrip,
                    newTripName: tripDetails.newTripName
                } : null,
                bookingDetails: {
                    departurePort: departurePort?.port || '',
                    arrivalPort: arrivalPort?.port || '',
                    departureDate: cruise?.departureDate || '',
                    arrivalDate: cruise?.arrivalDate || '',
                    cabinType: selectedCoach.coachType,
                    basePrice: selectedCoach.price,
                    addonsPrice: calculateAddonsCost(),
                    totalPrice: calculateTotalPrice()
                }
            };

            // Submit booking
            const response = await axiosInstance.post( `/booking/cruise/${ id }`, bookingData );

            if ( response.data.success ) {
                setBookingConfirmed( true );
                setBookingId( response.data.data.bookingId );
                setActiveStep( 4 ); // Move to confirmation step
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

    // Go back to cruise details
    const goBack = () => {
        navigate( `/cruises/${ id }` );
    };

    // Navigate to all bookings
    const viewAllBookings = () => {
        navigate( '/bookings' );
    };

    // Navigate to the specific booking
    const viewBookingDetails = () => {
        navigate( `/booking/${ bookingId }` );
    };

    if ( loading && !cruise ) {
        return (
            <Container>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if ( error && !cruise ) {
        return (
            <Container>
                <Button startIcon={<ArrowBack />} onClick={goBack} sx={{ mt: 3, mb: 2 }}>
                    Back to Cruise Details
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

    const { departurePort, arrivalPort } = getItineraryPoints();

    // Render the current step content
    const getStepContent = ( step ) => {
        switch ( step ) {
            case 0: // Cruise Details
                return (
                    <Box>
                        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                            <Typography variant="h6" gutterBottom>
                                Cruise Summary
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                        {cruise.cruiseName || 'Luxury Cruise'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Cruise ID: {cruise.cruiseId ? cruise.cruiseId.substring( 0, 8 ) : id.substring( 0, 8 )}...
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label={cruise.status || 'Active'}
                                        color={( cruise.status || 'active' ) === 'active' ? 'success' : 'default'}
                                        sx={{ mt: 1 }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Box display="flex" flexDirection="column">
                                        <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            mb: 1,
                                            '& > div': {
                                                maxWidth: '50%'  // Limit width of each box
                                            }
                                        }}>
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    Departure
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                    {formatDate( cruise.departureDate )}
                                                </Typography>
                                                <Typography variant="body2" noWrap>
                                                    {departurePort ? departurePort.port : 'N/A'}
                                                </Typography>
                                            </Box>

                                            {/* Visual separator */}
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                color: 'text.secondary',
                                                px: 1
                                            }}>
                                                <Divider orientation="vertical" flexItem />
                                            </Box>

                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Arrival
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                    {formatDate( cruise.arrivalDate )}
                                                </Typography>
                                                <Typography variant="body2" noWrap>
                                                    {arrivalPort ? arrivalPort.port : 'N/A'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="h6" gutterBottom>
                                Selected Cabin: {selectedCoach ? selectedCoach.coachType : 'Not Selected'}
                            </Typography>
                            <Typography variant="body1" color="primary" sx={{ fontWeight: 'bold' }}>
                                Price per passenger: {selectedCoach ? formatPrice( selectedCoach.price ) : 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Available cabins: {selectedCoach ? selectedCoach.seatsAvailable : 0}
                            </Typography>

                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2">
                                    Includes:
                                </Typography>
                                <Box display="flex" gap={1} sx={{ mt: 1 }}>
                                    {selectedCoach && selectedCoach.coachType === 'Interior' && (
                                        <>
                                            <Chip size="small" label="Basic amenities" />
                                            <Chip size="small" label="Standard dining" />
                                        </>
                                    )}
                                    {selectedCoach && selectedCoach.coachType === 'Ocean View' && (
                                        <>
                                            <Chip size="small" label="Ocean view window" />
                                            <Chip size="small" label="Enhanced amenities" />
                                            <Chip size="small" label="Standard dining" />
                                        </>
                                    )}
                                    {selectedCoach && selectedCoach.coachType === 'Balcony' && (
                                        <>
                                            <Chip size="small" label="Private balcony" />
                                            <Chip size="small" label="Premium amenities" />
                                            <Chip size="small" label="Priority dining" />
                                            <Chip size="small" label="Complimentary Wi-Fi" />
                                        </>
                                    )}
                                    {selectedCoach && selectedCoach.coachType === 'Suite' && (
                                        <>
                                            <Chip size="small" label="Luxury suite" />
                                            <Chip size="small" label="Private balcony" />
                                            <Chip size="small" label="Butler service" />
                                            <Chip size="small" label="Premium dining" />
                                            <Chip size="small" label="Unlimited Wi-Fi" />
                                            <Chip size="small" label="Complimentary mini-bar" />
                                        </>
                                    )}
                                </Box>
                            </Box>
                        </Paper>

                        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                            <Typography variant="h6" gutterBottom>
                                Cruise Itinerary
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                                {cruise.itinerary && cruise.itinerary.map( ( stop, index ) => (
                                    <Box key={index} sx={{ display: 'flex', mb: 2, alignItems: 'flex-start' }}>
                                        <Box sx={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: '50%',
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mr: 2,
                                            mt: 0.5
                                        }}>
                                            {index + 1}
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1">{stop.port}</Typography>
                                            <Typography variant="body2">
                                                {stop.date ? formatDate( stop.date ) : 'Date not specified'}
                                            </Typography>
                                            {stop.description && (
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                    {stop.description}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                ) )}
                            </Box>
                        </Paper>
                    </Box>
                );

            case 1: // Passenger Information
                return (
                    <Box>
                        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                            <Typography variant="h6" gutterBottom>
                                Passenger Details
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Please enter details for all passengers. These should match official ID documents.
                            </Typography>

                            {passengers.map( ( passenger, index ) => (
                                <Box key={index} sx={{ mb: 4, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                    <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                            Passenger {index + 1}
                                        </Typography>
                                        {index > 0 && (
                                            <Button
                                                color="error"
                                                size="small"
                                                onClick={() => removePassenger( index )}
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </Box>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                label="Full Name"
                                                value={passenger.name}
                                                onChange={( e ) => handlePassengerChange( index, 'name', e.target.value )}
                                                fullWidth
                                                required
                                                margin="normal"
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                label="Age"
                                                type="number"
                                                value={passenger.age}
                                                onChange={( e ) => handlePassengerChange( index, 'age', e.target.value )}
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
                                                    value={passenger.gender}
                                                    onChange={( e ) => handlePassengerChange( index, 'gender', e.target.value )}
                                                >
                                                    <FormControlLabel value="male" control={<Radio />} label="Male" />
                                                    <FormControlLabel value="female" control={<Radio />} label="Female" />
                                                    <FormControlLabel value="other" control={<Radio />} label="Other" />
                                                </RadioGroup>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <FormControl fullWidth margin="normal">
                                                <InputLabel>Dining Preference</InputLabel>
                                                <Select
                                                    value={passenger.diningPreference}
                                                    onChange={( e ) => handlePassengerChange( index, 'diningPreference', e.target.value )}
                                                    label="Dining Preference"
                                                >
                                                    <MenuItem value="standard">Standard Dining</MenuItem>
                                                    <MenuItem value="vegetarian">Vegetarian</MenuItem>
                                                    <MenuItem value="vegan">Vegan</MenuItem>
                                                    <MenuItem value="gluten-free">Gluten Free</MenuItem>
                                                    <MenuItem value="early">Early Seating</MenuItem>
                                                    <MenuItem value="late">Late Seating</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                    </Grid>
                                </Box>
                            ) )}

                            {passengers.length < 4 && (
                                <Button
                                    variant="outlined"
                                    startIcon={<Person />}
                                    onClick={addPassenger}
                                    sx={{ mt: 1 }}
                                >
                                    Add Passenger
                                </Button>
                            )}

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="h6" gutterBottom>
                                Contact Information
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                We'll use this information for booking confirmation and updates.
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
                        </Paper>
                    </Box>
                );

            case 2: // Cabin Selection
                return (
                    <Box>
                        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                            <Typography variant="h6" gutterBottom>
                                Select Cabins
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Please select cabins for each passenger. Cabins shown in green are available.
                            </Typography>

                            {availableCabins.length === 0 ? (
                                <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 4 }}>
                                    <CircularProgress size={30} sx={{ mr: 2 }} />
                                    <Typography>Loading available cabins...</Typography>
                                </Box>
                            ) : (
                                <Box>
                                    {/* Simple cabin map visualization */}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                                        {availableCabins.map( ( cabin ) => {
                                            // Check if cabin is already selected by any passenger
                                            const selectedByPassenger = passengers.findIndex( p => p.cabinId === cabin.cabinId );
                                            const isSelected = selectedByPassenger !== -1;

                                            return (
                                                <Chip
                                                    key={cabin.cabinId}
                                                    label={`Cabin ${ cabin.cabinNumber } (${ cabin.deck })`}
                                                    onClick={() => {
                                                        if ( !isSelected ) {
                                                            // Find first passenger without a cabin
                                                            const passengerIndex = passengers.findIndex( p => !p.cabinId );
                                                            if ( passengerIndex !== -1 ) {
                                                                handleCabinSelection( passengerIndex, cabin.cabinId );
                                                            }
                                                        }
                                                    }}
                                                    color={isSelected ? 'primary' : 'default'}
                                                    variant={isSelected ? 'filled' : 'outlined'}
                                                    sx={{
                                                        m: 0.5,
                                                        cursor: isSelected ? 'default' : 'pointer',
                                                        '&:hover': {
                                                            backgroundColor: isSelected ? '' : '#e8f4fb'
                                                        }
                                                    }}
                                                />
                                            );
                                        } )}
                                    </Box>

                                    <Divider sx={{ my: 2 }} />

                                    {/* Passenger cabin assignment */}
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2, mb: 2 }}>
                                        Passenger Cabin Assignments
                                    </Typography>

                                    {passengers.map( ( passenger, index ) => {
                                        const selectedCabin = availableCabins.find( cabin => cabin.cabinId === passenger.cabinId );

                                        return (
                                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <Typography sx={{ flex: 1 }}>
                                                    {index + 1}. {passenger.name}
                                                </Typography>
                                                <FormControl sx={{ minWidth: 180 }}>
                                                    <InputLabel>Cabin</InputLabel>
                                                    <Select
                                                        value={passenger.cabinId}
                                                        onChange={( e ) => handleCabinSelection( index, e.target.value )}
                                                        label="Cabin"
                                                    >
                                                        <MenuItem value="">
                                                            <em>Select a cabin</em>
                                                        </MenuItem>
                                                        {availableCabins.map( ( cabin ) => {
                                                            // Only show cabins not selected by other passengers
                                                            const isTakenByOther = passengers.some(
                                                                ( p, i ) => i !== index && p.cabinId === cabin.cabinId
                                                            );

                                                            if ( !isTakenByOther ) {
                                                                return (
                                                                    <MenuItem key={cabin.cabinId} value={cabin.cabinId}>
                                                                        Cabin {cabin.cabinNumber} ({cabin.deck})
                                                                    </MenuItem>
                                                                );
                                                            }
                                                            return null;
                                                        } )}
                                                    </Select>
                                                </FormControl>
                                            </Box>
                                        );
                                    } )}
                                </Box>
                            )}
                        </Paper>

                        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                            <Typography variant="h6" gutterBottom>
                                Cruise Add-ons
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Enhance your cruise experience with these additional services.
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12} md={4}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={addons.wifiPackage}
                                                onChange={( e ) => handleAddonChange( 'wifiPackage', e.target.checked )}
                                            />
                                        }
                                        label={
                                            <Box>
                                                <Typography variant="subtitle2">Wi-Fi Package</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Stay connected throughout your cruise
                                                </Typography>
                                                <Typography variant="body2" color="primary">
                                                    + ₹1,500
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={addons.specialDining}
                                                onChange={( e ) => handleAddonChange( 'specialDining', e.target.checked )}
                                            />
                                        }
                                        label={
                                            <Box>
                                                <Typography variant="subtitle2">Specialty Dining Package</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Access to premium restaurants
                                                </Typography>
                                                <Typography variant="body2" color="primary">
                                                    + ₹3,000
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={addons.excursions}
                                                onChange={( e ) => handleAddonChange( 'excursions', e.target.checked )}
                                            />
                                        }
                                        label={
                                            <Box>
                                                <Typography variant="subtitle2">Shore Excursions Package</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Guided tours at port destinations
                                                </Typography>
                                                <Typography variant="body2" color="primary">
                                                    + ₹5,000
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={addons.spaPackage}
                                                onChange={( e ) => handleAddonChange( 'spaPackage', e.target.checked )}
                                            />
                                        }
                                        label={
                                            <Box>
                                                <Typography variant="subtitle2">Spa & Wellness Package</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Daily spa treatments and fitness classes
                                                </Typography>
                                                <Typography variant="body2" color="primary">
                                                    + ₹4,000
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={addons.premiumBeverage}
                                                onChange={( e ) => handleAddonChange( 'premiumBeverage', e.target.checked )}
                                            />
                                        }
                                        label={
                                            <Box>
                                                <Typography variant="subtitle2">Premium Beverage Package</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Unlimited premium drinks including alcohol
                                                </Typography>
                                                <Typography variant="body2" color="primary">
                                                    + ₹2,500
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Box>
                );

            case 3: // Payment
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

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography>{selectedCoach.coachType} cabin x {passengers.length} passenger(s)</Typography>
                                <Typography>{formatPrice( selectedCoach.price )} x {passengers.length}</Typography>
                            </Box>

                            {Object.keys( addons ).some( key => addons[ key ] ) && (
                                <>
                                    {addons.wifiPackage && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography>Wi-Fi Package</Typography>
                                            <Typography>+ ₹1,500</Typography>
                                        </Box>
                                    )}
                                    {addons.specialDining && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography>Specialty Dining Package</Typography>
                                            <Typography>+ ₹3,000</Typography>
                                        </Box>
                                    )}
                                    {addons.excursions && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography>Shore Excursions Package</Typography>
                                            <Typography>+ ₹5,000</Typography>
                                        </Box>
                                    )}
                                    {addons.spaPackage && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography>Spa & Wellness Package</Typography>
                                            <Typography>+ ₹4,000</Typography>
                                        </Box>
                                    )}
                                    {addons.premiumBeverage && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography>Premium Beverage Package</Typography>
                                            <Typography>+ ₹2,500</Typography>
                                        </Box>
                                    )}
                                </>
                            )}

                            <Divider sx={{ my: 1 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Total Amount</Typography>
                                <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'bold' }}>
                                    {formatPrice( calculateTotalPrice() )}
                                </Typography>
                            </Box>

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

            case 4: // Confirmation
                return (
                    <Box>
                        <Paper elevation={3} sx={{ p: 3, mb: 4, textAlign: 'center' }}>
                            <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
                            <Typography variant="h5" gutterBottom>
                                Booking Confirmed!
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 3 }}>
                                Your cruise booking has been successfully confirmed. A confirmation email has been sent to {contactInfo.email}.
                            </Typography>

                            <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.light', color: 'white', borderRadius: 1 }}>
                                <Typography variant="h6">Booking ID: {bookingId}</Typography>
                            </Box>

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
            {activeStep !== 4 && (
                <Button startIcon={<ArrowBack />} onClick={goBack} sx={{ mb: 3 }}>
                    Back to Cruise Details
                </Button>
            )}

            <Typography variant="h4" component="h1" gutterBottom>
                {activeStep === 4 ? 'Booking Confirmation' : 'Book Your Cruise'}
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

            {activeStep !== 4 && (
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
                        You are about to book a cruise for {passengers.length} passenger(s) on {cruise?.cruiseName || 'Luxury Cruise'} from {departurePort?.port || 'Port of Departure'} to {arrivalPort?.port || 'Port of Arrival'} for a total of {formatPrice( calculateTotalPrice() )}.
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

export default BookingCruise;