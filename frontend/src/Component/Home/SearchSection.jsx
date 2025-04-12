import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Paper,
    Tabs,
    Tab,
    Box
} from '@mui/material';
import {
    FlightTakeoff,
    DirectionsBus,
    DirectionsRailway,
    DirectionsCar,
    Hotel
} from '@mui/icons-material';

import FlightSearchForm from './SearchForms/FlightSearchForm';
import HotelSearchForm from './SearchForms/HotelSearchForm';
import TrainSearchForm from './SearchForms/TrainSearchForm';
import BusSearchForm from './SearchForms/BusSearchForm';
import CabSearchForm from './SearchForms/CabSearchForm';

const SearchSection = ( { searchTab, onTabChange } ) => {
    const navigate = useNavigate();

    const [ flightSearchParams, setFlightSearchParams ] = useState( {
        origin: '',
        destination: '',
        departureDate: null,
        returnDate: null,
        isRoundTrip: false
    } );

    const handleFlightSearch = ( searchParams ) => {
        if ( !searchParams.origin || !searchParams.destination ) {
            alert( "Please select origin and destination" );
            return;
        }

        navigate( '/flights', {
            state: {
                searchParams: searchParams
            }
        } );
    };

    return (
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
                onChange={onTabChange}
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

            <Box sx={{ bgcolor: '#f8f9fa' }}>
                {searchTab === 0 && (
                    <FlightSearchForm
                        onChange={( params ) => setFlightSearchParams( params )}
                        onSearch={handleFlightSearch}
                    />
                )}
                {searchTab === 1 && <HotelSearchForm />}
                {searchTab === 2 && <TrainSearchForm />}
                {searchTab === 3 && <BusSearchForm />}
                {searchTab === 4 && <CabSearchForm />}
            </Box>
        </Paper>
    );
};

export default SearchSection;