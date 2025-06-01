import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
    CardMedia,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Rating,
    IconButton,
    TextField,
    InputAdornment,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ImageList,
    ImageListItem
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addDays, differenceInDays } from 'date-fns';
import axiosInstance from '../../Config/axiosInstance';
import {
    ArrowBack,
    LocationOn,
    Phone,
    Email,
    Hotel,
    Restaurant,
    AcUnit,
    Pool,
    Wifi,
    LocalParking,
    Spa,
    FitnessCenter,
    DirectionsWalk,
    AddCircleOutline,
    RemoveCircleOutline,
    KingBed,
    Person,
    Check
} from '@mui/icons-material';

const HotelId = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [ hotel, setHotel ] = useState( null );
    const [ loading, setLoading ] = useState( true );
    const [ error, setError ] = useState( null );
    const [ activeTab, setActiveTab ] = useState( 0 );
    const [ availableRooms, setAvailableRooms ] = useState( [] );
    const [ selectedRoom, setSelectedRoom ] = useState( null );

    // Booking search state
    const [ searchParams, setSearchParams ] = useState( {
        checkInDate: location.state?.checkInDate || new Date(),
        checkOutDate: location.state?.checkOutDate || addDays( new Date(), 1 ),
        guests: location.state?.guests || 1
    } );

    useEffect( () => {
        const fetchHotelDetails = async () => {
            try {
                setLoading( true );
                const response = await axiosInstance.get( `/hotel/${ id }` );

                if ( response.data.success ) {
                    setHotel( response.data.data );
                    fetchAvailableRooms( response.data.data );
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

        if ( id ) {
            fetchHotelDetails();
        }
    }, [ id ] );
    // Fix for the fetchAvailableRooms function in HotelId.jsx
    const fetchAvailableRooms = async ( hotelData ) => {
        try {
            const formattedCheckIn = format( searchParams.checkInDate, 'yyyy-MM-dd' );
            const formattedCheckOut = format( searchParams.checkOutDate, 'yyyy-MM-dd' );

            const response = await axiosInstance.get( `/hotel/${ id }/rooms`, {
                params: {
                    checkInDate: formattedCheckIn,
                    checkOutDate: formattedCheckOut,
                    guests: searchParams.guests
                }
            } );

            if ( response.data.success ) {
                // Extract the rooms array from the nested data structure
                setAvailableRooms( response.data.data.rooms || [] );
            } else {
                // If API call fails, fall back to all rooms from hotel data
                setAvailableRooms( hotelData.rooms || [] );
            }
        } catch ( error ) {
            console.error( 'Error fetching available rooms:', error );
            // Fall back to all rooms from hotel data
            setAvailableRooms( hotelData.rooms || [] );
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

    const handleTabChange = ( event, newValue ) => {
        setActiveTab( newValue );
    };

    const handleSearchParamChange = ( param, value ) => {
        setSearchParams( prev => ( {
            ...prev,
            [ param ]: value
        } ) );
    };

    const handleSearch = () => {
        fetchAvailableRooms( hotel );
    };

    const handleRoomSelect = ( room ) => {
        setSelectedRoom( room );
    };

    const handleBooking = () => {
        if ( !selectedRoom ) {
            alert( 'Please select a room type' );
            return;
        }

        // Navigate to booking page with hotel and room info
        navigate( `/booking/hotel/${ id }`, {
            state: {
                hotelId: id,
                roomId: selectedRoom.roomId,
                selectedRoom: selectedRoom,
                checkInDate: searchParams.checkInDate,
                checkOutDate: searchParams.checkOutDate,
                guests: searchParams.guests
            }
        } );
    };

    const goBack = () => {
        navigate( -1 );
    };

    const calculateStayDuration = () => {
        return differenceInDays( searchParams.checkOutDate, searchParams.checkInDate );
    };

    // Get amenity icon based on name
    const getAmenityIcon = ( amenity ) => {
        const amenityLower = amenity.toLowerCase();
        if ( amenityLower.includes( 'wifi' ) ) return <Wifi />;
        if ( amenityLower.includes( 'pool' ) ) return <Pool />;
        if ( amenityLower.includes( 'parking' ) ) return <LocalParking />;
        if ( amenityLower.includes( 'spa' ) ) return <Spa />;
        if ( amenityLower.includes( 'gym' ) || amenityLower.includes( 'fitness' ) ) return <FitnessCenter />;
        if ( amenityLower.includes( 'restaurant' ) ) return <Restaurant />;
        if ( amenityLower.includes( 'walk' ) || amenityLower.includes( 'distance' ) ) return <DirectionsWalk />;
        return <Check />;
    };

    if ( loading ) {
        return (
            <Container>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if ( error ) {
        return (
            <Container>
                <Button startIcon={<ArrowBack />} onClick={goBack} sx={{ mb: 3 }}>
                    Back to Search
                </Button>
                <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="error" variant="h6">
                        {error}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        Unable to load hotel details. Please try again later.
                    </Typography>
                </Paper>
            </Container>
        );
    }

    if ( !hotel ) {
        return (
            <Container>
                <Button startIcon={<ArrowBack />} onClick={goBack} sx={{ mb: 3 }}>
                    Back to Search
                </Button>
                <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6">
                        Hotel Not Found
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        The requested hotel could not be found.
                    </Typography>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Button startIcon={<ArrowBack />} onClick={goBack} sx={{ mb: 3 }}>
                Back to Search
            </Button>

            {/* Hotel Name and Rating */}
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom>
                        {hotel.hotelName}
                    </Typography>
                    <Box display="flex" alignItems="center">
                        <Rating value={4} readOnly size="small" sx={{ mr: 1 }} />
                        <Chip
                            size="small"
                            color={hotel.breakfastIncluded ? "success" : "default"}
                            label={hotel.breakfastIncluded ? "Breakfast Included" : "Breakfast Available"}
                            sx={{ mr: 1 }}
                        />
                        <Chip
                            size="small"
                            color="primary"
                            label={hotel.acType}
                        />
                    </Box>
                </Box>
                <Box>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                        Starting from {formatPrice( hotel.rooms && hotel.rooms.length > 0 ?
                            Math.min( ...hotel.rooms.map( room => room.price ) ) : 0 )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        per night
                    </Typography>
                </Box>
            </Box>

            {/* Hotel Images */}
            <Paper elevation={3} sx={{ mb: 4, overflow: 'hidden' }}>
                <Box sx={{ position: 'relative', height: '400px' }}>
                    {hotel.photos && hotel.photos.length > 0 ? (
                        <ImageList cols={3} gap={8} sx={{ m: 0, height: '100%' }}>
                            {hotel.photos.slice( 0, 6 ).map( ( photo, index ) => (
                                <ImageListItem key={index} sx={index === 0 ? { gridColumn: 'span 2', gridRow: 'span 2' } : {}}>
                                    <img
                                        src={photo}
                                        alt={`${ hotel.hotelName } - ${ index + 1 }`}
                                        loading="lazy"
                                        style={{
                                            height: '100%',
                                            width: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                </ImageListItem>
                            ) )}
                        </ImageList>
                    ) : (
                        <Box
                            sx={{
                                bgcolor: 'grey.200',
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Hotel sx={{ fontSize: 80, color: 'grey.400' }} />
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* Location and Contact */}
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Box display="flex" alignItems="flex-start">
                            <LocationOn color="primary" sx={{ mt: 0.5, mr: 1 }} />
                            <Typography>
                                {hotel.address.street}, {hotel.address.landmark && `${ hotel.address.landmark }, `}
                                {hotel.address.city}, {hotel.address.state && `${ hotel.address.state }, `}
                                {hotel.address.country} {hotel.address.pinCode && `- ${ hotel.address.pinCode }`}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                            <Phone fontSize="small" sx={{ mr: 1 }} />
                            <Typography>{hotel.phoneNo}</Typography>
                        </Box>
                        {hotel.email && (
                            <Box display="flex" alignItems="center">
                                <Email fontSize="small" sx={{ mr: 1 }} />
                                <Typography>{hotel.email}</Typography>
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </Paper>

            {/* Booking Search */}
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Check Availability
                </Typography>

                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Check-in Date"
                                value={searchParams.checkInDate}
                                onChange={( date ) => handleSearchParamChange( 'checkInDate', date )}
                                renderInput={( params ) => <TextField {...params} fullWidth />}
                                disablePast
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Check-out Date"
                                value={searchParams.checkOutDate}
                                onChange={( date ) => handleSearchParamChange( 'checkOutDate', date )}
                                renderInput={( params ) => <TextField {...params} fullWidth />}
                                minDate={addDays( searchParams.checkInDate, 1 )}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            label="Guests"
                            type="number"
                            value={searchParams.guests}
                            onChange={( e ) => handleSearchParamChange( 'guests', parseInt( e.target.value ) || 1 )}
                            fullWidth
                            InputProps={{
                                inputProps: { min: 1 },
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Person fontSize="small" />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box display="flex" alignItems="center" height="100%">
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSearch}
                                fullWidth
                                sx={{ height: '56px' }}
                            >
                                Check Availability
                            </Button>
                        </Box>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', color: 'white', borderRadius: 1 }}>
                    <Typography>
                        {calculateStayDuration()} night stay • {searchParams.guests} {searchParams.guests === 1 ? 'guest' : 'guests'} • {format( searchParams.checkInDate, 'MMM d, yyyy' )} to {format( searchParams.checkOutDate, 'MMM d, yyyy' )}
                    </Typography>
                </Box>
            </Paper>

            {/* Tabs for Hotel Information */}
            <Box sx={{ mb: 4 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ mb: 2 }}
                >
                    <Tab label="Rooms" />
                    <Tab label="Amenities" />
                    <Tab label="Description" />
                    <Tab label="Policies" />
                </Tabs>

                {/* Rooms Tab */}
                {activeTab === 0 && (
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Available Rooms
                        </Typography>
                        {availableRooms.length === 0 ? (
                            <Typography color="text.secondary">
                                No rooms available for the selected dates. Please try different dates.
                            </Typography>
                        ) : (
                            availableRooms.map( ( room ) => (
                                <Card
                                    key={room.roomId}
                                    variant="outlined"
                                    sx={{
                                        mb: 2,
                                        border: selectedRoom?.roomId === room.roomId ? '2px solid #1976d2' : '1px solid #e0e0e0',
                                        cursor: 'pointer',
                                        '&:hover': { borderColor: '#bbdefb' }
                                    }}
                                    onClick={() => handleRoomSelect( room )}
                                >
                                    <CardContent>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={8}>
                                                <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                                                    <KingBed color="primary" sx={{ mr: 1 }} />
                                                    <Typography variant="h6">
                                                        {room.roomType}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" sx={{ mb: 1 }}>
                                                    {room.roomDescription || `Comfortable ${ room.roomType.toLowerCase() } with modern amenities.`}
                                                </Typography>
                                                <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                                                    <Person fontSize="small" sx={{ mr: 0.5 }} />
                                                    <Typography variant="body2" sx={{ mr: 2 }}>
                                                        {room.pplAccommodated} Guests
                                                    </Typography>
                                                    <Chip
                                                        size="small"
                                                        label={`${ room.roomsAvailable } room(s) available`}
                                                        color={room.roomsAvailable < 5 ? "warning" : "success"}
                                                    />
                                                </Box>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Box display="flex" flexDirection="column" alignItems="flex-end">
                                                    <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                                                        {formatPrice( room.price )}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                        per night
                                                    </Typography>
                                                    <Button
                                                        variant={selectedRoom?.roomId === room.roomId ? "contained" : "outlined"}
                                                        color="primary"
                                                        onClick={( e ) => {
                                                            e.stopPropagation();
                                                            handleRoomSelect( room );
                                                        }}
                                                    >
                                                        {selectedRoom?.roomId === room.roomId ? "Selected" : "Select"}
                                                    </Button>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            ) )
                        )}

                        {availableRooms.length > 0 && (
                            <Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    onClick={handleBooking}
                                    disabled={!selectedRoom}
                                    sx={{ px: 4, py: 1.5 }}
                                >
                                    Book Now
                                </Button>
                            </Box>
                        )}
                    </Paper>
                )}

                {/* Amenities Tab */}
                {activeTab === 1 && (
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Hotel Amenities
                        </Typography>
                        <Grid container spacing={2}>
                            {[
                                ...( hotel.amenities || [] ),
                                hotel.breakfastIncluded ? 'Breakfast Included' : 'Breakfast Available (Paid)',
                                hotel.acType !== 'NON-AC' ? 'Air Conditioning' : null
                            ].filter( Boolean ).map( ( amenity, index ) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                    <Box display="flex" alignItems="center">
                                        <ListItemIcon>
                                            {getAmenityIcon( amenity )}
                                        </ListItemIcon>
                                        <Typography>{amenity}</Typography>
                                    </Box>
                                </Grid>
                            ) )}
                        </Grid>
                    </Paper>
                )}

                {/* Description Tab */}
                {activeTab === 2 && (
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            About {hotel.hotelName}
                        </Typography>
                        <Typography variant="body1" paragraph>
                            {hotel.description || `${ hotel.hotelName } offers comfortable accommodation in ${ hotel.address.city }. The hotel features modern amenities, professional service, and a convenient location.`}
                        </Typography>

                        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                            Location Highlights
                        </Typography>
                        <List>
                            <ListItem>
                                <ListItemIcon>
                                    <LocationOn />
                                </ListItemIcon>
                                <ListItemText
                                    primary={`Located in ${ hotel.address.city }, ${ hotel.address.country }`}
                                    secondary={hotel.address.landmark ? `Near ${ hotel.address.landmark }` : null}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon>
                                    <DirectionsWalk />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Nearby Attractions"
                                    secondary="Walking distance to local sights and transportation"
                                />
                            </ListItem>
                        </List>
                    </Paper>
                )}

                {/* Policies Tab */}
                {activeTab === 3 && (
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Hotel Policies
                        </Typography>

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="h6" component="h3" gutterBottom>
                                            Check-in/Check-out
                                        </Typography>
                                        <Typography variant="body2">
                                            • Check-in time: 2:00 PM<br />
                                            • Check-out time: 12:00 PM<br />
                                            • Early check-in subject to availability<br />
                                            • ID proof required for all guests<br />
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="h6" component="h3" gutterBottom>
                                            Cancellation Policy
                                        </Typography>
                                        <Typography variant="body2">
                                            • Free cancellation up to 24 hours before check-in<br />
                                            • Cancellation within 24 hours: First night charge<br />
                                            • No-show: 100% of booking amount<br />
                                            • Refunds processed within 7 business days<br />
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="h6" component="h3" gutterBottom>
                                            House Rules
                                        </Typography>
                                        <Typography variant="body2">
                                            • No pets allowed<br />
                                            • No smoking in rooms<br />
                                            • Quiet hours: 10:00 PM - 7:00 AM<br />
                                            • Additional guests must be registered<br />
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Paper>
                )}
            </Box>
        </Container>
    );
};

export default HotelId;