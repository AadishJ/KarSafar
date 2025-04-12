import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';

const HeroSection = ( { isMobile } ) => {
    return (
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
    );
};

export default HeroSection;