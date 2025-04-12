import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Typography,
    Paper,
    Autocomplete,
    TextField,
    InputAdornment,
    MenuItem,
    Select,
    FormControl
} from '@mui/material';
import {
    Search,
    LocationOn,
    AccessTime
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addDays, addHours, format, setHours } from 'date-fns';

// Popular cities for cabs
const popularCities = [
    { name: 'Delhi', fullName: 'Delhi, NCR' },
    { name: 'Mumbai', fullName: 'Mumbai, Maharashtra' },
    { name: 'Bangalore', fullName: 'Bangalore, Karnataka' },
    { name: 'Hyderabad', fullName: 'Hyderabad, Telangana' },
    { name: 'Chennai', fullName: 'Chennai, Tamil Nadu' },
    { name: 'Kolkata', fullName: 'Kolkata, West Bengal' },
    { name: 'Ahmedabad', fullName: 'Ahmedabad, Gujarat' },
    { name: 'Pune', fullName: 'Pune, Maharashtra' }
];

const CabSearchForm = ( { onChange, onSearch } ) => {
    const today = new Date();
    const tomorrow = addDays( today, 1 );
    const [ pickupLocation, setPickupLocation ] = useState( null );
    const [ destination, setDestination ] = useState( null );
    const [ pickupDate, setPickupDate ] = useState( tomorrow );
    const [ pickupTime, setPickupTime ] = useState( setHours( tomorrow, 9 ) ); // 9 AM tomorrow
    const navigate = useNavigate();

    // Common styles for inputs
    const inputStyle = {
        height: '65px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
        backgroundColor: '#f9fafb',
        border: '1px solid #f0f0f0',
        borderRadius: '4px'
    };

    const handlePickupLocationChange = ( event, newValue ) => {
        setPickupLocation( newValue );
        onChange?.( {
            pickupLocation: newValue?.name || '',
            destination: destination?.name || '',
            pickupDate,
            pickupTime
        } );
    };

    const handleDestinationChange = ( event, newValue ) => {
        setDestination( newValue );
        onChange?.( {
            pickupLocation: pickupLocation?.name || '',
            destination: newValue?.name || '',
            pickupDate,
            pickupTime
        } );
    };

    const handlePickupDateChange = ( newDate ) => {
        setPickupDate( newDate );
        onChange?.( {
            pickupLocation: pickupLocation?.name || '',
            destination: destination?.name || '',
            pickupDate: newDate,
            pickupTime
        } );
    };

    const handlePickupTimeChange = ( newTime ) => {
        setPickupTime( newTime );
        onChange?.( {
            pickupLocation: pickupLocation?.name || '',
            destination: destination?.name || '',
            pickupDate,
            pickupTime: newTime
        } );
    };

    const handleSearch = () => {
        if ( !pickupLocation || !destination || !pickupDate || !pickupTime ) {
            alert( "Please fill all required fields" );
            return;
        }

        if ( onSearch ) {
            onSearch( {
                pickupLocation: pickupLocation.name,
                destination: destination.name,
                pickupDate,
                pickupTime
            } );
        } else {
            navigate( '/cabs', {
                state: {
                    searchParams: {
                        pickupLocation: pickupLocation.name,
                        destination: destination.name,
                        pickupDate,
                        pickupTime
                    }
                }
            } );
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'white' }}>
                    {/* Locations row using flexbox */}
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            gap: 2
                        }}>
                            {/* Pickup Location field */}
                            <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                                <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                                    Pickup Location
                                </Typography>
                                <Autocomplete
                                    value={pickupLocation}
                                    onChange={handlePickupLocationChange}
                                    options={popularCities}
                                    getOptionLabel={( option ) => option ? option.name : ''}
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
                                            placeholder="Enter pickup location"
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
                                                    {option.fullName}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                    ListboxProps={{
                                        sx: { maxHeight: '350px', py: 1 }
                                    }}
                                />
                            </Box>

                            {/* Destination field */}
                            <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                                <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                                    Destination
                                </Typography>
                                <Autocomplete
                                    value={destination}
                                    onChange={handleDestinationChange}
                                    options={popularCities}
                                    getOptionLabel={( option ) => option ? option.name : ''}
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
                                            placeholder="Enter destination"
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
                                                    {option.fullName}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                    ListboxProps={{
                                        sx: { maxHeight: '350px', py: 1 }
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>

                    {/* Date and Time Selection row */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: 'flex-start',
                        gap: 3,
                        mb: 4
                    }}>
                        {/* Pickup date */}
                        <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                            <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                                Pickup Date
                            </Typography>
                            <DatePicker
                                value={pickupDate}
                                onChange={handlePickupDateChange}
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
                                {format( pickupDate, 'EEEE, MMMM d, yyyy' )}
                            </Typography>
                        </Box>

                        {/* Pickup time */}
                        <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                            <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                                Pickup Time
                            </Typography>
                            <TimePicker
                                value={pickupTime}
                                onChange={handlePickupTimeChange}
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
                                {format( pickupTime, 'h:mm a' )}
                            </Typography>
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
                            Search Cabs
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </LocalizationProvider>
    );
};

export default CabSearchForm;