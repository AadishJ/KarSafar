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
    Avatar,
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import axiosInstance from '../../Config/axiosInstance';
import { format, parseISO, differenceInDays } from 'date-fns';
import {
    DirectionsBoat,
    LocationOn,
    AccessTime,
    ArrowBack,
    Pool,
    Restaurant,
    Wifi,
    Spa,
    Casino,
    TheaterComedy,
    FitnessCenter,
    MeetingRoom,
    LocalBar,
    Deck,
    NightsStay,
    AirlineSeatReclineExtra
} from '@mui/icons-material';

const CruiseId = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ cruise, setCruise ] = useState( null );
    const [ loading, setLoading ] = useState( true );
    const [ error, setError ] = useState( null );
    const [ selectedCoach, setSelectedCoach ] = useState( null );

    useEffect( () => {
        const fetchCruiseDetails = async () => {
            try {
                setLoading( true );
                const response = await axiosInstance.get( `/cruise/${ id }` );

                if ( response.data.success ) {
                    const cruiseData = response.data.data;
                    setCruise( cruiseData );

                    // Auto-select the first cabin type
                    if ( cruiseData.coaches && cruiseData.coaches.length > 0 ) {
                        setSelectedCoach( cruiseData.coaches[ 0 ].coachId );
                    }
                } else {
                    setError( 'Failed to fetch cruise details' );
                }
            } catch ( err ) {
                console.error( 'Error fetching cruise details:', err );
                setError( 'An error occurred while retrieving cruise information' );
            } finally {
                setLoading( false );
            }
        };

        if ( id ) {
            fetchCruiseDetails();
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
    const formatDate = ( dateStr ) => {
        if ( !dateStr ) return '';
        try {
            const date = parseISO( dateStr );
            return format( date, 'MMM dd, yyyy' );
        } catch ( e ) {
            console.error( 'Date parsing error:', e );
            return dateStr;
        }
    };

    // Calculate duration between two dates
    const calculateDuration = ( startDate, endDate ) => {
        if ( !startDate || !endDate ) return '';
        try {
            const start = parseISO( startDate );
            const end = parseISO( endDate );
            const days = differenceInDays( end, start );
            return `${ days } days`;
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
            alert( 'Please select a cabin type' );
            return;
        }
        // Navigate to booking page with cruise and cabin info
        navigate( `/booking/cruise/${ id }`, {
            state: {
                cruiseId: id,
                coachId: selectedCoach,
                selectedCoach: cruise.coaches.find( coach => coach.coachId === selectedCoach )
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
                        Unable to load cruise details. Please try again later.
                    </Typography>
                </Paper>
            </Container>
        );
    }

    if ( !cruise ) {
        return (
            <Container>
                <Button startIcon={<ArrowBack />} onClick={goBack} sx={{ mb: 3 }}>
                    Back to Search
                </Button>
                <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6">
                        Cruise Not Found
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        The requested cruise could not be found.
                    </Typography>
                </Paper>
            </Container>
        );
    }

    // Get departure and arrival ports
    const itinerary = cruise.itinerary || [];
    const departurePort = itinerary.length > 0 ? itinerary[ 0 ] : null;
    const arrivalPort = itinerary.length > 0 ? itinerary[ itinerary.length - 1 ] : null;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Button startIcon={<ArrowBack />} onClick={goBack} sx={{ mb: 3 }}>
                Back to Search
            </Button>

            <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
                Cruise Details
            </Typography>

            {/* Cruise Summary Card */}
            <Paper elevation={3} sx={{ mb: 4, p: 3, borderRadius: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={5}>
                        <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                            <DirectionsBoat color="primary" sx={{ mr: 1, fontSize: 40 }} />
                            <Box>
                                <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                                    {cruise.cruiseName || 'Luxury Cruise'}
                                </Typography>
                                <Chip
                                    size="small"
                                    label={cruise.status || 'Active'}
                                    color={( cruise.status || 'active' ) === 'active' ? 'success' : 'default'}
                                    sx={{ mt: 0.5 }}
                                />
                            </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Cruise ID: {cruise.cruiseId ? cruise.cruiseId.substring( 0, 8 ) : id.substring( 0, 8 )}...
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Cruise Line: {cruise.cruiseLine || 'Premium Cruise Line'}
                        </Typography>
                    </Grid>

                    <Grid item xs={12} md={7}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                            <Box>
                                <Typography variant="h6" component="p" sx={{ fontWeight: 'bold' }}>
                                    {formatDate( cruise.departureDate )}
                                </Typography>
                                <Typography variant="body1">
                                    {departurePort ? departurePort.port : 'Departure Port'}
                                </Typography>
                            </Box>

                            <Box display="flex" flexDirection="column" alignItems="center" sx={{ mx: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    {calculateDuration( cruise.departureDate, cruise.arrivalDate )}
                                </Typography>
                                <Box sx={{ width: '100%', height: '2px', bgcolor: 'grey.300', my: 0.5 }} />
                                <Typography variant="body2" color="text.secondary">
                                    {itinerary.length - 2 > 0 ? `${ itinerary.length - 2 } ports of call` : 'Direct voyage'}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="h6" component="p" sx={{ fontWeight: 'bold' }}>
                                    {formatDate( cruise.arrivalDate )}
                                </Typography>
                                <Typography variant="body1">
                                    {arrivalPort ? arrivalPort.port : 'Arrival Port'}
                                </Typography>
                            </Box>
                        </Box>

                        <Box display="flex" alignItems="center" sx={{ mt: 1.5 }}>
                            <AccessTime fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                                Ship: {cruise.shipName || 'Luxury Liner'}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Cruise Itinerary */}
            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Cruise Itinerary
            </Typography>

            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Stepper orientation="vertical">
                    {itinerary.map( ( stop, index ) => (
                        <Step key={index} active={true}>
                            <StepLabel>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                    {stop.port}
                                </Typography>
                            </StepLabel>
                            <StepContent>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2">
                                        <LocationOn fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Date: {formatDate( stop.date )}
                                    </Typography>

                                    {stop.arrivalTime && (
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            <AccessTime fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                                            Arrival: {stop.arrivalTime}
                                        </Typography>
                                    )}

                                    {stop.departureTime && (
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            <AccessTime fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                                            Departure: {stop.departureTime}
                                        </Typography>
                                    )}

                                    {stop.description && (
                                        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                                            {stop.description}
                                        </Typography>
                                    )}
                                </Box>
                            </StepContent>
                        </Step>
                    ) )}
                </Stepper>
            </Paper>

            {/* Ship Amenities */}
            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Ship Amenities
            </Typography>

            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <List dense>
                            <ListItem>
                                <ListItemIcon><Pool color="primary" /></ListItemIcon>
                                <ListItemText primary="Swimming Pools" secondary="Multiple pools including adults-only pool" />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon><Restaurant color="primary" /></ListItemIcon>
                                <ListItemText primary="Dining Options" secondary="5 restaurants including specialty dining" />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon><TheaterComedy color="primary" /></ListItemIcon>
                                <ListItemText primary="Entertainment" secondary="Theater shows, live music, and cinema" />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon><Casino color="primary" /></ListItemIcon>
                                <ListItemText primary="Casino" secondary="Table games and slot machines" />
                            </ListItem>
                        </List>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <List dense>
                            <ListItem>
                                <ListItemIcon><Spa color="primary" /></ListItemIcon>
                                <ListItemText primary="Spa & Wellness" secondary="Full-service spa, salon, and fitness center" />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon><Wifi color="primary" /></ListItemIcon>
                                <ListItemText primary="Internet Access" secondary="Wi-Fi available throughout the ship" />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon><Deck color="primary" /></ListItemIcon>
                                <ListItemText primary="Outdoor Activities" secondary="Sports deck, walking track, and mini-golf" />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon><LocalBar color="primary" /></ListItemIcon>
                                <ListItemText primary="Bars & Lounges" secondary="Multiple themed bars and nightclub" />
                            </ListItem>
                        </List>
                    </Grid>
                </Grid>
            </Paper>

            {/* Cabin Selection */}
            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Select Cabin Type
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
                                    <TableCell>Cabin Type</TableCell>
                                    <TableCell>Amenities</TableCell>
                                    <TableCell>Available Cabins</TableCell>
                                    <TableCell>Price (per person)</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {cruise.coaches && cruise.coaches.map( ( coach ) => (
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
                                                {coach.coachType === 'Interior' && (
                                                    <>
                                                        <Chip size="small" icon={<MeetingRoom />} label="Standard cabin" />
                                                        <Chip size="small" icon={<Restaurant />} label="Standard dining" />
                                                    </>
                                                )}
                                                {coach.coachType === 'Ocean View' && (
                                                    <>
                                                        <Chip size="small" icon={<MeetingRoom />} label="Window view" />
                                                        <Chip size="small" icon={<Restaurant />} label="Standard dining" />
                                                        <Chip size="small" icon={<AirlineSeatReclineExtra />} label="Enhanced amenities" />
                                                    </>
                                                )}
                                                {coach.coachType === 'Balcony' && (
                                                    <>
                                                        <Chip size="small" icon={<Deck />} label="Private balcony" />
                                                        <Chip size="small" icon={<Restaurant />} label="Priority dining" />
                                                        <Chip size="small" icon={<Wifi />} label="Basic Wi-Fi" />
                                                        <Chip size="small" icon={<AirlineSeatReclineExtra />} label="Premium amenities" />
                                                    </>
                                                )}
                                                {coach.coachType === 'Suite' && (
                                                    <>
                                                        <Chip size="small" icon={<Deck />} label="Large balcony" />
                                                        <Chip size="small" icon={<Restaurant />} label="Specialty dining" />
                                                        <Chip size="small" icon={<Wifi />} label="Premium Wi-Fi" />
                                                        <Chip size="small" icon={<LocalBar />} label="Mini-bar" />
                                                        <Chip size="small" icon={<NightsStay />} label="Butler service" />
                                                    </>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography>
                                                {coach.seatsAvailable} cabins
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

            {/* Cruise Policies */}
            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Cruise Policies
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" component="h3" gutterBottom>
                                Payment Policy
                            </Typography>
                            <Typography variant="body2">
                                • Deposit: 20% at time of booking<br />
                                • Full payment: Due 90 days before sailing<br />
                                • Accepted payments: Credit/debit cards, bank transfers<br />
                                <br />
                                All prices are per person based on double occupancy.
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
                                • 90+ days before: Full refund minus deposit<br />
                                • 60-89 days before: 75% refund<br />
                                • 30-59 days before: 50% refund<br />
                                • Less than 30 days: No refund<br />
                                <br />
                                Travel insurance is strongly recommended.
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
                                • Check-in: 12:00 PM - 3:00 PM on departure day<br />
                                • Required documents: Passport valid for 6 months after return<br />
                                • All guests must complete online check-in 72 hours before sailing<br />
                                <br />
                                Arrive at port at least 2 hours before departure.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default CruiseId;