import React, { useState } from 'react';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
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
    Grid
} from '@mui/material';
import { addDays, addHours, format, setHours, setMinutes } from 'date-fns';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PlaceIcon from '@mui/icons-material/Place';
import CabIcon from '@mui/icons-material/LocalTaxi';
import ScheduleIcon from '@mui/icons-material/Schedule';
import cabStops from '../../assets/cabStops.json';

const CabDateSelector = ( { onDateChange, onLocationChange } ) => {
    const today = new Date();
    // Set default pickup time 2 hours from now
    const defaultPickupTime = addHours( today, 2 );

    const [ pickupDate, setPickupDate ] = useState( defaultPickupTime );
    const [ pickupTime, setPickupTime ] = useState( defaultPickupTime );
    const [ returnDate, setReturnDate ] = useState( addDays( today, 1 ) );
    const [ isRoundTrip, setIsRoundTrip ] = useState( false );
    const [ source, setSource ] = useState( null );
    const [ destination, setDestination ] = useState( null );

    const handlePickupDateChange = ( newDate ) => {
        setPickupDate( newDate );
        const combinedDateTime = combineDateTime( newDate, pickupTime );

        if ( returnDate < combinedDateTime ) {
            setReturnDate( addDays( combinedDateTime, 1 ) );
        }

        onDateChange?.( {
            departureDate: combinedDateTime,
            returnDate: isRoundTrip ? returnDate < combinedDateTime ? addDays( combinedDateTime, 1 ) : returnDate : null,
            isRoundTrip
        } );
    };

    const handlePickupTimeChange = ( newTime ) => {
        setPickupTime( newTime );
        const combinedDateTime = combineDateTime( pickupDate, newTime );

        onDateChange?.( {
            departureDate: combinedDateTime,
            returnDate: isRoundTrip ? returnDate : null,
            isRoundTrip
        } );
    };

    // Combine date and time into a single Date object
    const combineDateTime = ( date, time ) => {
        if ( !date || !time ) return date;
        const combined = new Date( date );
        combined.setHours( time.getHours() );
        combined.setMinutes( time.getMinutes() );
        return combined;
    };

    const handleReturnDateChange = ( newDate ) => {
        setReturnDate( newDate );
        onDateChange?.( {
            departureDate: combineDateTime( pickupDate, pickupTime ),
            returnDate: newDate,
            isRoundTrip
        } );
    };

    const handleTripTypeChange = ( event ) => {
        const newIsRoundTrip = event.target.checked;
        setIsRoundTrip( newIsRoundTrip );
        onDateChange?.( {
            departureDate: combineDateTime( pickupDate, pickupTime ),
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
                                    Pickup Location
                                </Typography>
                                <Autocomplete
                                    value={source}
                                    onChange={handleSourceChange}
                                    options={cabStops}
                                    getOptionLabel={( option ) => option ? `${ option.name }` : ''}
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
                                                        <LocationOnIcon color="primary" />
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
                                                    {option.address}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                    ListboxProps={{
                                        sx: { maxHeight: '350px', py: 1 }
                                    }}
                                    groupBy={( option ) => option.city}
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
                                    Drop Location
                                </Typography>
                                <Autocomplete
                                    value={destination}
                                    onChange={handleDestinationChange}
                                    options={cabStops}
                                    getOptionLabel={( option ) => option ? `${ option.name }` : ''}
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
                                            placeholder="Enter drop location"
                                            fullWidth
                                            variant="outlined"
                                            InputProps={{
                                                ...params.InputProps,
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <PlaceIcon color="primary" />
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
                                                    {option.address}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                    ListboxProps={{
                                        sx: { maxHeight: '350px', py: 1 }
                                    }}
                                    groupBy={( option ) => option.city}
                                />
                            </Box>
                        </Box>
                    </Box>

                    {/* Date and Time Selection */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ mb: 2, color: 'text.secondary', fontWeight: 500 }}>
                            Pickup Details
                        </Typography>

                        <Grid container spacing={3}>
                            {/* Pickup date */}
                            <Grid item xs={12} md={6}>
                                <DatePicker
                                    label="Pickup Date"
                                    value={pickupDate}
                                    onChange={handlePickupDateChange}
                                    minDate={today}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            variant: "outlined",
                                            InputProps: {
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <CabIcon color="primary" />
                                                    </InputAdornment>
                                                ),
                                            },
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
                            </Grid>

                            {/* Pickup time */}
                            <Grid item xs={12} md={6}>
                                <TimePicker
                                    label="Pickup Time"
                                    value={pickupTime}
                                    onChange={handlePickupTimeChange}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            variant: "outlined",
                                            InputProps: {
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <ScheduleIcon color="primary" />
                                                    </InputAdornment>
                                                ),
                                            },
                                            sx: {
                                                '& .MuiOutlinedInput-root': {
                                                    ...inputStyle
                                                }
                                            }
                                        }
                                    }}
                                />
                                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                                    Estimated arrival time: {format( addHours( pickupTime, 1 ), 'hh:mm a' )}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Return date - only when round trip is selected */}
                    {isRoundTrip && (
                        <Box sx={{ mt: 4 }}>
                            <Typography variant="subtitle1" sx={{ mb: 2, color: 'text.secondary', fontWeight: 500 }}>
                                Return Details
                            </Typography>

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <DatePicker
                                        label="Return Date"
                                        value={returnDate}
                                        onChange={handleReturnDateChange}
                                        minDate={combineDateTime( pickupDate, pickupTime )}
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                variant: "outlined",
                                                InputProps: {
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <CabIcon color="primary" />
                                                        </InputAdornment>
                                                    ),
                                                },
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
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </Box>
            </Paper>
        </LocalizationProvider>
    );
};

export default CabDateSelector;