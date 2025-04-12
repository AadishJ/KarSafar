import React from 'react';
import { Link } from 'react-router-dom';
import { amber } from '@mui/material/colors';
import {
    Container,
    Typography,
    Box,
    Grid2 as Grid,
    Button,
    Card,
    CardContent,
    CardMedia
} from '@mui/material';
import { StarRate, ArrowForward } from '@mui/icons-material';

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

const DestinationsSection = ( { formatPrice } ) => {
    return (
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
    );
};

export default DestinationsSection;