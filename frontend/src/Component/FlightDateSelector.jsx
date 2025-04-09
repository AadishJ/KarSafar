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
    Grid,
    IconButton
} from '@mui/material';
import { addDays, format } from 'date-fns';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import popularAirports from '../assets/airports.json'; // Adjust the path as necessary

const FlightDateSelector = ( { onDateChange, onLocationChange } ) => {
    const today = new Date();
    const [ departureDate, setDepartureDate ] = useState( today );
    const [ returnDate, setReturnDate ] = useState( addDays( today, 7 ) );
    const [ isRoundTrip, setIsRoundTrip ] = useState( true );
    const [ source, setSource ] = useState( null );
    const [ destination, setDestination ] = useState( null );

    const handleDepartureDateChange = ( newDate ) => {
        setDepartureDate( newDate );

        // If return date is before the new departure date, update it
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

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box className="p-6 bg-white rounded-lg shadow-md">
                <div className="mb-4">
                    <FormControlLabel
                        control={
                            <Switch
                                checked={isRoundTrip}
                                onChange={handleTripTypeChange}
                                color="primary"
                            />
                        }
                        label={
                            <Typography variant="body1" className="font-medium">
                                {isRoundTrip ? 'Round Trip' : 'One Way'}
                            </Typography>
                        }
                    />
                </div>

                {/* Source and Destination Selection */}
                <Grid container spacing={2} className="mb-6">
                    <Grid item xs={12} md={5}>
                        <Typography variant="subtitle2" className="mb-1 text-gray-700 font-medium">
                            From
                        </Typography>
                        <Autocomplete
                            value={source}
                            onChange={handleSourceChange}
                            options={popularAirports}
                            getOptionLabel={( option ) => option ? `${ option.name } (${ option.code })` : ''}
                            renderInput={( params ) => (
                                <TextField
                                    {...params}
                                    placeholder="Select departure city"
                                    fullWidth
                                    variant="outlined"
                                    size="medium"
                                    sx={{ bgcolor: '#f9fafb' }}
                                />
                            )}
                            renderOption={( props, option ) => (
                                <li {...props}>
                                    <div>
                                        <Typography variant="body1">{option.name} ({option.code})</Typography>
                                        <Typography variant="caption" className="text-gray-500">
                                            {option.fullName}
                                        </Typography>
                                    </div>
                                </li>
                            )}
                        />
                    </Grid>

                    <Grid item xs={12} md={2} className="flex justify-center items-center">
                        <IconButton
                            onClick={handleSwapLocations}
                            className="bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
                            sx={{
                                mt: { xs: 0, md: 3 },
                                color: 'primary.main'
                            }}
                        >
                            <SwapHorizIcon />
                        </IconButton>
                    </Grid>

                    <Grid item xs={12} md={5}>
                        <Typography variant="subtitle2" className="mb-1 text-gray-700 font-medium">
                            To
                        </Typography>
                        <Autocomplete
                            value={destination}
                            onChange={handleDestinationChange}
                            options={popularAirports}
                            getOptionLabel={( option ) => option ? `${ option.name } (${ option.code })` : ''}
                            renderInput={( params ) => (
                                <TextField
                                    {...params}
                                    placeholder="Select arrival city"
                                    fullWidth
                                    variant="outlined"
                                    size="medium"
                                    sx={{ bgcolor: '#f9fafb' }}
                                />
                            )}
                            renderOption={( props, option ) => (
                                <li {...props}>
                                    <div>
                                        <Typography variant="body1">{option.name} ({option.code})</Typography>
                                        <Typography variant="caption" className="text-gray-500">
                                            {option.fullName}
                                        </Typography>
                                    </div>
                                </li>
                            )}
                        />
                    </Grid>
                </Grid>

                {/* Date Selection */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Typography variant="subtitle2" className="mb-1 text-gray-700 font-medium">
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
                                    size: "medium",
                                    sx: { bgcolor: '#f9fafb' }
                                }
                            }}
                        />
                        <Typography variant="caption" className="text-gray-500 mt-1 block">
                            {format( departureDate, 'EEEE, MMMM d, yyyy' )}
                        </Typography>
                    </div>

                    {isRoundTrip && (
                        <div className="flex-1">
                            <Typography variant="subtitle2" className="mb-1 text-gray-700 font-medium">
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
                                        size: "medium",
                                        sx: { bgcolor: '#f9fafb' }
                                    }
                                }}
                            />
                            <Typography variant="caption" className="text-gray-500 mt-1 block">
                                {format( returnDate, 'EEEE, MMMM d, yyyy' )}
                            </Typography>
                        </div>
                    )}
                </div>
            </Box>
        </LocalizationProvider>
    );
};

export default FlightDateSelector;