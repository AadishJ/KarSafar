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
    Rating
} from '@mui/material';
import axiosInstance from '../../Config/axiosInstance';
import { format, parseISO } from 'date-fns';
import {
    DirectionsCar,
    Person,
    AccessTime,
    ArrowBack,
    AcUnit,
    Wifi,
    PhoneAndroid,
    ChildCare,
    Luggage,
    LocalGasStation,
    Speed,
    AirlineSeatReclineNormal,
    EventSeat,
    LocationOn
} from '@mui/icons-material';

const CabId = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ cab, setCab ] = useState( null );
    const [ loading, setLoading ] = useState( true );
    const [ error, setError ] = useState( null );
    const [ selectedCoach, setSelectedCoach ] = useState( null );

    useEffect( () => {
        const fetchCabDetails = async () => {
            try {
                setLoading( true );
                const response = await axiosInstance.get( `/cab/${ id }` );

                if ( response.data.success ) {
                    const cabData = response.data.data;
                    setCab( cabData );

                    // Auto-select the first coach type
                    if ( cabData.coaches && cabData.coaches.length > 0 ) {
                        setSelectedCoach( cabData.coaches[ 0 ].coachId );
                    }
                } else {
                    setError( 'Failed to fetch cab details' );
                }
            } catch ( err ) {
                console.error( 'Error fetching cab details:', err );
                setError( 'An error occurred while retrieving cab information' );
            } finally {
                setLoading( false );
            }
        };

        if ( id ) {
            fetchCabDetails();
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

    // Format date
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

    const handleCoachSelect = ( event ) => {
        setSelectedCoach( event.target.value );
    };

    const handleBooking = () => {
        if ( !selectedCoach ) {
            alert( 'Please select a cab type' );
            return;
        }
        // Navigate to booking page with cab and coach info
        navigate( `/booking/cab/${ id }`, {
            state: {
                cabId: id,
                coachId: selectedCoach,
                selectedCoach: cab.coaches.find( coach => coach.coachId === selectedCoach )
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
                        Unable to load cab details. Please try again later.
                    </Typography>
                </Paper>
            </Container>
        );
    }

    if ( !cab ) {
        return (
            <Container>
                <Button startIcon={<ArrowBack />} onClick={goBack} sx={{ mb: 3 }}>
                    Back to Search
                </Button>
                <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6">
                        Cab Not Found
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        The requested cab could not be found.
                    </Typography>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Button startIcon={<ArrowBack />} onClick={goBack} sx={{ mb: 3 }}>
                Back to Search
            </Button>

            <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
                Cab Details
            </Typography>

            {/* Cab Summary Card */}
            <Paper elevation={3} sx={{ mb: 4, p: 3, borderRadius: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                            {cab.photo ? (
                                <Avatar
                                    src={cab.photo}
                                    variant="rounded"
                                    sx={{ width: 80, height: 80, mr: 2 }}
                                    alt={cab.carModel}
                                />
                            ) : (
                                <DirectionsCar color="primary" sx={{ mr: 2, fontSize: 60 }} />
                            )}
                            <Box>
                                <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                                    {cab.carModel}
                                </Typography>
                                <Chip
                                    size="small"
                                    label={cab.status}
                                    color={cab.status === 'active' ? 'success' : 'default'}
                                    sx={{ mt: 0.5 }}
                                />
                            </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            Cab ID: {cab.cabId ? cab.cabId.substring( 0, 8 ) : id.substring( 0, 8 )}...
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Car Type: {cab.carType || 'Standard'}
                        </Typography>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                            Vehicle Details
                        </Typography>
                        <Box sx={{ mb: 0.5 }}>
                            <Typography variant="body2" display="flex" alignItems="center">
                                <EventSeat fontSize="small" sx={{ mr: 1 }} />
                                Capacity: {cab.capacity || '4'} persons
                            </Typography>
                        </Box>
                        <Box sx={{ mb: 0.5 }}>
                            <Typography variant="body2" display="flex" alignItems="center">
                                <Luggage fontSize="small" sx={{ mr: 1 }} />
                                Luggage: {cab.luggage || 'Medium'} capacity
                            </Typography>
                        </Box>
                        <Box sx={{ mb: 0.5 }}>
                            <Typography variant="body2" display="flex" alignItems="center">
                                <LocalGasStation fontSize="small" sx={{ mr: 1 }} />
                                Fuel Type: {cab.fuelType || 'Petrol'}
                            </Typography>
                        </Box>
                        {cab.features && cab.features.includes( 'AC' ) && (
                            <Box sx={{ mb: 0.5 }}>
                                <Typography variant="body2" display="flex" alignItems="center">
                                    <AcUnit fontSize="small" sx={{ mr: 1 }} />
                                    Air Conditioned
                                </Typography>
                            </Box>
                        )}
                    </Grid>

                    <Grid item xs={12} md={4}>
                        {cab.drivers && cab.drivers.length > 0 && (
                            <>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    Driver Details
                                </Typography>
                                <Box sx={{ mb: 0.5 }}>
                                    <Typography variant="body2" display="flex" alignItems="center">
                                        <Person fontSize="small" sx={{ mr: 1 }} />
                                        {cab.drivers[ 0 ].driverName || 'Professional Driver'}
                                    </Typography>
                                </Box>
                                <Box sx={{ mb: 0.5, display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ mr: 1 }}>Rating:</Typography>
                                    <Rating
                                        value={cab.drivers[ 0 ].rating || 4.5}
                                        precision={0.5}
                                        size="small"
                                        readOnly
                                    />
                                </Box>
                                <Box sx={{ mb: 0.5 }}>
                                    <Typography variant="body2" display="flex" alignItems="center">
                                        <AccessTime fontSize="small" sx={{ mr: 1 }} />
                                        Experience: {cab.drivers[ 0 ].experience || '5'} years
                                    </Typography>
                                </Box>
                            </>
                        )}
                    </Grid>
                </Grid>
            </Paper>

            {/* Service Areas */}
            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Service Areas
            </Typography>

            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                            Primary Service Locations
                        </Typography>
                        <Box>
                            {cab.serviceAreas ? (
                                <Box display="flex" flexWrap="wrap" gap={1}>
                                    {cab.serviceAreas.map( ( area, index ) => (
                                        <Chip
                                            key={index}
                                            icon={<LocationOn />}
                                            label={area}
                                            size="medium"
                                        />
                                    ) )}
                                </Box>
                            ) : (
                                <Box display="flex" flexWrap="wrap" gap={1}>
                                    <Chip icon={<LocationOn />} label="Delhi" size="medium" />
                                    <Chip icon={<LocationOn />} label="Gurgaon" size="medium" />
                                    <Chip icon={<LocationOn />} label="Noida" size="medium" />
                                </Box>
                            )}
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                            Service Information
                        </Typography>
                        <Typography variant="body2" paragraph>
                            • Available for city travel and outstation trips
                        </Typography>
                        <Typography variant="body2" paragraph>
                            • Airport pickup and drop services available
                        </Typography>
                        <Typography variant="body2">
                            • Available 24/7 with advance booking
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* Coach/Rate Selection */}
            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Select Cab Type & Rates
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
                                    <TableCell>Type</TableCell>
                                    <TableCell>Features</TableCell>
                                    <TableCell>Capacity</TableCell>
                                    <TableCell>Rate</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {cab.coaches && cab.coaches.map( ( coach ) => (
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
                                            <Box display="flex" flexWrap="wrap" gap={1}>
                                                {coach.coachType === 'Economy' && (
                                                    <>
                                                        <Chip size="small" icon={<Luggage />} label="Small luggage" />
                                                        <Chip size="small" icon={<PhoneAndroid />} label="Phone charger" />
                                                    </>
                                                )}
                                                {coach.coachType === 'Premium' && (
                                                    <>
                                                        <Chip size="small" icon={<Luggage />} label="Medium luggage" />
                                                        <Chip size="small" icon={<AcUnit />} label="AC" />
                                                        <Chip size="small" icon={<PhoneAndroid />} label="Phone charger" />
                                                    </>
                                                )}
                                                {coach.coachType === 'Luxury' && (
                                                    <>
                                                        <Chip size="small" icon={<Luggage />} label="Large luggage" />
                                                        <Chip size="small" icon={<AcUnit />} label="Premium AC" />
                                                        <Chip size="small" icon={<Wifi />} label="Wi-Fi" />
                                                        <Chip size="small" icon={<PhoneAndroid />} label="Charging ports" />
                                                    </>
                                                )}
                                                {coach.coachType === 'Family Van' && (
                                                    <>
                                                        <Chip size="small" icon={<Luggage />} label="Extra large luggage" />
                                                        <Chip size="small" icon={<AcUnit />} label="AC" />
                                                        <Chip size="small" icon={<ChildCare />} label="Child seat" />
                                                        <Chip size="small" icon={<PhoneAndroid />} label="Charging ports" />
                                                    </>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography>
                                                {coach.seatsAvailable} persons
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                                                {formatPrice( coach.price )}<Typography component="span" variant="body2">/hour</Typography>
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

            {/* Policies */}
            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Rental Policies
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" component="h3" gutterBottom>
                                Pricing & Payment
                            </Typography>
                            <Typography variant="body2">
                                • Pricing is on per-hour basis<br />
                                • Minimum booking: 2 hours<br />
                                • Additional charges for extra hours<br />
                                • Toll and parking fees extra<br />
                                <br />
                                Payment accepted: Credit/Debit cards, UPI, Cash
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
                                • 24+ hours before: Full refund<br />
                                • 12-24 hours before: 75% refund<br />
                                • 4-12 hours before: 50% refund<br />
                                • Less than 4 hours: No refund<br />
                                <br />
                                Rescheduling available with 12 hours notice.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" component="h3" gutterBottom>
                                Rental Information
                            </Typography>
                            <Typography variant="body2">
                                • Driver breaks: 30 min per 4 hours of service<br />
                                • Night charges apply from 11 PM to 6 AM<br />
                                • Outstation trips: Additional day charges<br />
                                • Interstate permits may apply<br />
                                <br />
                                All cabs are regularly sanitized and maintained.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default CabId;