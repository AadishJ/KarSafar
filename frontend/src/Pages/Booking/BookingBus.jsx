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
    DirectionsBus,
    Person,
    Restaurant,
    EventSeat,
    CreditCard,
    CheckCircle,
    ArrowBack,
    AcUnit,
    Wifi,
    ChargingStation,
    Wc
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import axiosInstance from '../../Config/axiosInstance';
import { useAuth } from '../../Contexts/auth.context';

const BookingBus = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [ activeStep, setActiveStep ] = useState( 0 );
    const [ bus, setBus ] = useState( null );
    const [ loading, setLoading ] = useState( true );
    const [ error, setError ] = useState( null );
    const [ bookingConfirmed, setBookingConfirmed ] = useState( false );
    const [ bookingId, setBookingId ] = useState( null );

    // Selected coach from previous page
    const [ selectedCoach, setSelectedCoach ] = useState(
        location.state?.selectedCoach || null
    );

    // Passenger information
    const [ passengers, setPassengers ] = useState( [
        {
            name: user?.name || '',
            age: '',
            gender: 'male',
            foodPreference: 'none',
            seatId: ''
        }
    ] );

    // Available seats
    const [ availableSeats, setAvailableSeats ] = useState( [] );

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
        'Bus Details',
        'Passenger Information',
        'Seat Selection',
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

        // Fetch bus details
        const fetchBusDetails = async () => {
            try {
                setLoading( true );
                const response = await axiosInstance.get( `/bus/${ id }` );

                if ( response.data.success ) {
                    const busData = response.data.data;

                    // Process data - convert route to stations if needed
                    const processedData = {
                        ...busData,
                        stations: busData.route || []
                    };

                    setBus( processedData );

                    // If we don't have coach data from the previous page, use the first coach
                    if ( !selectedCoach && busData.coaches && busData.coaches.length > 0 ) {
                        setSelectedCoach( busData.coaches[ 0 ] );
                    }

                    // Fetch available seats for the selected coach
                    if ( location.state?.coachId ) {
                        fetchAvailableSeats( id, location.state.coachId );
                    }
                } else {
                    setError( 'Failed to fetch bus details' );
                }
            } catch ( err ) {
                console.error( 'Error fetching bus details:', err );
                setError( 'An error occurred while retrieving bus information' );
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
            fetchBusDetails();
            if ( user ) {
                fetchUserTrips();
            }
        }
    }, [ id, user, location.state, selectedCoach ] );

    // Fetch available seats for the selected coach
    const fetchAvailableSeats = async ( busId, coachId ) => {
        try {
            const response = await axiosInstance.get( `/bus/${ busId }/seats`, {
                params: { coachId }
            } );

            if ( response.data.success ) {
                setAvailableSeats( response.data.data );
            } else {
                console.error( 'Failed to fetch available seats' );
            }
        } catch ( error ) {
            console.error( 'Error fetching seats:', error );
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
        if ( passengers.length < 5 ) {
            setPassengers( [
                ...passengers,
                {
                    name: '',
                    age: '',
                    gender: 'male',
                    foodPreference: 'none',
                    seatId: ''
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

    // Handle seat selection for a passenger
    const handleSeatSelection = ( passengerId, seatId ) => {
        // Check if the seat is already selected by another passenger
        const isAlreadySelected = passengers.some(
            ( p, idx ) => idx !== passengerId && p.seatId === seatId
        );

        if ( isAlreadySelected ) {
            return;
        }

        const updatedPassengers = [ ...passengers ];
        updatedPassengers[ passengerId ] = {
            ...updatedPassengers[ passengerId ],
            seatId
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

    // Calculate total price
    const calculateTotalPrice = () => {
        if ( !selectedCoach ) return 0;
        return selectedCoach.price * passengers.length;
    };

    // Get the first and last stations
    const getStations = () => {
        if ( !bus || !bus.stations || bus.stations.length === 0 ) {
            return { departureStation: null, arrivalStation: null };
        }

        const stations = bus.stations;
        const departureStation = stations.find( station => station.stationOrder === 1 );
        const arrivalStation = stations.reduce(
            ( prev, current ) => ( prev.stationOrder > current.stationOrder ) ? prev : current,
            stations[ 0 ]
        );

        return { departureStation, arrivalStation };
    };

    // Move to the next step
    const handleNext = () => {
        // Validate current step
        if ( activeStep === 0 ) {
            if ( !selectedCoach ) {
                setError( 'Please select a coach class' );
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
            // Validate seat selection
            const isValid = passengers.every( passenger => passenger.seatId !== '' );

            if ( !isValid ) {
                setError( 'Please select seats for all passengers' );
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

            // Get station information
            const { departureStation, arrivalStation } = getStations();

            // Prepare booking data
            const bookingData = {
                busId: id,
                coachId: selectedCoach.coachId,
                passengers: passengers.map( passenger => ( {
                    name: passenger.name,
                    age: parseInt( passenger.age, 10 ),
                    gender: passenger.gender,
                    foodPreference: passenger.foodPreference,
                    seatId: passenger.seatId
                } ) ),
                contactInfo: {
                    name: contactInfo.name,
                    email: contactInfo.email,
                    phone: contactInfo.phone
                },
                paymentMethod,
                tripDetails: tripDetails.addToTrip ? {
                    tripId: tripDetails.selectedTripId || null,
                    createNewTrip: tripDetails.createNewTrip,
                    newTripName: tripDetails.newTripName
                } : null,
                bookingDetails: {
                    onboardingLocation: departureStation?.stationName || '',
                    deboardingLocation: arrivalStation?.stationName || '',
                    onboardingTime: departureStation?.departureTime || '',
                    deboardingTime: arrivalStation?.arrivalTime || '',
                    coachType: selectedCoach.coachType,
                    price: selectedCoach.price,
                    totalPrice: calculateTotalPrice()
                }
            };

            // Submit booking
            const response = await axiosInstance.post( `/booking/bus/${ id }`, bookingData );

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

    // Go back to bus details
    const goBack = () => {
        navigate( `/bus/${ id }` );
    };

    // Navigate to all bookings
    const viewAllBookings = () => {
        navigate( '/bookings' );
    };

    // Navigate to the specific booking
    const viewBookingDetails = () => {
        navigate( `/booking/${ bookingId }` );
    };

    if ( loading && !bus ) {
        return (
            <Container>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if ( error && !bus ) {
        return (
            <Container>
                <Button startIcon={<ArrowBack />} onClick={goBack} sx={{ mt: 3, mb: 2 }}>
                    Back to Bus Details
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

    const { departureStation, arrivalStation } = getStations();

    // Render the current step content
    const getStepContent = ( step ) => {
        switch ( step ) {
            case 0: // Bus Details
                return (
                    <Box>
                        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                            <Typography variant="h6" gutterBottom>
                                Bus Summary
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Box display="flex" alignItems="center">
                                        {bus.photo ? (
                                            <Avatar
                                                src={bus.photo}
                                                variant="rounded"
                                                sx={{ width: 60, height: 45, mr: 2 }}
                                                alt={bus.busName}
                                            />
                                        ) : (
                                            <DirectionsBus color="primary" sx={{ mr: 2, fontSize: 40 }} />
                                        )}
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                {bus.busName}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Bus ID: {bus.busId ? bus.busId.substring( 0, 8 ) : id.substring( 0, 8 )}...
                                            </Typography>
                                            <Chip
                                                size="small"
                                                label={bus.status}
                                                color={bus.status === 'active' ? 'success' : 'default'}
                                                sx={{ mt: 1 }}
                                            />
                                        </Box>
                                    </Box>
                                    {bus.drivers && bus.drivers.length > 0 && (
                                        <Typography variant="body2" sx={{ mt: 2 }}>
                                            Driver: {bus.drivers[ 0 ].driverName}
                                        </Typography>
                                    )}
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
                                                    {departureStation ? formatDateTime( departureStation.departureTime ) : ''}
                                                </Typography>
                                                <Typography variant="body2" noWrap>
                                                    {departureStation ? departureStation.stationName : ''}
                                                </Typography>
                                                {departureStation && departureStation.city && (
                                                    <Typography variant="body2" color="text.secondary" noWrap>
                                                        {departureStation.city}, {departureStation.state}
                                                    </Typography>
                                                )}
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
                                                    {arrivalStation ? formatDateTime( arrivalStation.arrivalTime ) : ''}
                                                </Typography>
                                                <Typography variant="body2" noWrap>
                                                    {arrivalStation ? arrivalStation.stationName : ''}
                                                </Typography>
                                                {arrivalStation && arrivalStation.city && (
                                                    <Typography variant="body2" color="text.secondary" noWrap>
                                                        {arrivalStation.city}, {arrivalStation.state}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="h6" gutterBottom>
                                Selected Class: {selectedCoach ? selectedCoach.coachType : 'Not Selected'}
                            </Typography>
                            <Typography variant="body1" color="primary" sx={{ fontWeight: 'bold' }}>
                                Price per passenger: {selectedCoach ? formatPrice( selectedCoach.price ) : 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Available seats: {selectedCoach ? selectedCoach.seatsAvailable : 0}
                            </Typography>

                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2">
                                    Includes:
                                </Typography>
                                <Box display="flex" gap={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                                    {selectedCoach && selectedCoach.coachType === 'Seater' && (
                                        <>
                                            <Chip size="small" icon={<EventSeat />} label="Standard Seats" />
                                            <Chip size="small" icon={<Wc />} label="Restroom" />
                                        </>
                                    )}
                                    {selectedCoach && selectedCoach.coachType === 'Sleeper' && (
                                        <>
                                            <Chip size="small" icon={<EventSeat />} label="Berth Seats" />
                                            <Chip size="small" icon={<Wc />} label="Restroom" />
                                            <Chip size="small" icon={<AcUnit />} label="AC" />
                                        </>
                                    )}
                                    {selectedCoach && selectedCoach.coachType === 'AC Sleeper' && (
                                        <>
                                            <Chip size="small" icon={<EventSeat />} label="Premium Berth" />
                                            <Chip size="small" icon={<Wc />} label="Clean Restroom" />
                                            <Chip size="small" icon={<AcUnit />} label="AC" />
                                            <Chip size="small" icon={<ChargingStation />} label="Charging Points" />
                                        </>
                                    )}
                                    {selectedCoach && selectedCoach.coachType === 'Volvo' && (
                                        <>
                                            <Chip size="small" icon={<EventSeat />} label="Recliner Seats" />
                                            <Chip size="small" icon={<Wc />} label="Clean Restroom" />
                                            <Chip size="small" icon={<AcUnit />} label="AC" />
                                            <Chip size="small" icon={<Wifi />} label="Wi-Fi" />
                                            <Chip size="small" icon={<ChargingStation />} label="Charging Points" />
                                            <Chip size="small" icon={<Restaurant />} label="Snacks" />
                                        </>
                                    )}
                                </Box>
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
                                                <InputLabel>Food Preference</InputLabel>
                                                <Select
                                                    value={passenger.foodPreference}
                                                    onChange={( e ) => handlePassengerChange( index, 'foodPreference', e.target.value )}
                                                    label="Food Preference"
                                                >
                                                    <MenuItem value="none">No Preference</MenuItem>
                                                    <MenuItem value="veg">Vegetarian</MenuItem>
                                                    <MenuItem value="non-veg">Non-Vegetarian</MenuItem>
                                                    <MenuItem value="vegan">Vegan</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                    </Grid>
                                </Box>
                            ) )}

                            {passengers.length < 5 && (
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

            case 2: // Seat Selection
                return (
                    <Box>
                        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                            <Typography variant="h6" gutterBottom>
                                Select Seats
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Please select seats for each passenger. Seats shown in blue are available.
                            </Typography>

                            {availableSeats.length === 0 ? (
                                <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 4 }}>
                                    <CircularProgress size={30} sx={{ mr: 2 }} />
                                    <Typography>Loading available seats...</Typography>
                                </Box>
                            ) : (
                                <Box>
                                    {/* Simple seat map visualization */}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                                        {availableSeats.map( ( seat ) => {
                                            // Check if seat is already selected by any passenger
                                            const selectedByPassenger = passengers.findIndex( p => p.seatId === seat.seatId );
                                            const isSelected = selectedByPassenger !== -1;

                                            return (
                                                <Chip
                                                    key={seat.seatId}
                                                    label={`${ seat.seatNumber }`}
                                                    onClick={() => {
                                                        if ( !isSelected ) {
                                                            // Find first passenger without a seat
                                                            const passengerIndex = passengers.findIndex( p => !p.seatId );
                                                            if ( passengerIndex !== -1 ) {
                                                                handleSeatSelection( passengerIndex, seat.seatId );
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

                                    {/* Passenger seat assignment */}
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2, mb: 2 }}>
                                        Passenger Seat Assignments
                                    </Typography>

                                    {passengers.map( ( passenger, index ) => {
                                        const selectedSeat = availableSeats.find( seat => seat.seatId === passenger.seatId );

                                        return (
                                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <Typography sx={{ flex: 1 }}>
                                                    {index + 1}. {passenger.name}
                                                </Typography>
                                                <FormControl sx={{ minWidth: 120 }}>
                                                    <InputLabel>Seat</InputLabel>
                                                    <Select
                                                        value={passenger.seatId}
                                                        onChange={( e ) => handleSeatSelection( index, e.target.value )}
                                                        label="Seat"
                                                    >
                                                        <MenuItem value="">
                                                            <em>Select a seat</em>
                                                        </MenuItem>
                                                        {availableSeats.map( ( seat ) => {
                                                            // Only show seats not selected by other passengers
                                                            const isTakenByOther = passengers.some(
                                                                ( p, i ) => i !== index && p.seatId === seat.seatId
                                                            );

                                                            if ( !isTakenByOther ) {
                                                                return (
                                                                    <MenuItem key={seat.seatId} value={seat.seatId}>
                                                                        Seat {seat.seatNumber}
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
                                <Typography>{selectedCoach.coachType} x {passengers.length} passenger(s)</Typography>
                                <Typography>{formatPrice( selectedCoach.price )} x {passengers.length}</Typography>
                            </Box>

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
                                Your booking has been successfully confirmed. A confirmation email has been sent to {contactInfo.email}.
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
                    Back to Bus Details
                </Button>
            )}

            <Typography variant="h4" component="h1" gutterBottom>
                {activeStep === 4 ? 'Booking Confirmation' : 'Book Your Bus Ticket'}
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
                        You are about to book {passengers.length} ticket(s) for {bus?.busName} from {departureStation?.stationName} to {arrivalStation?.stationName} for a total of {formatPrice( calculateTotalPrice() )}.
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

export default BookingBus;