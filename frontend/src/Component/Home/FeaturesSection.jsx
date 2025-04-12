import React from 'react';
import { Typography, Box, Grid2 as Grid } from '@mui/material';

const features = [
    {
        id: 1,
        icon: "https://cdn-icons-png.flaticon.com/512/6968/6968266.png",
        title: "Best Prices",
        description: "Get the best deals on flights, hotels, buses and cabs with our price match guarantee."
    },
    {
        id: 2,
        icon: "https://cdn-icons-png.flaticon.com/512/5233/5233745.png",
        title: "Easy Booking",
        description: "Simple, fast and hassle-free booking experience on our website and mobile app."
    },
    {
        id: 3,
        icon: "https://cdn-icons-png.flaticon.com/512/2857/2857532.png",
        title: "24/7 Support",
        description: "Round-the-clock customer service to assist you anytime, anywhere during your journey."
    },
    {
        id: 4,
        icon: "https://cdn-icons-png.flaticon.com/512/3176/3176341.png",
        title: "Secure Payments",
        description: "Multiple secure payment options and encryption for safe transactions."
    }
];

const FeatureItem = ( { icon, title, description } ) => (
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
                src={icon}
                alt={title}
                width="40"
                height="40"
            />
        </Box>
        <Typography variant="h6" gutterBottom fontWeight="bold">
            {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
            {description}
        </Typography>
    </Box>
);

const FeaturesSection = () => {
    return (
        <>
            <Typography variant="h4" component="h2" align="center" sx={{ mb: 6, fontWeight: 'bold' }}>
                Why Choose Our Services
            </Typography>

            <Grid container spacing={4}>
                {features.map( feature => (
                    <Grid item xs={12} sm={6} md={3} key={feature.id}>
                        <FeatureItem
                            icon={feature.icon}
                            title={feature.title}
                            description={feature.description}
                        />
                    </Grid>
                ) )}
            </Grid>
        </>
    );
};

export default FeaturesSection;