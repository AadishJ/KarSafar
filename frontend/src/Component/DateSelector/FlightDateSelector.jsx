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
    InputAdornment
} from '@mui/material';
import { addDays, format } from 'date-fns';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import FlightTakeoff from '@mui/icons-material/FlightTakeoff';
import FlightLand from '@mui/icons-material/FlightLand';
import popularAirports from '../../assets/airports.json';

const FlightDateSelector = ( { onDateChange, onLocationChange } ) => {
    const today = new Date();
    const [ departureDate, setDepartureDate ] = useState(addDays( today, 1 ));
    const [ returnDate, setReturnDate ] = useState( addDays( today, 7 ) );
    const [ isRoundTrip, setIsRoundTrip ] = useState( true );
    const [ source, setSource ] = useState( null );
    const [ destination, setDestination ] = useState( null );

    const handleDepartureDateChange = ( newDate ) => {
        setDepartureDate( newDate );
        if ( returnDate < newDate ) {
            setReturnDate( newDate );
        }
        onDateChange?.( {
            departureDate: newDate,
            returnDate: isRoundTrip ? returnDate < newDate ? newDate : returnDate : null,
            isRoundTrip
        } );
    };

    const handleReturnDateChange = ( newDate ) => {
        setReturnDate( newDate );
        onDateChange?.( {
            departureDate,
            returnDate: newDate,
            isRoundTrip
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

    const handleSourceChange = ( event, newValue ) => {
        setSource( newValue );
        onLocationChange?.( {
            source: newValue,
            destination
        } );
    };

    const handleDestinationChange = ( event, newValue ) => {
        setDestination( newValue );
        onLocationChange?.( {
            source,
            destination: newValue
        } );
    };

    const handleSwapLocations = () => {
        const temp = source;
        setSource( destination );
        setDestination( temp );
        onLocationChange?.( {
            source: destination,
            destination: source
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
                                {isRoundTrip ? 'Round Trip' : 'One Way'}
                            </Typography>
                        }
                        sx={{ mb: 3, display: 'block' }}
                    />

                    {/* Source and Destination row using flexbox */}
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            alignItems: 'center',
                            gap: 2
                        }}>
                            {/* Source field - takes 45% on desktop */}
                            <Box sx={{ width: { xs: '100%', md: '45%' } }}>
                                <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                                    From
                                </Typography>
                                <Autocomplete
                                    value={source}
                                    onChange={handleSourceChange}
                                    options={popularAirports}
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
                                            placeholder="Select departure city"
                                            fullWidth
                                            variant="outlined"
                                            InputProps={{
                                                ...params.InputProps,
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <FlightTakeoff color="primary" />
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

                            {/* Swap button - fixed width */}
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                width: { xs: '100%', md: '10%' },
                                mt: { xs: 0, md: 4 }
                            }}>
                                <IconButton
                                    onClick={handleSwapLocations}
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

                            {/* Destination field - takes 45% on desktop */}
                            <Box sx={{ width: { xs: '100%', md: '45%' } }}>
                                <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                                    To
                                </Typography>
                                <Autocomplete
                                    value={destination}
                                    onChange={handleDestinationChange}
                                    options={popularAirports}
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
                                            placeholder="Select arrival city"
                                            fullWidth
                                            variant="outlined"
                                            InputProps={{
                                                ...params.InputProps,
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <FlightLand color="primary" />
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

                    {/* Date Selection row using flexbox */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: 3
                    }}>
                        {/* Departure date - full width or 50% */}
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

                        {/* Return date - 50% width when round trip */}
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
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Paper>
        </LocalizationProvider>
    );
};

export default FlightDateSelector;