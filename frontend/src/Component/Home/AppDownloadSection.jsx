import React from 'react';
import { Box, Container, Typography, Grid2 as Grid } from '@mui/material';

const AppDownloadSection = () => {
    return (
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
    );
};

export default AppDownloadSection;