import React from 'react';
import { Link } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Grid2 as Grid,
    Button,
    Paper
} from '@mui/material';
import { ArrowForward, LocalOffer } from '@mui/icons-material';

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

const OfferCard = ( { offer } ) => (
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
);

const OffersSection = () => {
    return (
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
                        <OfferCard offer={offer} />
                    </Grid>
                ) )}
            </Grid>
        </Container>
    );
};

export default OffersSection;