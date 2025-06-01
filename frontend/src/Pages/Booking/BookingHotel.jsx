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
    InputAdornment
} from '@mui/material';
import {
    Hotel,
    Person,
    Restaurant,
    ConfirmationNumber,
    CreditCard,
    CheckCircle,
    ArrowBack,
    Event,
    KingBed,
    Add,
    Remove,
    LocationOn,
    WifiOutlined,
    AcUnit,
    LocalDining
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format, parseISO, differenceInDays } from 'date-fns';
import axiosInstance from '../../Config/axiosInstance';
import { useAuth } from '../../Contexts/auth.context';

const BookingHotel = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [ activeStep, setActiveStep ] = useState( 0 );
    const [ hotel, setHotel ] = useState( null );
    const [ loading, setLoading ] = useState( true );
    const [ error, setError ] = useState( null );
    const [ bookingConfirmed, setBookingConfirmed ] = useState( false );
    const [ bookingId, setBookingId ] = useState( null );

    // Booking details
    const [ bookingDetails, setBookingDetails ] = useState( {
        checkInDate: location.state?.checkInDate || new Date(),
        checkOutDate: location.state?.checkOutDate || new Date( Date.now() + 86400000 ), // Tomorrow
        roomId: location.state?.roomId || '',
        roomType: '',
        roomsCount: 1,
        guestsCount: location.state?.guests || 1,
        specialRequests: ''
    } );

    // Selected room from previous page
    const [ selectedRoom, setSelectedRoom ] = useState(
        location.state?.selectedRoom || null
    );

    // Available rooms
    const [ availableRooms, setAvailableRooms ] = useState( [] );

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
        'Hotel Details',
        'Room Selection',
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
        // Fetch hotel details
        const fetchHotelDetails = async () => {
            try {
                setLoading( true );
                const response = await axiosInstance.get( `/hotel/${ id }` );

                if ( response.data.success ) {
                    const hotelData = response.data.data;
                    setHotel( hotelData );

                    // If we have room data from the previous page, use it
                    if ( location.state?.roomId ) {
                        const room = hotelData.rooms.find( r => r.roomId === location.state.roomId );
                        if ( room ) {
                            setSelectedRoom( room );
                            setBookingDetails( prev => ( {
                                ...prev,
                                roomType: room.roomType
                            } ) );
                        }
                    }

                    // Fetch available rooms
                    fetchAvailableRooms();
                } else {
                    setError( 'Failed to fetch hotel details' );
                }
            } catch ( err ) {
                console.error( 'Error fetching hotel details:', err );
                setError( 'An error occurred while retrieving hotel information' );
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
            fetchHotelDetails();
            if ( user ) {
                fetchUserTrips();
            }
        }
    }, [ id, user, location.state ] );

    // Fetch available rooms for the selected dates
    const fetchAvailableRooms = async () => {
        try {
            const { checkInDate, checkOutDate, guestsCount } = bookingDetails;

            const formattedCheckIn = format( new Date( checkInDate ), 'yyyy-MM-dd' );
            const formattedCheckOut = format( new Date( checkOutDate ), 'yyyy-MM-dd' );

            const response = await axiosInstance.get( `/hotel/${ id }/rooms`, {
                params: {
                    checkInDate: formattedCheckIn,
                    checkOutDate: formattedCheckOut,
                    guests: guestsCount
                }
            } );

            if ( response.data.success ) {
                // Extract the rooms array from the nested data structure
                const roomsData = response.data.data.rooms || [];
                setAvailableRooms( roomsData );

                // If we have a roomId from location state, select that room
                if ( location.state?.roomId ) {
                    const selectedRoom = roomsData.find(
                        room => room.roomId === location.state.roomId
                    );
                    if ( selectedRoom ) {
                        setSelectedRoom( selectedRoom );
                        setBookingDetails( prev => ( {
                            ...prev,
                            roomType: selectedRoom.roomType
                        } ) );
                    }
                }
            } else {
                setError( 'Failed to fetch available rooms' );
            }
        } catch ( error ) {
            console.error( 'Error fetching available rooms:', error );
            setError( 'An error occurred while checking room availability' );
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

        // If check-in or check-out date changes, refetch available rooms
        if ( field === 'checkInDate' || field === 'checkOutDate' ) {
            // Reset selected room when dates change
            setSelectedRoom( null );
            fetchAvailableRooms();
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

    // Handle room selection
    const handleRoomSelect = ( room ) => {
        setSelectedRoom( room );
        setBookingDetails( {
            ...bookingDetails,
            roomId: room.roomId,
            roomType: room.roomType
        } );
    };

    // Calculate total price
    const calculateTotalPrice = () => {
        if ( !selectedRoom ) return 0;
        const nights = calculateNights();
        return selectedRoom.price * nights * bookingDetails.roomsCount;
    };

    // Move to the next step
    const handleNext = () => {
        // Validate current step
        if ( activeStep === 0 ) {
            if ( !hotel ) {
                setError( 'Hotel information not available' );
                return;
            }

            // Validate dates
            const { checkInDate, checkOutDate } = bookingDetails;
            if ( new Date( checkInDate ) >= new Date( checkOutDate ) ) {
                setError( 'Check-out date must be after check-in date' );
                return;
            }

            // Ensure check-in date is not in the past
            if ( new Date( checkInDate ) < new Date( new Date().setHours( 0, 0, 0, 0 ) ) ) {
                setError( 'Check-in date cannot be in the past' );
                return;
            }
        } else if ( activeStep === 1 ) {
            // Validate room selection
            if ( !selectedRoom ) {
                setError( 'Please select a room type' );
                return;
            }

            // Validate room count
            if ( bookingDetails.roomsCount <= 0 ) {
                setError( 'Number of rooms must be at least 1' );
                return;
            }

            // Make sure we have enough rooms available
            if ( selectedRoom.availableRooms < bookingDetails.roomsCount ) {
                setError( `Only ${ selectedRoom.availableRooms } rooms of this type are available` );
                return;
            }
        } else if ( activeStep === 2 ) {
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

            // Format dates for backend
            const formattedCheckIn = format( new Date( bookingDetails.checkInDate ), 'yyyy-MM-dd' );
            const formattedCheckOut = format( new Date( bookingDetails.checkOutDate ), 'yyyy-MM-dd' );

            // Prepare booking data
            const bookingData = {
                hotelId: id,
                roomId: selectedRoom.roomId,
                checkInDate: formattedCheckIn,
                checkOutDate: formattedCheckOut,
                numberOfRooms: bookingDetails.roomsCount,
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
                    hotelName: hotel.hotelName,
                    roomType: selectedRoom.roomType,
                    price: selectedRoom.price,
                    totalPrice: calculateTotalPrice(),
                    nights: calculateNights()
                }
            };

            // Submit booking
            const response = await axiosInstance.post( `/booking/hotel/${ id }`, bookingData );

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

    // Go back to hotel details
    const goBack = () => {
        navigate( `/hotels/${ id }` );
    };

    // Navigate to all bookings
    const viewAllBookings = () => {
        navigate( '/bookings' );
    };

    // Navigate to the specific booking
    const viewBookingDetails = () => {
        navigate( `/booking/${ bookingId }` );
    };

    if ( loading && !hotel ) {
        return (
            <Container>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if ( error && !hotel ) {
        return (
            <Container>
                <Button startIcon={<ArrowBack />} onClick={goBack} sx={{ mt: 3, mb: 2 }}>
                    Back to Hotel Details
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
            case 0: // Hotel Details
                return (
                    <Box>
                        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                            <Typography variant="h6" gutterBottom>
                                Hotel Summary
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                        {hotel.hotelName}
                                    </Typography>
                                    <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
                                        <LocationOn fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {hotel.address.street}, {hotel.address.city}, {hotel.address.country}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="body2">Amenities:</Typography>
                                        <Box display="flex" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                                            {hotel.breakfastIncluded && (
                                                <Chip size="small" icon={<Restaurant fontSize="small" />} label="Breakfast" />
                                            )}
                                            {hotel.acType !== 'NON-AC' && (
                                                <Chip size="small" icon={<AcUnit fontSize="small" />} label="AC Rooms" />
                                            )}
                                            {hotel.amenities?.map( ( amenity, index ) => (
                                                <Chip
                                                    key={index}
                                                    size="small"
                                                    label={amenity}
                                                    icon={amenity.toLowerCase().includes( 'wifi' ) ? <WifiOutlined fontSize="small" /> : null}
                                                />
                                            ) )}
                                        </Box>
                                    </Box>
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
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="body2" color="text.secondary">
                                Select the number of guests:
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 2 }}>
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
                                    onClick={() => handleBookingChange( 'guestsCount', bookingDetails.guestsCount + 1 )}
                                >
                                    <Add fontSize="small" />
                                </IconButton>
                            </Box>
                        </Paper>
                    </Box>
                );

            case 1: // Room Selection
                return (
                    <Box>
                        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                            <Typography variant="h6" gutterBottom>
                                Available Rooms
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Select a room type for your stay from {formatDate( bookingDetails.checkInDate )} to {formatDate( bookingDetails.checkOutDate )}.
                            </Typography>

                            {availableRooms.length === 0 ? (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    No rooms available for the selected dates. Please try different dates.
                                </Alert>
                            ) : (
                                <Grid container spacing={2}>
                                    {availableRooms.map( ( room ) => (
                                        <Grid item xs={12} key={room.roomId}>
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    mb: 2,
                                                    border: selectedRoom?.roomId === room.roomId ?
                                                        '2px solid #2196f3' : '1px solid #e0e0e0',
                                                    cursor: 'pointer',
                                                    '&:hover': { borderColor: '#bbdefb' }
                                                }}
                                                onClick={() => handleRoomSelect( room )}
                                            >
                                                <CardContent>
                                                    <Grid container spacing={2}>
                                                        <Grid item xs={8}>
                                                            <Typography variant="h6" component="div">
                                                                {room.roomType}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                                Accommodates up to {room.capacity} {room.capacity === 1 ? 'person' : 'people'}
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                {room.description || `Comfortable ${ room.roomType.toLowerCase() } with modern amenities`}
                                                            </Typography>
                                                            <Box sx={{ mt: 1 }}>
                                                                <Chip
                                                                    size="small"
                                                                    label={`${ room.availableRooms } ${ room.availableRooms === 1 ? 'room' : 'rooms' } available`}
                                                                    color={room.availableRooms < 5 ? "warning" : "success"}
                                                                    sx={{ mr: 1 }}
                                                                />
                                                            </Box>
                                                        </Grid>
                                                        <Grid item xs={4}>
                                                            <Box display="flex" flexDirection="column" alignItems="flex-end">
                                                                <Typography variant="h6" color="primary">
                                                                    {formatPrice( room.price )}
                                                                </Typography>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    per night
                                                                </Typography>

                                                                <Radio
                                                                    checked={selectedRoom?.roomId === room.roomId}
                                                                    onChange={() => handleRoomSelect( room )}
                                                                    sx={{ mt: 'auto', ml: 'auto' }}
                                                                />
                                                            </Box>
                                                        </Grid>
                                                    </Grid>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ) )}
                                </Grid>
                            )}

                            {selectedRoom && (
                                <Box sx={{ mt: 3 }}>
                                    <Divider sx={{ mb: 2 }} />
                                    <Typography variant="subtitle1" gutterBottom>
                                        Number of rooms:
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                if ( bookingDetails.roomsCount > 1 ) {
                                                    handleBookingChange( 'roomsCount', bookingDetails.roomsCount - 1 );
                                                }
                                            }}
                                            disabled={bookingDetails.roomsCount <= 1}
                                        >
                                            <Remove fontSize="small" />
                                        </IconButton>
                                        <Typography sx={{ mx: 2 }}>
                                            {bookingDetails.roomsCount} {bookingDetails.roomsCount === 1 ? 'Room' : 'Rooms'}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                if ( bookingDetails.roomsCount < selectedRoom.availableRooms ) {
                                                    handleBookingChange( 'roomsCount', bookingDetails.roomsCount + 1 );
                                                }
                                            }}
                                            disabled={bookingDetails.roomsCount >= selectedRoom.availableRooms}
                                        >
                                            <Add fontSize="small" />
                                        </IconButton>
                                    </Box>

                                    <Typography variant="subtitle1" gutterBottom>
                                        Special Requests (Optional):
                                    </Typography>
                                    <TextField
                                        multiline
                                        rows={3}
                                        fullWidth
                                        placeholder="E.g., Non-smoking room, specific floor preference, etc."
                                        value={bookingDetails.specialRequests}
                                        onChange={( e ) => handleBookingChange( 'specialRequests', e.target.value )}
                                    />
                                </Box>
                            )}
                        </Paper>
                    </Box>
                );

            case 2: // Guest Information
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
                                                After 2:00 PM
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
                                                Before 12:00 PM
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Divider sx={{ my: 1 }} />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                Room Type
                                            </Typography>
                                            <Typography variant="body1">
                                                {selectedRoom?.roomType}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
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
                                                {calculateNights()} {calculateNights() === 1 ? 'Night' : 'Nights'}, {bookingDetails.roomsCount} {bookingDetails.roomsCount === 1 ? 'Room' : 'Rooms'}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Box>
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
                                <FormControlLabel
                                    value="pay_at_hotel"
                                    control={<Radio />}
                                    label="Pay at Hotel"
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
                                    {formatPrice( selectedRoom?.price || 0 )} x {calculateNights()} night{calculateNights() !== 1 ? 's' : ''} x {bookingDetails.roomsCount} room{bookingDetails.roomsCount !== 1 ? 's' : ''}
                                </Typography>
                                <Typography>
                                    {formatPrice( calculateTotalPrice() )}
                                </Typography>
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
                                Your hotel booking has been successfully confirmed. A confirmation email has been sent to {guestInfo.email}.
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
                    Back to Hotel Details
                </Button>
            )}

            <Typography variant="h4" component="h1" gutterBottom>
                {activeStep === 4 ? 'Booking Confirmation' : 'Book Your Stay'}
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
                        You are about to book {bookingDetails.roomsCount} {bookingDetails.roomsCount === 1 ? 'room' : 'rooms'} at {hotel?.hotelName} for {calculateNights()} {calculateNights() === 1 ? 'night' : 'nights'} from {formatDate( bookingDetails.checkInDate )} to {formatDate( bookingDetails.checkOutDate )} for a total of {formatPrice( calculateTotalPrice() )}.
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

export default BookingHotel;