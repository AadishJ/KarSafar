import React, { useState } from 'react';
import { amber } from '@mui/material/colors';
import { Container, Box, useMediaQuery, useTheme } from '@mui/material';

import HeroSection from '../Component/Home/HeroSection';
import SearchSection from '../Component/Home/SearchSection';
import DestinationsSection from '../Component/Home/DestinationsSection';
import FeaturesSection from '../Component/Home/FeaturesSection';
import OffersSection from '../Component/Home/OffersSection';
import AppDownloadSection from '../Component/Home/AppDownloadSection';
import TestimonialsSection from '../Component/Home/TestimonialsSection';
import NewsletterSection from '../Component/Home/NewsletterSection';

const Home = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery( theme.breakpoints.down( 'sm' ) );
    const [ searchTab, setSearchTab ] = useState( 0 );

    const handleSearchTabChange = ( event, newValue ) => {
        setSearchTab( newValue );
    };

    // Format price with Indian Rupee symbol (used by multiple child components)
    const formatPrice = ( price ) => {
        return new Intl.NumberFormat( 'en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        } ).format( price );
    };

    return (
        <>
            <HeroSection isMobile={isMobile} />

            <Container sx={{ mt: -5, position: 'relative', zIndex: 1 }}>
                <SearchSection
                    searchTab={searchTab}
                    onTabChange={handleSearchTabChange}
                />
            </Container>

            <Box sx={{ py: 8, bgcolor: '#f8f9fa' }}>
                <DestinationsSection formatPrice={formatPrice} />
            </Box>

            <Container sx={{ py: 8 }}>
                <FeaturesSection />
            </Container>

            <Box sx={{ py: 8, bgcolor: '#f8f9fa' }}>
                <OffersSection />
            </Box>

            <AppDownloadSection />

            <Container sx={{ py: 8 }}>
                <TestimonialsSection amberColor={amber[ 500 ]} />
            </Container>

            <Box sx={{ py: 8, bgcolor: '#f8f9fa' }}>
                <NewsletterSection />
            </Box>
        </>
    );
};

export default Home;