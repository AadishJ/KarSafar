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
    FormControlLabel,
    Avatar
} from '@mui/material';
import axiosInstance from '../../Config/axiosInstance';
import { format, parseISO } from 'date-fns';
import {
    DepartureBoard,
    ArrivalBoard,
    AccessTime,
    DirectionsBus,
    ArrowBack,
    LuggageOutlined,
    Restaurant,
    Wifi,
    AcUnit,
    ChargingStation,
    AirlineSeatReclineNormal,
    Wc
} from '@mui/icons-material';

const BusId = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ bus, setBus ] = useState( null );
    const [ loading, setLoading ] = useState( true );
    const [ error, setError ] = useState( null );
    const [ selectedCoach, setSelectedCoach ] = useState( null );

    useEffect( () => {
        const fetchBusDetails = async () => {
            try {
                setLoading( true );
                const response = await axiosInstance.get( `/bus/${ id }` );

                if ( response.data.success ) {
                    const busData = response.data.data;

                    // Adjust data to match component expectations
                    // The API returns 'route' but the component expects 'stations'
                    const processedData = {
                        ...busData,
                        stations: busData.route || []
                    };

                    setBus( processedData );

                    // Auto-select the first coach type
                    if ( busData.coaches && busData.coaches.length > 0 ) {
                        setSelectedCoach( busData.coaches[ 0 ].coachId );
                    }
                } else {
                    setError( 'Failed to fetch bus details' );
                }
            } catch ( err ) {
                console.error( 'Error fetching bus details:', err );
                setError( 'An error occurred while retrieving bus information' );
            } finally {
                setLoading( false );
            }
        };

        if ( id ) {
            fetchBusDetails();
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
        // Navigate to booking page with bus and coach info
        navigate( `/booking/bus/${ id }`, {
            state: {
                busId: id,
                coachId: selectedCoach,
                selectedCoach: bus.coaches.find( coach => coach.coachId === selectedCoach )
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
                        Unable to load bus details. Please try again later.
                    </Typography>
                </Paper>
            </Container>
        );
    }

    if ( !bus ) {
        return (
            <Container>
                <Button startIcon={<ArrowBack />} onClick={goBack} sx={{ mb: 3 }}>
                    Back to Search
                </Button>
                <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6">
                        Bus Not Found
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        The requested bus could not be found.
                    </Typography>
                </Paper>
            </Container>
        );
    }

    // Get the first and last stations
    const stations = bus.stations || [];
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
                Bus Details
            </Typography>

            {/* Bus Summary Card */}
            <Paper elevation={3} sx={{ mb: 4, p: 3, borderRadius: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={5}>
                        <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                            {bus.photo ? (
                                <Avatar
                                    src={bus.photo}
                                    variant="rounded"
                                    sx={{ width: 70, height: 60, mr: 2 }}
                                    alt={bus.busName}
                                />
                            ) : (
                                <DirectionsBus color="primary" sx={{ mr: 1, fontSize: 40 }} />
                            )}
                            <Box>
                                <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                                    {bus.busName}
                                </Typography>
                                <Chip
                                    size="small"
                                    label={bus.status}
                                    color={bus.status === 'active' ? 'success' : 'default'}
                                    sx={{ mt: 0.5 }}
                                />
                            </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Bus ID: {bus.busId ? bus.busId.substring( 0, 8 ) : id.substring( 0, 8 )}...
                        </Typography>
                        {bus.drivers && bus.drivers.length > 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Driver: {bus.drivers[ 0 ].driverName}
                            </Typography>
                        )}
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
                                <Typography variant="body2" color="text.secondary">
                                    {departureStation ? departureStation.city : ''}
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
                                <Typography variant="body2" color="text.secondary">
                                    {arrivalStation ? arrivalStation.city : ''}
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

            {/* Bus Route */}
            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Bus Route
            </Typography>

            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Stepper orientation="vertical">
                    {stations.map( ( station, index ) => (
                        <Step key={index} active={true}>
                            <StepLabel>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                    {station.stationName}
                                </Typography>
                                {station.city && (
                                    <Typography variant="body2" color="text.secondary">
                                        {station.city}, {station.state}
                                    </Typography>
                                )}
                            </StepLabel>
                            <StepContent>
                                <Box sx={{ mb: 2 }}>
                                    {station.arrivalTime && (
                                        <Typography variant="body2">
                                            <ArrivalBoard fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
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
                                            <DepartureBoard fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
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
                Select Bus Class
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
                                {bus.coaches && bus.coaches.map( ( coach ) => (
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
                                            <Box display="flex" gap={1} flexWrap="wrap">
                                                {coach.coachType === 'Seater' && (
                                                    <>
                                                        <Chip size="small" icon={<AirlineSeatReclineNormal />} label="Standard Seats" />
                                                        <Chip size="small" icon={<Wc />} label="Restroom" />
                                                    </>
                                                )}
                                                {coach.coachType === 'Sleeper' && (
                                                    <>
                                                        <Chip size="small" icon={<AirlineSeatReclineNormal />} label="Berth Seats" />
                                                        <Chip size="small" icon={<Wc />} label="Restroom" />
                                                        <Chip size="small" icon={<AcUnit />} label="AC" />
                                                    </>
                                                )}
                                                {coach.coachType === 'AC Sleeper' && (
                                                    <>
                                                        <Chip size="small" icon={<AirlineSeatReclineNormal />} label="Premium Berth" />
                                                        <Chip size="small" icon={<Wc />} label="Clean Restroom" />
                                                        <Chip size="small" icon={<AcUnit />} label="AC" />
                                                        <Chip size="small" icon={<ChargingStation />} label="Charging Points" />
                                                        <Chip size="small" icon={<LuggageOutlined />} label="Extra Luggage" />
                                                    </>
                                                )}
                                                {coach.coachType === 'Volvo' && (
                                                    <>
                                                        <Chip size="small" icon={<AirlineSeatReclineNormal />} label="Recliner Seats" />
                                                        <Chip size="small" icon={<Wc />} label="Clean Restroom" />
                                                        <Chip size="small" icon={<AcUnit />} label="AC" />
                                                        <Chip size="small" icon={<Wifi />} label="Wi-Fi" />
                                                        <Chip size="small" icon={<ChargingStation />} label="Charging Points" />
                                                        <Chip size="small" icon={<Restaurant />} label="Snacks" />
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

            {/* Bus Policies */}
            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Bus Policies
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" component="h3" gutterBottom>
                                Luggage Policy
                            </Typography>
                            <Typography variant="body2">
                                • Standard: 15kg per passenger<br />
                                • AC Sleeper: 20kg per passenger<br />
                                • Volvo: 25kg per passenger<br />
                                <br />
                                Additional luggage may be charged extra.
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
                                • 24+ hours before: 80% refund<br />
                                • 12-24 hours before: 50% refund<br />
                                • 6-12 hours before: 25% refund<br />
                                • Less than 6 hours: No refund<br />
                                <br />
                                Bus operator may have additional terms.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" component="h3" gutterBottom>
                                Boarding Information
                            </Typography>
                            <Typography variant="body2">
                                • Arrive 30 minutes before departure<br />
                                • Show your booking ID and valid ID proof<br />
                                • Bus will not wait for late passengers<br />
                                <br />
                                Contact the driver if you're running late.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default BusId;