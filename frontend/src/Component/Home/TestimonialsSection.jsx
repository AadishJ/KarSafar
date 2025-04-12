import React from 'react';
import { Typography, Box, Grid2 as Grid, Paper } from '@mui/material';
import { StarRate } from '@mui/icons-material';

const testimonials = [
    {
        id: 1,
        name: 'Priya Sharma',
        location: 'Delhi',
        rating: 5,
        text: 'The booking process was seamless and the customer service was excellent. I had to reschedule my flight and their team was very helpful. Will definitely use this platform again!',
        avatar: 'https://randomuser.me/api/portraits/women/33.jpg',
    },
    {
        id: 2,
        name: 'Rahul Patel',
        location: 'Mumbai',
        rating: 5,
        text: 'Got amazing deals on my Goa trip. The hotel they recommended was fantastic with a beautiful beach view. Their travel tips helped make our vacation perfect!',
        avatar: 'https://randomuser.me/api/portraits/men/44.jpg',
    },
    {
        id: 3,
        name: 'Ananya Reddy',
        location: 'Bangalore',
        rating: 4,
        text: 'I\'ve been using this service for all my business trips for the past year. Their cab service is punctual and the drivers are professional. Makes my travel stress-free.',
        avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    }
];

const TestimonialCard = ( { testimonial, amberColor } ) => (
    <Paper elevation={1} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
        <Box sx={{ display: 'flex', mb: 2 }}>
            {[ 1, 2, 3, 4, 5 ].map( ( star ) => (
                <StarRate
                    key={star}
                    sx={{ color: star <= testimonial.rating ? amberColor : 'text.disabled' }}
                />
            ) )}
        </Box>
        <Typography variant="body1" paragraph sx={{ fontStyle: 'italic' }}>
            "{testimonial.text}"
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
                component="img"
                src={testimonial.avatar}
                alt={`${ testimonial.name }'s avatar`}
                sx={{ width: 50, height: 50, borderRadius: '50%', mr: 2 }}
            />
            <Box>
                <Typography variant="subtitle1" fontWeight="bold">{testimonial.name}</Typography>
                <Typography variant="body2" color="text.secondary">{testimonial.location}</Typography>
            </Box>
        </Box>
    </Paper>
);

const TestimonialsSection = ( { amberColor } ) => {
    return (
        <>
            <Typography variant="h4" component="h2" align="center" sx={{ mb: 6, fontWeight: 'bold' }}>
                What Our Customers Say
            </Typography>

            <Grid container spacing={3}>
                {testimonials.map( testimonial => (
                    <Grid item xs={12} md={4} key={testimonial.id}>
                        <TestimonialCard testimonial={testimonial} amberColor={amberColor} />
                    </Grid>
                ) )}
            </Grid>
        </>
    );
};

export default TestimonialsSection;