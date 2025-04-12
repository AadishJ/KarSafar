import React from 'react';
import { Container, Paper, Grid2 as Grid, Typography, Box, TextField, Button } from '@mui/material';

const NewsletterSection = () => {
    return (
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
    );
};

export default NewsletterSection;