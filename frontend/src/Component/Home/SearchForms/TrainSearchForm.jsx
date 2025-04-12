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
    IconButton
} from '@mui/material';
import {
    Search,
    LocationOn,
    SwapHoriz as SwapHorizIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addDays, format } from 'date-fns';

// Popular train stations
const popularStations = [
    { name: 'Delhi', code: 'NDLS', fullName: 'New Delhi Railway Station' },
    { name: 'Mumbai', code: 'CSTM', fullName: 'Chhatrapati Shivaji Terminus' },
    { name: 'Bangalore', code: 'SBC', fullName: 'Bangalore City Junction' },
    { name: 'Hyderabad', code: 'SC', fullName: 'Secunderabad Junction' },
    { name: 'Chennai', code: 'MAS', fullName: 'Chennai Central' },
    { name: 'Kolkata', code: 'HWH', fullName: 'Howrah Junction' },
    { name: 'Ahmedabad', code: 'ADI', fullName: 'Ahmedabad Junction' },
    { name: 'Jaipur', code: 'JP', fullName: 'Jaipur Junction' }
];

const TrainSearchForm = ( { onChange, onSearch } ) => {
    const today = new Date();
    const [ source, setSource ] = useState( null );
    const [ destination, setDestination ] = useState( null );
    const [ departureDate, setDepartureDate ] = useState( addDays( today, 1 ) );
    const navigate = useNavigate();

    // Common styles for inputs
    const inputStyle = {
        height: '65px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
        backgroundColor: '#f9fafb',
        border: '1px solid #f0f0f0',
        borderRadius: '4px'
    };

    const handleSourceChange = ( event, newValue ) => {
        setSource( newValue );
        onChange?.( {
            origin: newValue?.name || '',
            destination: destination?.name || '',
            departureDate
        } );
    };

    const handleDestinationChange = ( event, newValue ) => {
        setDestination( newValue );
        onChange?.( {
            origin: source?.name || '',
            destination: newValue?.name || '',
            departureDate
        } );
    };

    const handleDepartureDateChange = ( newDate ) => {
        setDepartureDate( newDate );
        onChange?.( {
            origin: source?.name || '',
            destination: destination?.name || '',
            departureDate: newDate
        } );
    };

    const handleSwapLocations = () => {
        const temp = source;
        setSource( destination );
        setDestination( temp );
        onChange?.( {
            origin: destination?.name || '',
            destination: source?.name || '',
            departureDate
        } );
    };

    const handleSearch = () => {
        if ( !source || !destination || !departureDate ) {
            alert( "Please select origin, destination and travel date" );
            return;
        }

        if ( onSearch ) {
            onSearch( {
                origin: source.name,
                destination: destination.name,
                departureDate
            } );
        } else {
            navigate( '/trains', {
                state: {
                    searchParams: {
                        origin: source.name,
                        destination: destination.name,
                        departureDate
                    }
                }
            } );
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'white' }}>
                    {/* Source and Destination row using flexbox */}
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            alignItems: 'center',
                            gap: 2
                        }}>
                            {/* Source field */}
                            <Box sx={{ width: { xs: '100%', md: '45%' } }}>
                                <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                                    From
                                </Typography>
                                <Autocomplete
                                    value={source}
                                    onChange={handleSourceChange}
                                    options={popularStations}
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
                                            placeholder="Select departure station"
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

                            {/* Swap button */}
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

                            {/* Destination field */}
                            <Box sx={{ width: { xs: '100%', md: '45%' } }}>
                                <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                                    To
                                </Typography>
                                <Autocomplete
                                    value={destination}
                                    onChange={handleDestinationChange}
                                    options={popularStations}
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
                                            placeholder="Select arrival station"
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
                        alignItems: 'flex-start',
                        mb: 4
                    }}>
                        {/* Departure date */}
                        <Box sx={{ width: '100%' }}>
                            <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                                Travel Date
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
                            Search Trains
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </LocalizationProvider>
    );
};

export default TrainSearchForm;