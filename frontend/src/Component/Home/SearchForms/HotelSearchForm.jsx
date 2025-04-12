import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Box,
    Button,
    Typography,
    Paper,
    Autocomplete,
    TextField,
    FormControlLabel,
    Switch,
    InputAdornment,
    IconButton,
    MenuItem,
    Select
} from '@mui/material';
import {
    Search,
    LocationOn,
    CalendarMonth,
    Person
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addDays, format } from 'date-fns';

// Example popular cities for hotels
const popularCities = [
    { name: 'Delhi', country: 'India' },
    { name: 'Mumbai', country: 'India' },
    { name: 'Bangalore', country: 'India' },
    { name: 'Hyderabad', country: 'India' },
    { name: 'Chennai', country: 'India' },
    { name: 'Kolkata', country: 'India' },
    { name: 'Jaipur', country: 'India' },
    { name: 'Goa', country: 'India' },
    { name: 'Pune', country: 'India' },
    { name: 'Ahmedabad', country: 'India' },
    { name: 'New York', country: 'USA' },
    { name: 'London', country: 'UK' },
    { name: 'Paris', country: 'France' },
    { name: 'Dubai', country: 'UAE' },
    { name: 'Singapore', country: 'Singapore' }
];

const HotelSearchForm = ( { onChange, onSearch } ) => {
    const today = new Date();
    const navigate = useNavigate();

    const [ city, setCity ] = useState( null );
    const [ checkIn, setCheckIn ] = useState( addDays( today, 1 ) );
    const [ checkOut, setCheckOut ] = useState( addDays( today, 2 ) );
    const [ guests, setGuests ] = useState( 2 );
    const [ rooms, setRooms ] = useState( 1 );

    // Common styles for inputs
    const inputStyle = {
        height: '65px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
        backgroundColor: '#f9fafb',
        border: '1px solid #f0f0f0',
        borderRadius: '4px'
    };

    const handleCityChange = ( event, newValue ) => {
        setCity( newValue );
        onChange?.( {
            city: newValue?.name || '',
            checkIn,
            checkOut,
            guests,
            rooms
        } );
    };

    const handleCheckInChange = ( newDate ) => {
        setCheckIn( newDate );
        if ( checkOut <= newDate ) {
            setCheckOut( addDays( newDate, 1 ) );
        }
        onChange?.( {
            city: city?.name || '',
            checkIn: newDate,
            checkOut: checkOut <= newDate ? addDays( newDate, 1 ) : checkOut,
            guests,
            rooms
        } );
    };

    const handleCheckOutChange = ( newDate ) => {
        setCheckOut( newDate );
        onChange?.( {
            city: city?.name || '',
            checkIn,
            checkOut: newDate,
            guests,
            rooms
        } );
    };

    const handleGuestsChange = ( event ) => {
        setGuests( event.target.value );
        onChange?.( {
            city: city?.name || '',
            checkIn,
            checkOut,
            guests: event.target.value,
            rooms
        } );
    };

    const handleRoomsChange = ( event ) => {
        setRooms( event.target.value );
        onChange?.( {
            city: city?.name || '',
            checkIn,
            checkOut,
            guests,
            rooms: event.target.value
        } );
    };

    const handleSearch = () => {
        if ( !city || !checkIn || !checkOut ) {
            alert( "Please select a city and dates" );
            return;
        }

        if ( onSearch ) {
            onSearch( {
                city: city.name,
                checkIn,
                checkOut,
                guests,
                rooms
            } );
        } else {
            navigate( '/hotels', {
                state: {
                    searchParams: {
                        city: city.name,
                        checkIn,
                        checkOut,
                        guests,
                        rooms
                    }
                }
            } );
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'white' }}>
                    {/* Location selection */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                            Destination
                        </Typography>
                        <Autocomplete
                            value={city}
                            onChange={handleCityChange}
                            options={popularCities}
                            getOptionLabel={( option ) => option ? `${ option.name }, ${ option.country }` : ''}
                            fullWidth
                            disablePortal
                            sx={{
                                width: '100%',
                                '& .MuiOutlinedInput-root': {
                                    ...inputStyle
                                }
                            }}
                            renderInput={( params ) => (
                                <TextField
                                    {...params}
                                    placeholder="Where do you want to stay?"
                                    fullWidth
                                    variant="outlined"
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LocationOn color="primary" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            )}
                            renderOption={( props, option ) => (
                                <Box component="li" {...props} sx={{ py: 2, px: 3 }}>
                                    <Box>
                                        <Typography sx={{ fontWeight: 600 }}>
                                            {option.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {option.country}
                                        </Typography>
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
                        alignItems: 'flex-start',
                        gap: 3,
                        mb: 4
                    }}>
                        {/* Check-in date */}
                        <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                            <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                                Check-in Date
                            </Typography>
                            <DatePicker
                                value={checkIn}
                                onChange={handleCheckInChange}
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
                                {format( checkIn, 'EEEE, MMMM d, yyyy' )}
                            </Typography>
                        </Box>

                        {/* Check-out date */}
                        <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                            <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                                Check-out Date
                            </Typography>
                            <DatePicker
                                value={checkOut}
                                onChange={handleCheckOutChange}
                                minDate={checkIn ? addDays( checkIn, 1 ) : addDays( today, 1 )}
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
                                {format( checkOut, 'EEEE, MMMM d, yyyy' )}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Guest Selection row */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: 'flex-start',
                        gap: 3,
                        mb: 4
                    }}>
                        {/* Guests */}
                        <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                            <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                                Guests
                            </Typography>
                            <TextField
                                select
                                fullWidth
                                value={guests}
                                onChange={handleGuestsChange}
                                variant="outlined"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        ...inputStyle
                                    }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Person color="primary" />
                                        </InputAdornment>
                                    )
                                }}
                            >
                                {[ 1, 2, 3, 4, 5, 6, 7, 8 ].map( ( num ) => (
                                    <MenuItem key={num} value={num}>
                                        {num} {num === 1 ? 'Guest' : 'Guests'}
                                    </MenuItem>
                                ) )}
                            </TextField>
                        </Box>

                        {/* Rooms */}
                        <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                            <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                                Rooms
                            </Typography>
                            <TextField
                                select
                                fullWidth
                                value={rooms}
                                onChange={handleRoomsChange}
                                variant="outlined"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        ...inputStyle
                                    }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <CalendarMonth color="primary" />
                                        </InputAdornment>
                                    )
                                }}
                            >
                                {[ 1, 2, 3, 4, 5 ].map( ( num ) => (
                                    <MenuItem key={num} value={num}>
                                        {num} {num === 1 ? 'Room' : 'Rooms'}
                                    </MenuItem>
                                ) )}
                            </TextField>
                        </Box>
                    </Box>

                    {/* Search button */}
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            onClick={handleSearch}
                            startIcon={<Search />}
                            sx={{
                                py: 1.8,
                                px: 4,
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                borderRadius: 1,
                                minWidth: { xs: '100%', sm: '200px' }
                            }}
                        >
                            Search Hotels
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </LocalizationProvider>
    );
};

export default HotelSearchForm;