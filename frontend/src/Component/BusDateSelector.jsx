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

// Sample bus cities data - replace with actual data from your backend
const popularCities = [
    { id: 'DEL', name: 'Delhi', region: 'NCR' },
    { id: 'MUM', name: 'Mumbai', region: 'Maharashtra' },
    { id: 'BLR', name: 'Bangalore', region: 'Karnataka' },
    { id: 'HYD', name: 'Hyderabad', region: 'Telangana' },
    { id: 'CHN', name: 'Chennai', region: 'Tamil Nadu' },
    { id: 'KOL', name: 'Kolkata', region: 'West Bengal' },
    { id: 'PUN', name: 'Pune', region: 'Maharashtra' },
    { id: 'JAI', name: 'Jaipur', region: 'Rajasthan' },
    { id: 'AHD', name: 'Ahmedabad', region: 'Gujarat' },
    { id: 'LKW', name: 'Lucknow', region: 'Uttar Pradesh' },
    { id: 'NGP', name: 'Nagpur', region: 'Maharashtra' },
    { id: 'CDB', name: 'Chandigarh', region: 'Punjab/Haryana' }
];

// Bus seat types
const busTypes = [
    { value: 'AC_SLEEPER', label: 'AC Sleeper' },
    { value: 'NON_AC_SLEEPER', label: 'Non-AC Sleeper' },
    { value: 'AC_SEATER', label: 'AC Seater' },
    { value: 'NON_AC_SEATER', label: 'Non-AC Seater' },
    { value: 'VOLVO', label: 'Volvo' },
    { value: 'DELUXE', label: 'Deluxe' }
];

const BusDateSelector = ( { onDateChange, onLocationChange, onBusTypeChange } ) => {
    const today = new Date();
    const [ departureDate, setDepartureDate ] = useState( today );
    const [ returnDate, setReturnDate ] = useState( addDays( today, 3 ) ); // Shorter default for bus trips
    const [ isRoundTrip, setIsRoundTrip ] = useState( false ); // Default to one-way for buses
    const [ source, setSource ] = useState( null );
    const [ destination, setDestination ] = useState( null );
    const [ busType, setBusType ] = useState( '' );

    const handleDepartureDateChange = ( newDate ) => {
        setDepartureDate( newDate );

        // If return date is before the new departure date, update it
        if ( returnDate < newDate ) {
            setReturnDate( newDate );
        }

        onDateChange?.( {
            departureDate: newDate,
            returnDate: isRoundTrip ? ( returnDate < newDate ? newDate : returnDate ) : null,
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

    const handleBusTypeChange = ( event ) => {
        setBusType( event.target.value );
        onBusTypeChange?.( event.target.value );
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
                            options={popularCities}
                            getOptionLabel={( option ) => option ? `${ option.name }, ${ option.region }` : ''}
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
                                    <Typography variant="body1">{option.name}</Typography>
                                    <Typography variant="caption" className="text-gray-500 ml-1">
                                        {option.region}
                                    </Typography>
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
                            options={popularCities}
                            getOptionLabel={( option ) => option ? `${ option.name }, ${ option.region }` : ''}
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
                                    <Typography variant="body1">{option.name}</Typography>
                                    <Typography variant="caption" className="text-gray-500 ml-1">
                                        {option.region}
                                    </Typography>
                                </li>
                            )}
                        />
                    </Grid>
                </Grid>

                {/* Bus Type Selection */}
                <div className="mb-6">
                    <Typography variant="subtitle2" className="mb-1 text-gray-700 font-medium">
                        Bus Type (Optional)
                    </Typography>
                    <FormControl fullWidth sx={{ bgcolor: '#f9fafb' }}>
                        <Select
                            value={busType}
                            onChange={handleBusTypeChange}
                            displayEmpty
                            variant="outlined"
                            size="medium"
                        >
                            <MenuItem value="">
                                <em>All Bus Types</em>
                            </MenuItem>
                            {busTypes.map( ( option ) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ) )}
                        </Select>
                    </FormControl>
                    <Typography variant="caption" className="text-gray-500 mt-1 block">
                        {busType ? busTypes.find( b => b.value === busType )?.label : 'Select bus type or leave empty for all types'}
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

export default BusDateSelector;