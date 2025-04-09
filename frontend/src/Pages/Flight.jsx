import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Divider,
  CircularProgress,
  Chip
} from '@mui/material';
import axiosInstance from '../Config/axiosInstance';
import { format } from 'date-fns';
import {
  FlightTakeoff,
  FlightLand,
  AccessTime,
  AirlineSeatReclineNormal,
  Flight as FlightIcon
} from '@mui/icons-material';

import FlightDateSelector from '../Component/FlightDateSelector';

const Flight = () => {
  const [ searchParams, setSearchParams ] = useState( {
    origin: '',
    destination: '',
    departureDate: null,
    returnDate: null,
    isRoundTrip: true
  } );

  const [ flights, setFlights ] = useState( [] );
  const [ loading, setLoading ] = useState( false );
  const [ error, setError ] = useState( null );
  const [ searched, setSearched ] = useState( false );

  const handleDateChange = ( dateInfo ) => {
    setSearchParams( prev => ( {
      ...prev,
      departureDate: dateInfo.departureDate,
      returnDate: dateInfo.returnDate,
      isRoundTrip: dateInfo.isRoundTrip
    } ) );
  };

  const handleLocationChange = ( locationInfo ) => {
    setSearchParams( prev => ( {
      ...prev,
      origin: locationInfo.source?.name || '',
      destination: locationInfo.destination?.name || ''
    } ) );
  };

  const searchFlights = async () => {
    // Validate search parameters
    if ( !searchParams.origin || !searchParams.destination || !searchParams.departureDate ) {
      setError( 'Please select origin, destination and departure date' );
      return;
    }

    setLoading( true );
    setError( null );
    setSearched( true );

    try {
      // Format date for API
      const formattedDepartureDate = format( searchParams.departureDate, 'yyyy-MM-dd' );

      // Build the query parameters
      const params = {
        origin: searchParams.origin,
        destination: searchParams.destination,
        departureDate: formattedDepartureDate
      };

      // Make API call
      const response = await axiosInstance.get( '/flight/list', { params } );

      if ( response.data.success ) {
        setFlights( response.data.data );
      } else {
        setError( 'Failed to fetch flights' );
      }
    } catch ( err ) {
      console.error( 'Error fetching flights:', err );
      setError( 'An error occurred while searching for flights' );
    } finally {
      setLoading( false );
    }
  };

  // Format price with Indian Rupee symbol
  const formatPrice = ( price ) => {
    return new Intl.NumberFormat( 'en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    } ).format( price );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" className="mb-6 font-bold text-gray-800">
        Flight Search
      </Typography>

      {/* Search Section */}
      <Paper elevation={3} className="mb-8">
        <Box p={3}>
          <FlightDateSelector
            onDateChange={handleDateChange}
            onLocationChange={handleLocationChange}
          />

          <Box mt={3} display="flex" justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={searchFlights}
              startIcon={<FlightIcon />}
              disabled={loading}
              className="px-8 py-3"
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Search Flights'}
            </Button>
          </Box>

          {error && (
            <Typography color="error" align="center" className="mt-3">
              {error}
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Results Section */}
      {searched && (
        <Box>
          <Typography variant="h5" component="h2" gutterBottom className="mb-4">
            {loading ? 'Searching...' :
              flights.length > 0 ? `${ flights.length } Flights Found` : 'No Flights Found'}
          </Typography>

          {flights.length > 0 && (
            <Grid container spacing={3}>
              {flights.map( ( flight ) => (
                <Grid item xs={12} key={flight.id}>
                  <Paper elevation={2} className="p-4 hover:shadow-lg transition-shadow duration-300">
                    <Grid container spacing={2}>
                      {/* Flight info */}
                      <Grid item xs={12} md={3}>
                        <Typography variant="h6" className="font-medium">
                          {flight.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Flight #{flight.id.substring( 0, 6 )}
                        </Typography>
                        <Chip
                          size="small"
                          label={flight.status}
                          color={flight.status === 'active' ? 'success' : 'default'}
                          className="mt-2"
                        />
                      </Grid>

                      {/* Departure and arrival */}
                      <Grid item xs={12} md={5}>
                        <Box display="flex" alignItems="center" className="mb-1">
                          <FlightTakeoff color="primary" className="mr-2" />
                          <div>
                            <Typography variant="body2" className="font-medium">
                              {format( new Date( flight.departureTime ), 'hh:mm a' )}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {flight.origin}
                            </Typography>
                          </div>
                        </Box>

                        <Box className="border-l-2 border-gray-300 h-6 ml-3"></Box>

                        <Box display="flex" alignItems="center">
                          <FlightLand color="primary" className="mr-2" />
                          <div>
                            <Typography variant="body2" className="font-medium">
                              {format( new Date( flight.arrivalTime ), 'hh:mm a' )}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {flight.destination}
                            </Typography>
                          </div>
                        </Box>

                        <Box display="flex" alignItems="center" className="mt-2">
                          <AccessTime fontSize="small" className="mr-1 text-gray-500" />
                          <Typography variant="body2" color="textSecondary">
                            {flight.duration.display}
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Seats and price */}
                      <Grid item xs={12} md={4}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box display="flex" alignItems="center">
                            <AirlineSeatReclineNormal className="mr-1 text-gray-500" />
                            <Typography variant="body2" color="textSecondary">
                              {flight.availableSeats} seats available
                            </Typography>
                          </Box>

                          <Typography variant="h6" color="primary" className="font-bold">
                            {formatPrice( flight.basePrice )}
                          </Typography>
                        </Box>

                        <Box mt={2} display="flex" justifyContent="flex-end">
                          <Button
                            variant="contained"
                            color="primary"
                            size="medium"
                          >
                            Book Now
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ) )}
            </Grid>
          )}

          {!loading && flights.length === 0 && searched && (
            <Paper elevation={1} className="p-8 text-center">
              <Typography variant="body1" color="textSecondary">
                No flights found matching your search criteria.
              </Typography>
              <Typography variant="body2" color="textSecondary" className="mt-2">
                Try changing your search parameters or dates.
              </Typography>
            </Paper>
          )}
        </Box>
      )}
    </Container>
  );
};

export default Flight;