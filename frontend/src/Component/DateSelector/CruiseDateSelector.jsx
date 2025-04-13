import React, { useState } from 'react';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import {
    TextField,
    FormControlLabel,
    Switch,
    Box,
    Typography,
    Autocomplete,
    IconButton,
    Paper,
    InputAdornment,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import { addDays, format } from 'date-fns';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import LocationOn from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import cruisePorts from '../../assets/cruisePorts.json';

const CruiseDateSelector = ( { onDateChange, onLocationChange, onDurationChange } ) => {
    const today = new Date();
    const [ departureDate, setDepartureDate ] = useState( addDays( today, 14 ) ); // Cruises typically need more lead time
    const [ returnDate, setReturnDate ] = useState( addDays( today, 21 ) );
    const [ isRoundTrip, setIsRoundTrip ] = useState( true );
    const [ departurePort, setDeparturePort ] = useState( null );
    const [ destinationPort, setDestinationPort ] = useState( null );
    const [ duration, setDuration ] = useState( 7 ); // Default cruise duration in days

    const durations = [
        { value: 2, label: '2-3 Days (Weekend Cruise)' },
        { value: 4, label: '4-5 Days (Short Cruise)' },
        { value: 7, label: '7 Days (1 Week)' },
        { value: 10, label: '10-12 Days (Extended Cruise)' },
        { value: 14, label: '14 Days (2 Weeks)' },
        { value: 21, label: '21+ Days (Long Voyage)' }
    ];

    const handleDepartureDateChange = ( newDate ) => {
        setDepartureDate( newDate );
        // Calculate new return date based on duration
        const calculatedReturnDate = addDays( newDate, duration );
        setReturnDate( calculatedReturnDate );

        onDateChange?.( {
            departureDate: newDate,
            returnDate: isRoundTrip ? calculatedReturnDate : null,
            isRoundTrip
        } );
    };

    const handleReturnDateChange = ( newDate ) => {
        setReturnDate( newDate );
        // Calculate new duration based on new return date
        const days = Math.round( ( newDate - departureDate ) / ( 1000 * 60 * 60 * 24 ) );
        setDuration( days );

        onDateChange?.( {
            departureDate,
            returnDate: newDate,
            isRoundTrip,
            duration: days
        } );

        onDurationChange?.( {
            duration: days
        } );
    };

    const handleTripTypeChange = ( event ) => {
        const newIsRoundTrip = event.target.checked;
        setIsRoundTrip( newIsRoundTrip );

        onDateChange?.( {
            departureDate,
            returnDate: newIsRoundTrip ? returnDate : null,
            isRoundTrip: newIsRoundTrip
        } );
    };

    const handleDeparturePortChange = ( event, newValue ) => {
        setDeparturePort( newValue );

        onLocationChange?.( {
            departurePort: newValue,
            destinationPort
        } );
    };

    const handleDestinationPortChange = ( event, newValue ) => {
        setDestinationPort( newValue );

        onLocationChange?.( {
            departurePort,
            destinationPort: newValue
        } );
    };

    const handleSwapPorts = () => {
        const temp = departurePort;
        setDeparturePort( destinationPort );
        setDestinationPort( temp );

        onLocationChange?.( {
            departurePort: destinationPort,
            destinationPort: departurePort
        } );
    };

    const handleDurationChange = ( event ) => {
        const newDuration = event.target.value;
        setDuration( newDuration );

        // Update return date based on new duration
        const newReturnDate = addDays( departureDate, newDuration );
        setReturnDate( newReturnDate );

        onDateChange?.( {
            departureDate,
            returnDate: isRoundTrip ? newReturnDate : null,
            isRoundTrip
        } );

        onDurationChange?.( {
            duration: newDuration
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
                    {/* Trip type switch */}
                    <FormControlLabel
                        control={
                            <Switch
                                checked={isRoundTrip}
                                onChange={handleTripTypeChange}
                                color="primary"
                            />
                        }
                        label={
                            <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                {isRoundTrip ? 'Round Trip' : 'One Way Cruise'}
                            </Typography>
                        }
                        sx={{ mb: 3, display: 'block' }}
                    />

                    {/* Departure and Destination ports row */}
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            alignItems: 'center',
                            gap: 2
                        }}>
                            {/* Departure Port field */}
                            <Box sx={{ width: { xs: '100%', md: '45%' } }}>
                                <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                                    Departure Port
                                </Typography>
                                <Autocomplete
                                    value={departurePort}
                                    onChange={handleDeparturePortChange}
                                    options={cruisePorts}
                                    getOptionLabel={( option ) => option ? `${ option.name } (${ option.code })` : ''}
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
                                            placeholder="Select departure port"
                                            fullWidth
                                            variant="outlined"
                                            InputProps={{
                                                ...params.InputProps,
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <DirectionsBoatIcon color="primary" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    )}
                                    renderOption={( props, option ) => (
                                        <Box component="li" {...props} sx={{ py: 2, px: 3 }}>
                                            <Box>
                                                <Typography sx={{ fontWeight: 600 }}>
                                                    {option.name} ({option.code})
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {option.city}, {option.state}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                    ListboxProps={{
                                        sx: { maxHeight: '350px', py: 1 }
                                    }}
                                />
                            </Box>

                            {/* Swap button */}
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                width: { xs: '100%', md: '10%' },
                                mt: { xs: 0, md: 4 }
                            }}>
                                <IconButton
                                    onClick={handleSwapPorts}
                                    sx={{
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        p: { xs: 1.5, md: 2 },
                                        '&:hover': {
                                            bgcolor: 'primary.dark',
                                        },
                                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                                        transform: { xs: 'rotate(90deg)', md: 'rotate(0)' },
                                    }}
                                >
                                    <SwapHorizIcon fontSize="medium" />
                                </IconButton>
                            </Box>

                            {/* Destination Port field */}
                            <Box sx={{ width: { xs: '100%', md: '45%' } }}>
                                <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                                    Destination Port
                                </Typography>
                                <Autocomplete
                                    value={destinationPort}
                                    onChange={handleDestinationPortChange}
                                    options={cruisePorts}
                                    getOptionLabel={( option ) => option ? `${ option.name } (${ option.code })` : ''}
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
                                            placeholder="Select destination port"
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
                                                    {option.name} ({option.code})
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {option.city}, {option.state}
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

                    {/* Cruise duration selection */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                            Cruise Duration
                        </Typography>
                        <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { ...inputStyle } }}>
                            <InputLabel id="cruise-duration-label">Select Duration</InputLabel>
                            <Select
                                labelId="cruise-duration-label"
                                id="cruise-duration"
                                value={duration}
                                onChange={handleDurationChange}
                                label="Select Duration"
                                startAdornment={
                                    <InputAdornment position="start">
                                        <AccessTimeIcon color="primary" />
                                    </InputAdornment>
                                }
                            >
                                {durations.map( ( option ) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ) )}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Date Selection row */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: 3
                    }}>
                        {/* Departure date */}
                        <Box sx={{
                            width: { xs: '100%', md: isRoundTrip ? '50%' : '100%' }
                        }}>
                            <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                                Departure Date
                            </Typography>
                            <DatePicker
                                value={departureDate}
                                onChange={handleDepartureDateChange}
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
                                {format( departureDate, 'EEEE, MMMM d, yyyy' )}
                            </Typography>
                        </Box>

                        {/* Return date - shown when round trip is selected */}
                        {isRoundTrip && (
                            <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                                <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                                    Return Date
                                </Typography>
                                <DatePicker
                                    value={returnDate}
                                    onChange={handleReturnDateChange}
                                    minDate={departureDate}
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
                                    {format( returnDate, 'EEEE, MMMM d, yyyy' )}
                                    <span style={{ fontStyle: 'italic', marginLeft: 8 }}>
                                        ({Math.round( ( returnDate - departureDate ) / ( 1000 * 60 * 60 * 24 ) )} days)
                                    </span>
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Paper>
        </LocalizationProvider>
    );
};

export default CruiseDateSelector;