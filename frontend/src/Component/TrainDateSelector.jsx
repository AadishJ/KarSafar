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
    Grid2 as Grid,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { addDays, format } from 'date-fns';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

// Sample data - replace with actual train stations data
const popularStations = [
    { code: 'NDLS', name: 'New Delhi', fullName: 'New Delhi Railway Station' },
    { code: 'BCT', name: 'Mumbai Central', fullName: 'Mumbai Central Railway Station' },
    { code: 'HWH', name: 'Howrah', fullName: 'Howrah Junction Railway Station' },
    { code: 'MAS', name: 'Chennai Central', fullName: 'Chennai Central Railway Station' },
    { code: 'SBC', name: 'Bengaluru', fullName: 'KSR Bengaluru City Junction' },
    { code: 'CSTM', name: 'Mumbai CST', fullName: 'Chhatrapati Shivaji Terminus' },
    { code: 'BZA', name: 'Vijayawada', fullName: 'Vijayawada Junction Railway Station' },
    { code: 'BPL', name: 'Bhopal', fullName: 'Bhopal Junction Railway Station' },
    { code: 'CNB', name: 'Kanpur', fullName: 'Kanpur Central Railway Station' },
    { code: 'PNBE', name: 'Patna', fullName: 'Patna Junction Railway Station' },
    { code: 'ALD', name: 'Prayagraj', fullName: 'Prayagraj Junction' },
    { code: 'SDAH', name: 'Sealdah', fullName: 'Sealdah Railway Station' }
];

const TrainDateSelector = ( { onDateChange, onLocationChange, onClassChange } ) => {
    const today = new Date();
    const [ departureDate, setDepartureDate ] = useState( today );
    const [ returnDate, setReturnDate ] = useState( addDays( today, 7 ) );
    const [ isRoundTrip, setIsRoundTrip ] = useState( true );
    const [ source, setSource ] = useState( null );
    const [ destination, setDestination ] = useState( null );
    const [ travelClass, setTravelClass ] = useState( 'SL' ); // Default to Sleeper Class

    // Available train classes
    const trainClasses = [
        { value: '1A', label: '1st AC' },
        { value: '2A', label: '2nd AC' },
        { value: '3A', label: '3rd AC' },
        { value: 'SL', label: 'Sleeper' },
        { value: 'CC', label: 'Chair Car' },
        { value: '2S', label: '2nd Sitting' }
    ];

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

    const handleClassChange = ( event ) => {
        setTravelClass( event.target.value );

        onClassChange?.( event.target.value );
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
                                {isRoundTrip ? 'Return Journey' : 'One Way'}
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
                            options={popularStations}
                            getOptionLabel={( option ) => option ? `${ option.name } (${ option.code })` : ''}
                            renderInput={( params ) => (
                                <TextField
                                    {...params}
                                    placeholder="Select departure station"
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
                            options={popularStations}
                            getOptionLabel={( option ) => option ? `${ option.name } (${ option.code })` : ''}
                            renderInput={( params ) => (
                                <TextField
                                    {...params}
                                    placeholder="Select arrival station"
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

                {/* Travel Class Selection */}
                <div className="mb-6">
                    <Typography variant="subtitle2" className="mb-1 text-gray-700 font-medium">
                        Travel Class
                    </Typography>
                    <FormControl fullWidth sx={{ bgcolor: '#f9fafb' }}>
                        <Select
                            value={travelClass}
                            onChange={handleClassChange}
                            displayEmpty
                            variant="outlined"
                            size="medium"
                        >
                            {trainClasses.map( ( option ) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ) )}
                        </Select>
                    </FormControl>
                    <Typography variant="caption" className="text-gray-500 mt-1 block">
                        {trainClasses.find( c => c.value === travelClass )?.label || 'Select class'}
                    </Typography>
                </div>

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

export default TrainDateSelector;