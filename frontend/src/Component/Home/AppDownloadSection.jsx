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
                        <Grid item xs={12} md={6} sx={{ textAlign: 'center' }}>
                            <div className="w-64 h-64 mx-auto bg-blue-800 rounded-3xl shadow-lg flex flex-col items-center justify-center transform rotate-12 relative overflow-hidden">
                                {/* App icon circle */}
                                <div className="absolute w-80 h-80 bg-blue-700 rounded-full -top-20 -right-20"></div>

                                {/* Icon shine effect */}
                                <div className="absolute w-40 h-40 bg-blue-600 rounded-full -bottom-10 -left-10 opacity-70"></div>

                                {/* App name */}
                                <div className="relative z-10 text-center px-4">
                                    <div className="text-4xl font-extrabold text-white mb-2 font-serif tracking-wide">KarSafar</div>
                                    <div className="text-blue-200 text-sm">Your Travel Companion</div>
                                </div>

                                {/* App icon detail */}
                                <div className="absolute bottom-6 w-16 h-1 bg-white/30 rounded-full"></div>
                            </div>
                        </Grid>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default AppDownloadSection;