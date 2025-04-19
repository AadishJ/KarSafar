import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Paper,
    Grid,
    Button,
    Divider,
    CircularProgress,
    Chip,
    Card,
    CardContent,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Radio,
    RadioGroup,
    FormControlLabel
} from '@mui/material';
import axiosInstance from '../../Config/axiosInstance';
import { format, parseISO } from 'date-fns';
import {
    FlightTakeoff,
    FlightLand,
    AccessTime,
    AirlineSeatReclineNormal,
    Flight as FlightIcon,
    ArrowBack,
    LuggageOutlined,
    Restaurant,
    Wifi,
    Power
} from '@mui/icons-material';

const FlightId = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ flight, setFlight ] = useState( null );
    const [ loading, setLoading ] = useState( true );
    const [ error, setError ] = useState( null );
    const [ selectedCoach, setSelectedCoach ] = useState( null );

    useEffect( () => {
        const fetchFlightDetails = async () => {
            try {
                setLoading( true );
                const response = await axiosInstance.get( `/flight/${ id }` );

                if ( response.data.success ) {
                    const flightData = response.data.data;

                    // Adjust data to match component expectations
                    // The API returns 'route' but the component expects 'stations'
                    const processedData = {
                        ...flightData,
                        stations: flightData.route || []
                    };

                    setFlight( processedData );

                    // Auto-select the first coach type
                    if ( flightData.coaches && flightData.coaches.length > 0 ) {
                        setSelectedCoach( flightData.coaches[ 0 ].coachId );
                    }
                } else {
                    setError( 'Failed to fetch flight details' );
                }
            } catch ( err ) {
                console.error( 'Error fetching flight details:', err );
                setError( 'An error occurred while retrieving flight information' );
            } finally {
                setLoading( false );
            }
        };

        if ( id ) {
            fetchFlightDetails();
        }
    }, [ id ] );

    // Format price with Indian Rupee symbol
    const formatPrice = ( price ) => {
        return new Intl.NumberFormat( 'en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        } ).format( price );
    };

    // Format date and time
    const formatDateTime = ( dateTimeStr ) => {
        if ( !dateTimeStr ) return '';
        try {
            const date = parseISO( dateTimeStr );
            return format( date, 'MMM dd, yyyy h:mm a' );
        } catch ( e ) {
            console.error( 'Date parsing error:', e );
            return dateTimeStr;
        }
    };

    // Calculate duration between two datetime strings
    const calculateDuration = ( startTime, endTime ) => {
        if ( !startTime || !endTime ) return '';
        try {
            const start = parseISO( startTime );
            const end = parseISO( endTime );
            const diffMs = end - start;
            const hours = Math.floor( diffMs / ( 1000 * 60 * 60 ) );
            const minutes = Math.floor( ( diffMs % ( 1000 * 60 * 60 ) ) / ( 1000 * 60 ) );
            return `${ hours }h ${ minutes }m`;
        } catch ( e ) {
            console.error( 'Duration calculation error:', e );
            return '';
        }
    };

    const handleCoachSelect = ( event ) => {
        setSelectedCoach( event.target.value );
    };

    const handleBooking = () => {
        if ( !selectedCoach ) {
            alert( 'Please select a coach class' );
            return;
        }
        // Navigate to booking page with flight and coach info
        navigate( `/booking/flight/${ id }`, {
            state: {
                flightId: id,
                coachId: selectedCoach,
                selectedCoach: flight.coaches.find( coach => coach.coachId === selectedCoach )
            }
        } );
    };

    const goBack = () => {
        navigate( -1 );
    };

    if ( loading ) {
        return (
            <Container>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if ( error ) {
        return (
            <Container>
                <Button startIcon={<ArrowBack />} onClick={goBack} sx={{ mb: 3 }}>
                    Back to Search
                </Button>
                <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="error" variant="h6">
                        {error}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        Unable to load flight details. Please try again later.
                    </Typography>
                </Paper>
            </Container>
        );
    }

    if ( !flight ) {
        return (
            <Container>
                <Button startIcon={<ArrowBack />} onClick={goBack} sx={{ mb: 3 }}>
                    Back to Search
                </Button>
                <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6">
                        Flight Not Found
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        The requested flight could not be found.
                    </Typography>
                </Paper>
            </Container>
        );
    }

    // Get the first and last stations
    const stations = flight.stations || [];
    const departureStation = stations.find( station => station.stationOrder === 1 );
    const arrivalStation = stations.length > 0
        ? stations.reduce( ( prev, current ) => ( prev.stationOrder > current.stationOrder ) ? prev : current )
        : null;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Button startIcon={<ArrowBack />} onClick={goBack} sx={{ mb: 3 }}>
                Back to Search
            </Button>

            <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
                Flight Details
            </Typography>

            {/* Flight Summary Card */}
            <Paper elevation={3} sx={{ mb: 4, p: 3, borderRadius: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={5}>
                        <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                            <FlightIcon color="primary" sx={{ mr: 1, fontSize: 40 }} />
                            <Box>
                                <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                                    {flight.flightName}
                                </Typography>
                                <Chip
                                    size="small"
                                    label={flight.status}
                                    color={flight.status === 'active' ? 'success' : 'default'}
                                    sx={{ mt: 0.5 }}
                                />
                            </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Flight ID: {flight.flightId ? flight.flightId.substring( 0, 8 ) : id.substring( 0, 8 )}...
                        </Typography>
                    </Grid>

                    <Grid item xs={12} md={7}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                            <Box>
                                <Typography variant="h6" component="p" sx={{ fontWeight: 'bold' }}>
                                    {departureStation ? formatDateTime( departureStation.departureTime ).split( ',' )[ 1 ] : ''}
                                </Typography>
                                <Typography variant="body1">
                                    {departureStation ? departureStation.stationName : ''}
                                </Typography>
                            </Box>

                            <Box display="flex" flexDirection="column" alignItems="center" sx={{ mx: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    {departureStation && arrivalStation
                                        ? calculateDuration( departureStation.departureTime, arrivalStation.arrivalTime )
                                        : ''}
                                </Typography>
                                <Box sx={{ width: '100%', height: '2px', bgcolor: 'grey.300', my: 0.5 }} />
                                <Typography variant="body2" color="text.secondary">
                                    {stations.length > 2 ? `${ stations.length - 2 } stops` : 'Direct'}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="h6" component="p" sx={{ fontWeight: 'bold' }}>
                                    {arrivalStation ? formatDateTime( arrivalStation.arrivalTime ).split( ',' )[ 1 ] : ''}
                                </Typography>
                                <Typography variant="body1">
                                    {arrivalStation ? arrivalStation.stationName : ''}
                                </Typography>
                            </Box>
                        </Box>

                        <Box display="flex" alignItems="center" sx={{ mt: 1.5 }}>
                            <AccessTime fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                                {departureStation?.departureTime ? formatDateTime( departureStation.departureTime ).split( ',' )[ 0 ] : ''}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Flight Route */}
            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Flight Route
            </Typography>

            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Stepper orientation="vertical">
                    {stations.map( ( station, index ) => (
                        <Step key={index} active={true}>
                            <StepLabel>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                    {station.stationName}
                                </Typography>
                            </StepLabel>
                            <StepContent>
                                <Box sx={{ mb: 2 }}>
                                    {station.arrivalTime && (
                                        <Typography variant="body2">
                                            <FlightLand fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                                            Arrival: {formatDateTime( station.arrivalTime )}
                                        </Typography>
                                    )}

                                    {station.stoppage > 0 && (
                                        <Typography variant="body2" sx={{ my: 1, color: 'warning.main' }}>
                                            <AccessTime fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                                            Stoppage: {station.stoppage} minutes
                                        </Typography>
                                    )}

                                    {station.departureTime && (
                                        <Typography variant="body2">
                                            <FlightTakeoff fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                                            Departure: {formatDateTime( station.departureTime )}
                                        </Typography>
                                    )}
                                </Box>
                            </StepContent>
                        </Step>
                    ) )}
                </Stepper>
            </Paper>

            {/* Coach Selection */}
            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Select Coach Class
            </Typography>

            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <RadioGroup
                    value={selectedCoach}
                    onChange={handleCoachSelect}
                >
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Select</TableCell>
                                    <TableCell>Class</TableCell>
                                    <TableCell>Amenities</TableCell>
                                    <TableCell>Available Seats</TableCell>
                                    <TableCell>Price</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {flight.coaches && flight.coaches.map( ( coach ) => (
                                    <TableRow
                                        key={coach.coachId}
                                        sx={{
                                            '&:hover': { bgcolor: 'action.hover' },
                                            bgcolor: selectedCoach === coach.coachId ? 'action.selected' : 'inherit'
                                        }}
                                    >
                                        <TableCell>
                                            <FormControlLabel
                                                value={coach.coachId}
                                                control={<Radio />}
                                                label=""
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                {coach.coachType}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" gap={1}>
                                                {coach.coachType === 'Economy' && (
                                                    <>
                                                        <Chip size="small" icon={<LuggageOutlined />} label="15kg" />
                                                    </>
                                                )}
                                                {coach.coachType === 'Business' && (
                                                    <>
                                                        <Chip size="small" icon={<LuggageOutlined />} label="30kg" />
                                                        <Chip size="small" icon={<Restaurant />} label="Meals" />
                                                        <Chip size="small" icon={<Wifi />} label="Wi-Fi" />
                                                    </>
                                                )}
                                                {coach.coachType === 'First Class' && (
                                                    <>
                                                        <Chip size="small" icon={<LuggageOutlined />} label="40kg" />
                                                        <Chip size="small" icon={<Restaurant />} label="Premium Meals" />
                                                        <Chip size="small" icon={<Wifi />} label="Hi-Speed Wi-Fi" />
                                                        <Chip size="small" icon={<Power />} label="Power Outlets" />
                                                    </>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography>
                                                {coach.seatsAvailable} seats
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                                                {formatPrice( coach.price )}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </RadioGroup>

                <Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={handleBooking}
                        disabled={!selectedCoach}
                        sx={{ px: 4, py: 1.5 }}
                    >
                        Continue to Booking
                    </Button>
                </Box>
            </Paper>

            {/* Flight Policies */}
            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Flight Policies
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" component="h3" gutterBottom>
                                Baggage Policy
                            </Typography>
                            <Typography variant="body2">
                                • Economy: 15kg check-in + 7kg cabin<br />
                                • Business: 30kg check-in + 10kg cabin<br />
                                • First Class: 40kg check-in + 15kg cabin<br />
                                <br />
                                Excess baggage charges apply beyond allowance.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" component="h3" gutterBottom>
                                Cancellation Policy
                            </Typography>
                            <Typography variant="body2">
                                • 24+ hours before: 75% refund<br />
                                • 12-24 hours before: 50% refund<br />
                                • Less than 12 hours: 25% refund<br />
                                • No-show: No refund<br />
                                <br />
                                Additional airline penalties may apply.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" component="h3" gutterBottom>
                                Check-in Information
                            </Typography>
                            <Typography variant="body2">
                                • Online check-in: 48-2 hours before departure<br />
                                • Airport check-in: 3 hours before departure<br />
                                • Check-in closes: 45 minutes before departure<br />
                                <br />
                                Valid ID is required for all passengers.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default FlightId;