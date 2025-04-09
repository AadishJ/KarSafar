import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { amber } from '@mui/material/colors';
import {
    Container,
    Typography,
    Box,
    Paper,
    Grid2 as Grid,
    Button,
    Card,
    CardContent,
    CardMedia,
    IconButton,
    Tabs,
    Tab,
    TextField,
    InputAdornment,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {
    FlightTakeoff,
    DirectionsBus,
    DirectionsRailway,
    DirectionsCar,
    Hotel,
    LocationOn,
    CalendarMonth,
    Search,
    StarRate,
    ArrowForward,
    LocalOffer
} from '@mui/icons-material';

const Home = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery( theme.breakpoints.down( 'sm' ) );
    const [ searchTab, setSearchTab ] = useState( 0 );

    const handleSearchTabChange = ( event, newValue ) => {
        setSearchTab( newValue );
    };

    // Featured destinations data
    const featuredDestinations = [
        {
            id: 1,
            name: 'Goa',
            image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80',
            description: 'Beaches, nightlife & Portuguese heritage',
            rating: 4.7,
            price: 12000
        },
        {
            id: 2,
            name: 'Kerala',
            image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80',
            description: 'Serene backwaters & lush greenery',
            rating: 4.8,
            price: 15000
        },
        {
            id: 3,
            name: 'Rajasthan',
            image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80',
            description: 'Royal palaces & desert landscapes',
            rating: 4.6,
            price: 13500
        },
        {
            id: 4,
            name: 'Himachal',
            image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80',
            description: 'Mountain views & adventure sports',
            rating: 4.5,
            price: 16000
        }
    ];

    // Special offers data
    const specialOffers = [
        {
            id: 1,
            title: 'Monsoon Getaway',
            discount: '30% OFF',
            code: 'MONSOON30',
            expiry: 'Valid till 31st July'
        },
        {
            id: 2,
            title: 'Family Package',
            discount: '₹2000 OFF',
            code: 'FAMILY2K',
            expiry: 'Valid till 31st August'
        },
        {
            id: 3,
            title: 'Weekend Escape',
            discount: '25% OFF',
            code: 'WEEKEND25',
            expiry: 'Valid on all weekends'
        }
    ];

    // Format price with Indian Rupee symbol
    const formatPrice = ( price ) => {
        return new Intl.NumberFormat( 'en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        } ).format( price );
    };

    return (
        <>
            {/* Hero Section with Background Image */}
            <Box
                sx={{
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    pt: 15,
                    pb: 15,
                    color: 'white',
                    position: 'relative',
                }}
            >
                <Container>
                    <Box sx={{ maxWidth: 700, mx: isMobile ? 'auto' : 0 }}>
                        <Typography variant="h2" gutterBottom fontWeight="bold" sx={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                            Explore Beautiful India
                        </Typography>
                        <Typography variant="h5" paragraph sx={{ mb: 4, textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                            Discover amazing places, create unforgettable memories and travel with confidence
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            sx={{
                                bgcolor: 'primary.main',
                                px: 4,
                                py: 1.5,
                                fontSize: 18,
                                fontWeight: 'bold',
                                '&:hover': { bgcolor: 'primary.dark' }
                            }}
                        >
                            Start Your Journey
                        </Button>
                    </Box>
                </Container>
            </Box>

            {/* Search Section */}
            <Container sx={{ mt: -5, position: 'relative', zIndex: 1 }}>
                <Paper
                    elevation={3}
                    sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        mb: 8
                    }}
                >
                    <Tabs
                        value={searchTab}
                        onChange={handleSearchTabChange}
                        variant="fullWidth"
                        sx={{
                            bgcolor: 'white',
                            '& .MuiTab-root': {
                                py: 2,
                                fontWeight: 'medium'
                            }
                        }}
                    >
                        <Tab icon={<FlightTakeoff />} label="Flights" />
                        <Tab icon={<Hotel />} label="Hotels" />
                        <Tab icon={<DirectionsRailway />} label="Trains" />
                        <Tab icon={<DirectionsBus />} label="Buses" />
                        <Tab icon={<DirectionsCar />} label="Cabs" />
                    </Tabs>

                    <Box sx={{ p: 3, bgcolor: '#f8f9fa' }}>
                        {searchTab === 0 && (
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        placeholder="From"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LocationOn />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        placeholder="To"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LocationOn />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        placeholder="Departure"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <CalendarMonth />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        sx={{ height: '100%', py: 1.5 }}
                                        component={Link}
                                        to="/flight"
                                        startIcon={<Search />}
                                    >
                                        Search Flights
                                    </Button>
                                </Grid>
                            </Grid>
                        )}

                        {searchTab === 1 && (
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        placeholder="Where do you want to stay?"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LocationOn />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        placeholder="Check-in"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <CalendarMonth />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        placeholder="Check-out"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <CalendarMonth />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        sx={{ height: '100%', py: 1.5 }}
                                        component={Link}
                                        to="/hotel"
                                        startIcon={<Search />}
                                    >
                                        Search Hotels
                                    </Button>
                                </Grid>
                            </Grid>
                        )}

                        {searchTab === 2 && (
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        placeholder="From"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LocationOn />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        placeholder="To"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LocationOn />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        placeholder="Travel Date"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <CalendarMonth />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        sx={{ height: '100%', py: 1.5 }}
                                        component={Link}
                                        to="/train"
                                        startIcon={<Search />}
                                    >
                                        Search Trains
                                    </Button>
                                </Grid>
                            </Grid>
                        )}

                        {searchTab === 3 && (
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        placeholder="From"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LocationOn />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        placeholder="To"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LocationOn />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        placeholder="Travel Date"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <CalendarMonth />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        sx={{ height: '100%', py: 1.5 }}
                                        component={Link}
                                        to="/bus"
                                        startIcon={<Search />}
                                    >
                                        Search Buses
                                    </Button>
                                </Grid>
                            </Grid>
                        )}

                        {searchTab === 4 && (
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        placeholder="Pickup Location"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LocationOn />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        placeholder="Destination"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LocationOn />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        placeholder="Pickup Date & Time"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <CalendarMonth />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        sx={{ height: '100%', py: 1.5 }}
                                        component={Link}
                                        to="/cab"
                                        startIcon={<Search />}
                                    >
                                        Search Cabs
                                    </Button>
                                </Grid>
                            </Grid>
                        )}
                    </Box>
                </Paper>
            </Container>

            {/* Featured Destinations Section */}
            <Box sx={{ py: 8, bgcolor: '#f8f9fa' }}>
                <Container>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
                            Popular Destinations
                        </Typography>
                        <Button
                            variant="text"
                            endIcon={<ArrowForward />}
                            component={Link}
                            to="/destinations"
                        >
                            View All
                        </Button>
                    </Box>

                    <Grid container spacing={3}>
                        {featuredDestinations.map( ( destination ) => (
                            <Grid item xs={12} sm={6} md={3} key={destination.id}>
                                <Card sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderRadius: 2,
                                    transition: '0.3s',
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                                    }
                                }}>
                                    <CardMedia
                                        component="img"
                                        height="180"
                                        image={destination.image}
                                        alt={destination.name}
                                        sx={{ position: 'relative' }}
                                    />
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Typography variant="h6" component="h3" gutterBottom fontWeight="bold">
                                            {destination.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" paragraph>
                                            {destination.description}
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <StarRate sx={{ color: amber[ 500 ], mr: 0.5 }} fontSize="small" />
                                                <Typography variant="body2" fontWeight="medium">
                                                    {destination.rating}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body1" color="primary.main" fontWeight="bold">
                                                From {formatPrice( destination.price )}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ) )}
                    </Grid>
                </Container>
            </Box>

            {/* Why Choose Us Section */}
            <Container sx={{ py: 8 }}>
                <Typography variant="h4" component="h2" align="center" sx={{ mb: 6, fontWeight: 'bold' }}>
                    Why Choose Our Services
                </Typography>

                <Grid container spacing={4}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box textAlign="center">
                            <Box
                                sx={{
                                    bgcolor: 'primary.light',
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 2
                                }}
                            >
                                <img
                                    src="https://cdn-icons-png.flaticon.com/512/6968/6968266.png"
                                    alt="Best Prices"
                                    width="40"
                                    height="40"
                                />
                            </Box>
                            <Typography variant="h6" gutterBottom fontWeight="bold">
                                Best Prices
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Get the best deals on flights, hotels, buses and cabs with our price match guarantee.
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Box textAlign="center">
                            <Box
                                sx={{
                                    bgcolor: 'primary.light',
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 2
                                }}
                            >
                                <img
                                    src="https://cdn-icons-png.flaticon.com/512/5233/5233745.png"
                                    alt="Easy Booking"
                                    width="40"
                                    height="40"
                                />
                            </Box>
                            <Typography variant="h6" gutterBottom fontWeight="bold">
                                Easy Booking
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Simple, fast and hassle-free booking experience on our website and mobile app.
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Box textAlign="center">
                            <Box
                                sx={{
                                    bgcolor: 'primary.light',
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 2
                                }}
                            >
                                <img
                                    src="https://cdn-icons-png.flaticon.com/512/2857/2857532.png"
                                    alt="24/7 Support"
                                    width="40"
                                    height="40"
                                />
                            </Box>
                            <Typography variant="h6" gutterBottom fontWeight="bold">
                                24/7 Support
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Round-the-clock customer service to assist you anytime, anywhere during your journey.
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Box textAlign="center">
                            <Box
                                sx={{
                                    bgcolor: 'primary.light',
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 2
                                }}
                            >
                                <img
                                    src="https://cdn-icons-png.flaticon.com/512/3176/3176341.png"
                                    alt="Secure Payments"
                                    width="40"
                                    height="40"
                                />
                            </Box>
                            <Typography variant="h6" gutterBottom fontWeight="bold">
                                Secure Payments
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Multiple secure payment options and encryption for safe transactions.
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Container>

            {/* Special Offers Section */}
            <Box sx={{ py: 8, bgcolor: '#f8f9fa' }}>
                <Container>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
                            Special Offers
                        </Typography>
                        <Button
                            variant="text"
                            endIcon={<ArrowForward />}
                            component={Link}
                            to="/offers"
                        >
                            View All Offers
                        </Button>
                    </Box>

                    <Grid container spacing={3}>
                        {specialOffers.map( ( offer ) => (
                            <Grid item xs={12} md={4} key={offer.id}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        borderRadius: 2,
                                        bgcolor: '#fff',
                                        border: '1px solid #e0e0e0',
                                        height: '100%',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 14,
                                            right: -28,
                                            transform: 'rotate(45deg)',
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            py: 0.5,
                                            px: 3,
                                            fontSize: 14,
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {offer.discount}
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <LocalOffer color="primary" sx={{ mr: 1 }} />
                                        <Typography variant="h6" fontWeight="bold">
                                            {offer.title}
                                        </Typography>
                                    </Box>

                                    <Typography variant="body1" component="div" sx={{ mb: 2 }}>
                                        Use code: <Box component="span" fontWeight="bold">{offer.code}</Box>
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary">
                                        {offer.expiry}
                                    </Typography>

                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        sx={{ mt: 2 }}
                                    >
                                        Book Now
                                    </Button>
                                </Paper>
                            </Grid>
                        ) )}
                    </Grid>
                </Container>
            </Box>

            {/* App Download Section */}
            <Box sx={{ py: 8, bgcolor: 'primary.main', color: 'white' }}>
                <Container>
                    <Grid container alignItems="center" spacing={4}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h4" fontWeight="bold" gutterBottom>
                                Download Our Mobile App
                            </Typography>
                            <Typography variant="body1" paragraph sx={{ mb: 4, opacity: 0.9 }}>
                                Get exclusive app-only deals, manage your bookings on the go, and receive real-time updates on your travel.
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                                    alt="Get it on Google Play"
                                    style={{ height: 45 }}
                                />
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                                    alt="Download on the App Store"
                                    style={{ height: 45 }}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6} sx={{ textAlign: 'center' }}>
                            <img
                                src="https://cdn.dribbble.com/users/1859368/screenshots/16071111/media/1db80d0ef7c79652b861a87e6e65c1c8.png?compress=1&resize=800x600"
                                alt="Mobile app"
                                style={{ maxWidth: '90%', maxHeight: 400 }}
                            />
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Testimonials Section */}
            <Container sx={{ py: 8 }}>
                <Typography variant="h4" component="h2" align="center" sx={{ mb: 6, fontWeight: 'bold' }}>
                    What Our Customers Say
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Paper elevation={1} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                            <Box sx={{ display: 'flex', mb: 2 }}>
                                {[ 1, 2, 3, 4, 5 ].map( ( star ) => (
                                    <StarRate key={star} sx={{ color: amber[ 500 ] }} />
                                ) )}
                            </Box>
                            <Typography variant="body1" paragraph sx={{ fontStyle: 'italic' }}>
                                "The booking process was seamless and the customer service was excellent. I had to reschedule my flight and their team was very helpful. Will definitely use this platform again!"
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box
                                    component="img"
                                    src="https://randomuser.me/api/portraits/women/33.jpg"
                                    alt="Avatar"
                                    sx={{ width: 50, height: 50, borderRadius: '50%', mr: 2 }}
                                />
                                <Box>
                                    <Typography variant="subtitle1" fontWeight="bold">Priya Sharma</Typography>
                                    <Typography variant="body2" color="text.secondary">Delhi</Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper elevation={1} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                            <Box sx={{ display: 'flex', mb: 2 }}>
                                {[ 1, 2, 3, 4, 5 ].map( ( star ) => (
                                    <StarRate key={star} sx={{ color: amber[ 500 ] }} />
                                ) )}
                            </Box>
                            <Typography variant="body1" paragraph sx={{ fontStyle: 'italic' }}>
                                "Got amazing deals on my Goa trip. The hotel they recommended was fantastic with a beautiful beach view. Their travel tips helped make our vacation perfect!"
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box
                                    component="img"
                                    src="https://randomuser.me/api/portraits/men/44.jpg"
                                    alt="Avatar"
                                    sx={{ width: 50, height: 50, borderRadius: '50%', mr: 2 }}
                                />
                                <Box>
                                    <Typography variant="subtitle1" fontWeight="bold">Rahul Patel</Typography>
                                    <Typography variant="body2" color="text.secondary">Mumbai</Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper elevation={1} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                            <Box sx={{ display: 'flex', mb: 2 }}>
                                {[ 1, 2, 3, 4, 5 ].map( ( star ) => (
                                    <StarRate key={star} sx={{ color: star <= 4 ? amber[ 500 ] : 'text.disabled' }} />
                                ) )}
                            </Box>
                            <Typography variant="body1" paragraph sx={{ fontStyle: 'italic' }}>
                                "I've been using this service for all my business trips for the past year. Their cab service is punctual and the drivers are professional. Makes my travel stress-free."
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box
                                    component="img"
                                    src="https://randomuser.me/api/portraits/women/65.jpg"
                                    alt="Avatar"
                                    sx={{ width: 50, height: 50, borderRadius: '50%', mr: 2 }}
                                />
                                <Box>
                                    <Typography variant="subtitle1" fontWeight="bold">Ananya Reddy</Typography>
                                    <Typography variant="body2" color="text.secondary">Bangalore</Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>

            {/* Newsletter Section */}
            <Box sx={{ py: 8, bgcolor: '#f8f9fa' }}>
                <Container>
                    <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, bgcolor: 'primary.light' }}>
                        <Grid container spacing={3} alignItems="center">
                            <Grid item xs={12} md={6}>
                                <Typography variant="h4" fontWeight="bold" gutterBottom>
                                    Subscribe to Our Newsletter
                                </Typography>
                                <Typography variant="body1">
                                    Get updates on special deals, travel tips, and seasonal offers directly in your inbox.
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <TextField
                                        fullWidth
                                        placeholder="Your Email Address"
                                        variant="outlined"
                                        sx={{ bgcolor: 'white' }}
                                    />
                                    <Button variant="contained" sx={{ px: 3 }}>
                                        Subscribe
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Container>
            </Box>
        </>
    );
};

export default Home;