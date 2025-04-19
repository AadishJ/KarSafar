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
    TrainOutlined,
    ArrowDownward,
    ArrowUpward,
    AccessTime,
    Weekend,
    ArrowBack,
    LuggageOutlined,
    Restaurant,
    Wifi,
    Power,
    DirectionsRailwayFilledOutlined
} from '@mui/icons-material';

const TrainId = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ train, setTrain ] = useState( null );
    const [ loading, setLoading ] = useState( true );
    const [ error, setError ] = useState( null );
    const [ selectedCoach, setSelectedCoach ] = useState( null );

    useEffect( () => {
        const fetchTrainDetails = async () => {
            try {
                setLoading( true );
                const response = await axiosInstance.get( `/train/${ id }` );

                if ( response.data.success ) {
                    const trainData = response.data.data;

                    // Adjust data to match component expectations
                    // The API returns 'route' but the component expects 'stations'
                    const processedData = {
                        ...trainData,
                        stations: trainData.route || []
                    };

                    setTrain( processedData );

                    // Auto-select the first coach type
                    if ( trainData.coaches && trainData.coaches.length > 0 ) {
                        setSelectedCoach( trainData.coaches[ 0 ].coachId );
                    }
                } else {
                    setError( 'Failed to fetch train details' );
                }
            } catch ( err ) {
                console.error( 'Error fetching train details:', err );
                setError( 'An error occurred while retrieving train information' );
            } finally {
                setLoading( false );
            }
        };

        if ( id ) {
            fetchTrainDetails();
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
        // Navigate to booking page with train and coach info
        navigate( `/booking/train/${ id }`, {
            state: {
                trainId: id,
                coachId: selectedCoach,
                selectedCoach: train.coaches.find( coach => coach.coachId === selectedCoach )
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
                        Unable to load train details. Please try again later.
                    </Typography>
                </Paper>
            </Container>
        );
    }

    if ( !train ) {
        return (
            <Container>
                <Button startIcon={<ArrowBack />} onClick={goBack} sx={{ mb: 3 }}>
                    Back to Search
                </Button>
                <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6">
                        Train Not Found
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        The requested train could not be found.
                    </Typography>
                </Paper>
            </Container>
        );
    }

    // Get the first and last stations
    const stations = train.stations || [];
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
                Train Details
            </Typography>

            {/* Train Summary Card */}
            <Paper elevation={3} sx={{ mb: 4, p: 3, borderRadius: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={5}>
                        <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                            <DirectionsRailwayFilledOutlined color="primary" sx={{ mr: 1, fontSize: 40 }} />
                            <Box>
                                <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                                    {train.trainName}
                                </Typography>
                                <Chip
                                    size="small"
                                    label={train.status}
                                    color={train.status === 'active' ? 'success' : 'default'}
                                    sx={{ mt: 0.5 }}
                                />
                            </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Train ID: {train.trainId ? train.trainId.substring( 0, 8 ) : id.substring( 0, 8 )}...
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

            {/* Train Route */}
            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Train Route
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
                                            <ArrowDownward fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
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
                                            <ArrowUpward fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
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
                                {train.coaches && train.coaches.map( ( coach ) => (
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
                                                {coach.coachType === 'Sleeper' && (
                                                    <>
                                                        <Chip size="small" icon={<Weekend />} label="Berth" />
                                                        <Chip size="small" icon={<LuggageOutlined />} label="25kg" />
                                                    </>
                                                )}
                                                {coach.coachType.includes( 'AC 3' ) && (
                                                    <>
                                                        <Chip size="small" icon={<Weekend />} label="AC Berth" />
                                                        <Chip size="small" icon={<LuggageOutlined />} label="35kg" />
                                                        <Chip size="small" icon={<Power />} label="Charging Point" />
                                                    </>
                                                )}
                                                {coach.coachType.includes( 'AC 2' ) && (
                                                    <>
                                                        <Chip size="small" icon={<Weekend />} label="AC Berth" />
                                                        <Chip size="small" icon={<LuggageOutlined />} label="40kg" />
                                                        <Chip size="small" icon={<Power />} label="Charging Point" />
                                                        <Chip size="small" icon={<Restaurant />} label="Meals" />
                                                    </>
                                                )}
                                                {coach.coachType.includes( '1st Class' ) && (
                                                    <>
                                                        <Chip size="small" icon={<Weekend />} label="Premium Berth" />
                                                        <Chip size="small" icon={<LuggageOutlined />} label="50kg" />
                                                        <Chip size="small" icon={<Power />} label="Charging Point" />
                                                        <Chip size="small" icon={<Restaurant />} label="Premium Meals" />
                                                        <Chip size="small" icon={<Wifi />} label="Wi-Fi" />
                                                    </>
                                                )}
                                                {coach.coachType === 'Chair Car' && (
                                                    <>
                                                        <Chip size="small" icon={<LuggageOutlined />} label="30kg" />
                                                        <Chip size="small" icon={<Power />} label="Charging Point" />
                                                        <Chip size="small" icon={<Wifi />} label="Wi-Fi" />
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

            {/* Train Policies */}
            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Train Policies
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" component="h3" gutterBottom>
                                Baggage Policy
                            </Typography>
                            <Typography variant="body2">
                                • Sleeper: 25kg per passenger<br />
                                • AC 3 Tier: 35kg per passenger<br />
                                • AC 2 Tier: 40kg per passenger<br />
                                • AC 1st Class: 50kg per passenger<br />
                                • Chair Car: 30kg per passenger<br />
                                <br />
                                Excess baggage charges: ₹100 per 10kg
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
                                • 48+ hours before: 75% refund<br />
                                • 24-48 hours before: 50% refund<br />
                                • 12-24 hours before: 25% refund<br />
                                • Less than 12 hours: No refund<br />
                                • No-show: No refund<br />
                                <br />
                                Tatkal tickets: Non-refundable
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
                                • E-ticket is valid for travel with ID proof<br />
                                • Arrive at station 30 minutes before departure<br />
                                • Senior citizens & differently-abled: Priority boarding<br />
                                • Children below 5 years: Free travel (no seat)<br />
                                <br />
                                Valid ID is required for all passengers
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default TrainId;