import React, { useState } from 'react';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import {
    TextField,
    Box,
    Typography,
    Autocomplete,
    Paper,
    InputAdornment,
    MenuItem,
    FormControl,
    Select,
    Chip,
    Slider
} from '@mui/material';
import { addDays, format, differenceInDays } from 'date-fns';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import PublicIcon from '@mui/icons-material/Public';
import FlagIcon from '@mui/icons-material/Flag';
import WeekendIcon from '@mui/icons-material/Weekend';
import NightShelterIcon from '@mui/icons-material/NightShelter';

// Import cities data from JSON
import cities from '../assets/cities.json';

const AirbnbDateSelector = ( { onDateChange, onLocationChange, onGuestsChange, onPropertyTypeChange } ) => {
    const today = new Date();
    const [ checkInDate, setCheckInDate ] = useState( addDays( today, 1 ) );
    const [ checkOutDate, setCheckOutDate ] = useState( addDays( today, 3 ) );
    const [ location, setLocation ] = useState( null );
    const [ guests, setGuests ] = useState( 2 );
    const [ propertyType, setPropertyType ] = useState( 'entire_home' );

    // Get popular cities for initial display
    const popularCities = cities.filter( city => city.popular );

    // Calculate number of nights
    const nights = differenceInDays( checkOutDate, checkInDate );

    const handleCheckInDateChange = ( newDate ) => {
        setCheckInDate( newDate );
        if ( checkOutDate <= newDate ) {
            // Ensure checkout is at least 1 day after checkin
            const newCheckOutDate = addDays( newDate, 1 );
            setCheckOutDate( newCheckOutDate );

            onDateChange?.( {
                checkInDate: newDate,
                checkOutDate: newCheckOutDate,
                nights: 1
            } );
        } else {
            onDateChange?.( {
                checkInDate: newDate,
                checkOutDate,
                nights: differenceInDays( checkOutDate, newDate )
            } );
        }
    };

    const handleCheckOutDateChange = ( newDate ) => {
        setCheckOutDate( newDate );
        onDateChange?.( {
            checkInDate,
            checkOutDate: newDate,
            nights: differenceInDays( newDate, checkInDate )
        } );
    };

    const handleLocationChange = ( event, newValue ) => {
        setLocation( newValue );
        onLocationChange?.( {
            location: newValue
        } );
    };

    const handleGuestsChange = ( event ) => {
        const newGuests = event.target.value;
        setGuests( newGuests );

        onGuestsChange?.( {
            guests: newGuests
        } );
    };

    const handlePropertyTypeChange = ( event ) => {
        const newPropertyType = event.target.value;
        setPropertyType( newPropertyType );

        onPropertyTypeChange?.( {
            propertyType: newPropertyType
        } );
    };

    // Common styles for inputs
    const inputStyle = {
        height: '65px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
        backgroundColor: '#f9fafb',
        border: '1px solid #f0f0f0',
        borderRadius: '4px'
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ p: { xs: 3, sm: 4 }, bgcolor: 'white' }}>
                    {/* Property type selector */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                            Property Type
                        </Typography>
                        <FormControl fullWidth variant="outlined">
                            <Select
                                value={propertyType}
                                onChange={handlePropertyTypeChange}
                                sx={{ ...inputStyle }}
                                startAdornment={
                                    <InputAdornment position="start">
                                        {propertyType === 'entire_home' ? (
                                            <HomeIcon color="primary" />
                                        ) : propertyType === 'private_room' ? (
                                            <NightShelterIcon color="primary" />
                                        ) : (
                                            <WeekendIcon color="primary" />
                                        )}
                                    </InputAdornment>
                                }
                            >
                                <MenuItem value="entire_home">Entire Home/Apartment</MenuItem>
                                <MenuItem value="private_room">Private Room</MenuItem>
                                <MenuItem value="shared_room">Shared Room</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Location selector using cities.json */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                            Destination
                        </Typography>
                        <Autocomplete
                            value={location}
                            onChange={handleLocationChange}
                            options={cities}
                            getOptionLabel={( option ) => option ? `${ option.name }, ${ option.country }` : ''}
                            fullWidth
                            disablePortal
                            groupBy={( option ) => option.international ? 'International Destinations' : 'Domestic Destinations'}
                            sx={{
                                width: '100%',
                                '& .MuiOutlinedInput-root': {
                                    ...inputStyle
                                }
                            }}
                            renderInput={( params ) => (
                                <TextField
                                    {...params}
                                    placeholder="Where are you going?"
                                    fullWidth
                                    variant="outlined"
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LocationOnIcon color="primary" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            )}
                            renderOption={( props, option ) => (
                                <Box component="li" {...props} sx={{ py: 2, px: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                                                {option.name}
                                                {option.popular && (
                                                    <Chip
                                                        label="Popular"
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                        sx={{ ml: 1, height: 20 }}
                                                    />
                                                )}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {option.state ? `${ option.state }, ` : ''}{option.country}
                                            </Typography>
                                            {option.tourist_attractions && option.tourist_attractions.length > 0 && (
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                    <FlagIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                                                    {option.tourist_attractions.join( ' • ' )}
                                                </Typography>
                                            )}
                                        </Box>
                                        {option.international && (
                                            <PublicIcon sx={{ color: 'text.secondary', ml: 1 }} fontSize="small" />
                                        )}
                                    </Box>
                                </Box>
                            )}
                            ListboxProps={{
                                sx: { maxHeight: '350px', py: 1 }
                            }}
                        />
                    </Box>

                    {/* Date Selection row using flexbox */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: 3,
                        mb: 4
                    }}>
                        {/* Check-in date */}
                        <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                            <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                                Check-in Date
                            </Typography>
                            <DatePicker
                                value={checkInDate}
                                onChange={handleCheckInDateChange}
                                minDate={today}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        variant: "outlined",
                                        sx: {
                                            '& .MuiOutlinedInput-root': {
                                                ...inputStyle
                                            }
                                        }
                                    }
                                }}
                            />
                            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                                {format( checkInDate, 'EEEE, MMMM d, yyyy' )}
                            </Typography>
                        </Box>

                        {/* Check-out date */}
                        <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                            <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                                Check-out Date
                            </Typography>
                            <DatePicker
                                value={checkOutDate}
                                onChange={handleCheckOutDateChange}
                                minDate={addDays( checkInDate, 1 )}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        variant: "outlined",
                                        sx: {
                                            '& .MuiOutlinedInput-root': {
                                                ...inputStyle
                                            }
                                        }
                                    }
                                }}
                            />
                            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                                {format( checkOutDate, 'EEEE, MMMM d, yyyy' )}
                                <span style={{ marginLeft: 8, fontStyle: 'italic' }}>
                                    ({nights} {nights === 1 ? 'night' : 'nights'})
                                </span>
                            </Typography>
                        </Box>
                    </Box>

                    {/* Guests selector */}
                    <Box>
                        <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                            Number of Guests
                        </Typography>
                        <FormControl fullWidth variant="outlined">
                            <Select
                                value={guests}
                                onChange={handleGuestsChange}
                                sx={{ ...inputStyle }}
                                startAdornment={
                                    <InputAdornment position="start">
                                        <PersonIcon color="primary" />
                                    </InputAdornment>
                                }
                            >
                                {[ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16 ].map( ( num ) => (
                                    <MenuItem key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</MenuItem>
                                ) )}
                            </Select>
                        </FormControl>
                    </Box>
                </Box>
            </Paper>
        </LocalizationProvider>
    );
};

export default AirbnbDateSelector;