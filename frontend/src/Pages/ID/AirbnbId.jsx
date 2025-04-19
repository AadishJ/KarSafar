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
    Tabs,
    Tab,
    TextField,
    InputAdornment,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ImageList,
    ImageListItem,
    Avatar,
    Rating,
    Stack,
    Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addDays, differenceInDays } from 'date-fns';
import axiosInstance from '../../Config/axiosInstance';
import {
    ArrowBack,
    LocationOn,
    House,
    HomeWork,
    KingBed,
    Person,
    Bathtub,
    Kitchen,
    Wifi,
    LocalParking,
    Pets,
    AcUnit,
    Weekend,
    Pool,
    ChildCare,
    LocalLaundryService,
    Deck,
    Restaurant,
    Check,
    SupervisorAccount,
    HomeRepairService,
    MeetingRoom,
    Star,
    KeyboardArrowRight,
    EventAvailable
} from '@mui/icons-material';

const AirbnbId = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [ property, setProperty ] = useState( null );
    const [ loading, setLoading ] = useState( true );
    const [ error, setError ] = useState( null );
    const [ activeTab, setActiveTab ] = useState( 0 );
    const [ availability, setAvailability ] = useState( {
        isAvailable: true,
        availableDates: []
    } );

    // Booking search state
    const [ searchParams, setSearchParams ] = useState( {
        checkInDate: location.state?.checkInDate || new Date(),
        checkOutDate: location.state?.checkOutDate || addDays( new Date(), 2 ), // Default 2-night stay for Airbnb
        guests: location.state?.guests || 2 // Default 2 guests for Airbnb
    } );

    useEffect( () => {
        const fetchPropertyDetails = async () => {
            try {
                setLoading( true );
                const response = await axiosInstance.get( `/airbnb/${ id }` );

                if ( response.data.success ) {
                    setProperty( response.data.data );
                    checkAvailability( response.data.data );
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

        if ( id ) {
            fetchPropertyDetails();
        }
    }, [ id ] );

    const checkAvailability = async ( propertyData ) => {
        try {
            const formattedCheckIn = format( searchParams.checkInDate, 'yyyy-MM-dd' );
            const formattedCheckOut = format( searchParams.checkOutDate, 'yyyy-MM-dd' );

            const response = await axiosInstance.get( `/airbnb/${ id }/availability`, {
                params: {
                    checkInDate: formattedCheckIn,
                    checkOutDate: formattedCheckOut,
                    guests: searchParams.guests
                }
            } );

            if ( response.data.success ) {
                setAvailability( response.data.data );
            } else {
                // If API call fails, assume property is available (will be checked during booking)
                setAvailability( {
                    isAvailable: true,
                    availableDates: [],
                    pricing: propertyData.pricing || { basePrice: propertyData.price || 0 }
                } );
            }
        } catch ( error ) {
            console.error( 'Error checking availability:', error );
            setAvailability( {
                isAvailable: true,
                availableDates: []
            } );
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
        checkAvailability( property );
    };

    const handleBooking = () => {
        if ( !availability.isAvailable ) {
            alert( 'This property is not available for the selected dates' );
            return;
        }

        // Navigate to booking page with property info
        navigate( `/booking/airbnb/${ id }`, {
            state: {
                airbnbId: id,
                checkInDate: searchParams.checkInDate,
                checkOutDate: searchParams.checkOutDate,
                guests: searchParams.guests,
                basePrice: availability.pricing?.basePrice || property.price
            }
        } );
    };

    const goBack = () => {
        navigate( -1 );
    };

    const calculateStayDuration = () => {
        return differenceInDays( searchParams.checkOutDate, searchParams.checkInDate );
    };

    // Calculate total price
    const calculateTotalPrice = () => {
        const nights = calculateStayDuration();
        const basePrice = availability.pricing?.basePrice || property?.price || 0;
        const cleaningFee = property?.cleaningFee || 500;
        const serviceFee = Math.round( basePrice * 0.12 ); // 12% service fee

        return ( basePrice * nights ) + cleaningFee + serviceFee;
    };

    const getAmenityIcon = ( amenity ) => {
        const amenityLower = amenity.toLowerCase();
        if ( amenityLower.includes( 'wifi' ) ) return <Wifi />;
        if ( amenityLower.includes( 'pool' ) ) return <Pool />;
        if ( amenityLower.includes( 'parking' ) ) return <LocalParking />;
        if ( amenityLower.includes( 'pet' ) ) return <Pets />;
        if ( amenityLower.includes( 'kitchen' ) ) return <Kitchen />;
        if ( amenityLower.includes( 'living' ) ) return <Weekend />;
        if ( amenityLower.includes( 'air' ) || amenityLower.includes( 'ac' ) ) return <AcUnit />;
        if ( amenityLower.includes( 'bath' ) ) return <Bathtub />;
        if ( amenityLower.includes( 'laundry' ) || amenityLower.includes( 'washer' ) ) return <LocalLaundryService />;
        if ( amenityLower.includes( 'patio' ) || amenityLower.includes( 'balcony' ) || amenityLower.includes( 'terrace' ) ) return <Deck />;
        if ( amenityLower.includes( 'breakfast' ) ) return <Restaurant />; // Changed from Breakfast to Restaurant
        if ( amenityLower.includes( 'children' ) || amenityLower.includes( 'kid' ) ) return <ChildCare />;
        if ( amenityLower.includes( 'workspace' ) ) return <MeetingRoom />;
        return <Check />;
    };

    // Get property type icon
    const getPropertyTypeIcon = () => {
        if ( !property ) return <House />;

        const propertyType = property.propertyType?.toLowerCase() || '';

        if ( propertyType.includes( 'apart' ) ) return <HomeWork />;
        if ( propertyType.includes( 'villa' ) ) return <HomeWork />;
        if ( propertyType.includes( 'cottage' ) ) return <House />;
        if ( propertyType.includes( 'cabin' ) ) return <House />;

        return <House />;
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
                        Unable to load property details. Please try again later.
                    </Typography>
                </Paper>
            </Container>
        );
    }

    if ( !property ) {
        return (
            <Container>
                <Button startIcon={<ArrowBack />} onClick={goBack} sx={{ mb: 3 }}>
                    Back to Search
                </Button>
                <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6">
                        Property Not Found
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        The requested property could not be found.
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

            {/* Property Name and Type */}
            <Typography variant="h4" component="h1" gutterBottom>
                {property.propertyName}
            </Typography>

            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box display="flex" alignItems="center">
                    <Rating value={property.rating || 4.5} precision={0.5} readOnly size="small" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                        {property.rating || 4.5} ({property.reviewCount || 12} reviews)
                    </Typography>
                    <Chip
                        size="small"
                        icon={getPropertyTypeIcon()}
                        label={property.propertyType || "Entire home"}
                        sx={{ mr: 1 }}
                    />
                    <Box display="flex" alignItems="center">
                        <LocationOn fontSize="small" color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                            {property.address.city}, {property.address.country}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Property Images */}
            <Paper elevation={3} sx={{ mb: 4, overflow: 'hidden' }}>
                <Box sx={{ position: 'relative', height: '450px' }}>
                    {property.photos && property.photos.length > 0 ? (
                        <ImageList cols={4} gap={8} sx={{ m: 0, height: '100%', overflow: 'hidden' }}>
                            {property.photos.slice( 0, 8 ).map( ( photo, index ) => (
                                <ImageListItem
                                    key={index}
                                    sx={{
                                        ...( index === 0 ? { gridColumn: 'span 2', gridRow: 'span 2' } : {} ),
                                        overflow: 'hidden',
                                        borderRadius: index === 0 ? '8px 0 0 8px' : index === 3 ? '0 8px 0 0' : index === 7 ? '0 0 8px 0' : 0
                                    }}
                                >
                                    <img
                                        src={photo}
                                        alt={`${ property.propertyName } - ${ index + 1 }`}
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
                                justifyContent: 'center',
                                borderRadius: 2
                            }}
                        >
                            <House sx={{ fontSize: 80, color: 'grey.400' }} />
                        </Box>
                    )}
                </Box>
            </Paper>

            <Grid container spacing={4}>
                {/* Main Content (left column) */}
                <Grid item xs={12} md={8}>
                    {/* Host Information */}
                    <Box sx={{ mb: 4 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                                <Typography variant="h5" gutterBottom>
                                    {property.propertyType || "Entire home"} hosted by {property.host?.hostName || "Host"}
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    {property.maxGuests} guests • {property.bedrooms || 2} bedrooms • {property.beds || property.bedrooms * 1.5} beds • {property.bathrooms || 1} baths
                                </Typography>
                            </Box>
                            <Avatar
                                src={property.host?.hostProfilePic}
                                alt={property.host?.hostName || "Host"}
                                sx={{ width: 56, height: 56 }}
                            />
                        </Box>
                        {property.host?.isSuperhost && (
                            <Box display="flex" alignItems="center" sx={{ mt: 2 }}>
                                <Star color="error" sx={{ mr: 1, fontSize: 18 }} />
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {property.host?.hostName || "Host"} is a Superhost
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    <Divider sx={{ mb: 4 }} />

                    {/* Quick Highlights */}
                    <Box sx={{ mb: 4 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={4}>
                                <Box display="flex">
                                    <SupervisorAccount sx={{ mr: 1.5, color: 'text.primary' }} />
                                    <Box>
                                        <Typography variant="subtitle1">Hosted by {property.host?.hostName}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {property.host?.yearsHosting || 3}+ years hosting
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Box display="flex">
                                    <LocationOn sx={{ mr: 1.5, color: 'text.primary' }} />
                                    <Box>
                                        <Typography variant="subtitle1">Great location</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            90% of guests gave the location 5 stars
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Box display="flex">
                                    <EventAvailable sx={{ mr: 1.5, color: 'text.primary' }} />
                                    <Box>
                                        <Typography variant="subtitle1">Free cancellation</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Before {format( addDays( new Date(), 5 ), 'MMM d' )}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>

                    <Divider sx={{ mb: 4 }} />

                    {/* Property Description */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="body1" paragraph>
                            {property.description ||
                                `This beautiful ${ property.propertyType || "home" } in ${ property.address.city } offers a comfortable stay with all the amenities you need. Enjoy the spacious living areas, fully equipped kitchen, and convenient location. Perfect for your next getaway!`}
                        </Typography>
                    </Box>

                    {/* Tabs for Property Information */}
                    <Box sx={{ mb: 4 }}>
                        <Tabs
                            value={activeTab}
                            onChange={handleTabChange}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{ mb: 2 }}
                        >
                            <Tab label="Amenities" />
                            <Tab label="Location" />
                            <Tab label="House Rules" />
                        </Tabs>

                        {/* Amenities Tab */}
                        {activeTab === 0 && (
                            <Paper elevation={2} sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    What this place offers
                                </Typography>
                                <Grid container spacing={2}>
                                    {[
                                        ...( property.amenities || [
                                            'Wifi', 'Kitchen', 'Free parking', 'Air conditioning',
                                            'Washing machine', 'TV', 'Iron', 'Hair dryer'
                                        ] ),
                                        property.hasPool ? 'Swimming pool' : null,
                                        property.petsAllowed ? 'Pets allowed' : null
                                    ].filter( Boolean ).map( ( amenity, index ) => (
                                        <Grid item xs={12} sm={6} key={index}>
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

                        {/* Location Tab */}
                        {activeTab === 1 && (
                            <Paper elevation={2} sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Where you'll be
                                </Typography>

                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                                        {property.address.city}, {property.address.state}, {property.address.country}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {property.locationDescription ||
                                            `Located in a beautiful part of ${ property.address.city }, this property offers easy access to local attractions, restaurants, and transportation. The neighborhood is known for its charm and convenience.`}
                                    </Typography>
                                </Box>

                                <Typography variant="subtitle1" gutterBottom>
                                    Getting around
                                </Typography>
                                <List>
                                    <ListItem disableGutters>
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <KeyboardArrowRight />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={`${ property.distanceFromCenter || '2' } km from city center`}
                                        />
                                    </ListItem>
                                    {property.nearbyAttractions && property.nearbyAttractions.map( ( attraction, index ) => (
                                        <ListItem disableGutters key={index}>
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                <KeyboardArrowRight />
                                            </ListItemIcon>
                                            <ListItemText primary={attraction} />
                                        </ListItem>
                                    ) )}
                                    {!property.nearbyAttractions && (
                                        <>
                                            <ListItem disableGutters>
                                                <ListItemIcon sx={{ minWidth: 36 }}>
                                                    <KeyboardArrowRight />
                                                </ListItemIcon>
                                                <ListItemText primary="5 min walk to public transport" />
                                            </ListItem>
                                            <ListItem disableGutters>
                                                <ListItemIcon sx={{ minWidth: 36 }}>
                                                    <KeyboardArrowRight />
                                                </ListItemIcon>
                                                <ListItemText primary="20 min to airport by car" />
                                            </ListItem>
                                        </>
                                    )}
                                </List>
                            </Paper>
                        )}

                        {/* House Rules Tab */}
                        {activeTab === 2 && (
                            <Paper elevation={2} sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    House Rules
                                </Typography>

                                <Grid container spacing={3} sx={{ mb: 3 }}>
                                    <Grid item xs={6}>
                                        <Box display="flex" alignItems="center">
                                            <EventAvailable sx={{ mr: 1.5, color: 'text.secondary' }} />
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">Check-in</Typography>
                                                <Typography variant="body1">After 3:00 PM</Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Box display="flex" alignItems="center">
                                            <EventAvailable sx={{ mr: 1.5, color: 'text.secondary' }} />
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">Checkout</Typography>
                                                <Typography variant="body1">Before 11:00 AM</Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Box display="flex" alignItems="center">
                                            <Person sx={{ mr: 1.5, color: 'text.secondary' }} />
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">Max guests</Typography>
                                                <Typography variant="body1">{property.maxGuests} guests maximum</Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Box display="flex" alignItems="center">
                                            <Pets sx={{ mr: 1.5, color: 'text.secondary' }} />
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">Pets</Typography>
                                                <Typography variant="body1">{property.petsAllowed ? 'Allowed' : 'Not allowed'}</Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>

                                <Typography variant="subtitle1" gutterBottom>
                                    Additional rules
                                </Typography>
                                <List>
                                    <ListItem disableGutters>
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <Check fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary="No parties or events" />
                                    </ListItem>
                                    <ListItem disableGutters>
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <Check fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary="No smoking" />
                                    </ListItem>
                                    <ListItem disableGutters>
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <Check fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary="Security camera/recording device on property" />
                                    </ListItem>
                                    {property.houseRules && property.houseRules.map( ( rule, index ) => (
                                        <ListItem disableGutters key={index}>
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                <Check fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText primary={rule} />
                                        </ListItem>
                                    ) )}
                                </List>
                            </Paper>
                        )}
                    </Box>
                </Grid>

                {/* Booking Panel (right column) */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={3} sx={{ p: 3, position: 'sticky', top: 20, borderRadius: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {formatPrice( availability.pricing?.basePrice || property.price || 0 )}
                                <Typography component="span" variant="body2" color="text.secondary"> night</Typography>
                            </Typography>
                            <Box display="flex" alignItems="center">
                                <Star sx={{ fontSize: 18, mr: 0.5 }} />
                                <Typography variant="body2">
                                    {property.rating || 4.5} · {property.reviewCount || 12} reviews
                                </Typography>
                            </Box>
                        </Box>

                        <Box sx={{ mb: 3 }}>
                            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                                <Grid container spacing={1}>
                                    <Grid item xs={6}>
                                        <Typography variant="subtitle2">CHECK-IN</Typography>
                                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                                            <DatePicker
                                                value={searchParams.checkInDate}
                                                onChange={( date ) => handleSearchParamChange( 'checkInDate', date )}
                                                renderInput={( params ) => <TextField {...params} variant="standard" fullWidth />}
                                                disablePast
                                            />
                                        </LocalizationProvider>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="subtitle2">CHECKOUT</Typography>
                                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                                            <DatePicker
                                                value={searchParams.checkOutDate}
                                                onChange={( date ) => handleSearchParamChange( 'checkOutDate', date )}
                                                renderInput={( params ) => <TextField {...params} variant="standard" fullWidth />}
                                                minDate={addDays( searchParams.checkInDate, 1 )}
                                            />
                                        </LocalizationProvider>
                                    </Grid>
                                </Grid>
                            </Paper>

                            <TextField
                                label="Guests"
                                type="number"
                                value={searchParams.guests}
                                onChange={( e ) => handleSearchParamChange( 'guests', Math.min( parseInt( e.target.value ) || 1, property.maxGuests ) )}
                                fullWidth
                                InputProps={{
                                    inputProps: { min: 1, max: property.maxGuests },
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Person fontSize="small" />
                                        </InputAdornment>
                                    )
                                }}
                                helperText={`Maximum ${ property.maxGuests } guests`}
                                sx={{ mb: 2 }}
                            />

                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                size="large"
                                onClick={handleSearch}
                                sx={{ mb: 2 }}
                            >
                                Check Availability
                            </Button>

                            {!availability.isAvailable && (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    This property is not available for the selected dates.
                                </Alert>
                            )}
                        </Box>

                        {availability.isAvailable && (
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 2 }}>
                                    Price details
                                </Typography>

                                <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                                    <Typography variant="body2">
                                        {formatPrice( availability.pricing?.basePrice || property.price || 0 )} x {calculateStayDuration()} nights
                                    </Typography>
                                    <Typography variant="body2">
                                        {formatPrice( ( availability.pricing?.basePrice || property.price || 0 ) * calculateStayDuration() )}
                                    </Typography>
                                </Box>

                                <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                                    <Typography variant="body2">
                                        Cleaning fee
                                    </Typography>
                                    <Typography variant="body2">
                                        {formatPrice( property.cleaningFee || 500 )}
                                    </Typography>
                                </Box>

                                <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                                    <Typography variant="body2">
                                        Service fee
                                    </Typography>
                                    <Typography variant="body2">
                                        {formatPrice( Math.round( ( availability.pricing?.basePrice || property.price || 0 ) * 0.12 ) )}
                                    </Typography>
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                <Box display="flex" justifyContent="space-between" sx={{ mb: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                        Total
                                    </Typography>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                        {formatPrice( calculateTotalPrice() )}
                                    </Typography>
                                </Box>

                                <Button
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    size="large"
                                    onClick={handleBooking}
                                    disabled={!availability.isAvailable}
                                    sx={{ py: 1.5 }}
                                >
                                    Reserve
                                </Button>

                                <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 1 }}>
                                    You won't be charged yet
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default AirbnbId;