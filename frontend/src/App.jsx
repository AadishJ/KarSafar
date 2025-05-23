import React from 'react'
import { ToastContainer } from 'react-toastify'
import Home from './Pages/Home'
import Navbar from './Component/Navbar'
import { Route, Routes } from 'react-router-dom'
import Login from './Pages/Auth/Login'
import Register from './Pages/Auth/Register'
import Flight from './Pages/Base/Flight'
import Train from './Pages/Base/Train'
import Bus from './Pages/Base/Bus'
import Cab from './Pages/Base/Cab'
import Cruise from './Pages/Base/Cruise'
import Hotel from './Pages/Base/Hotel'
import Airbnb from './Pages/Base/Airbnb'
import GoogleAuth from './Pages/Auth/GoogleAuth'
import FlightId from './Pages/ID/FlightId'
import BookingFlight from './Pages/Booking/BookingFlight'
import Bookings from './Pages/Booking/Bookings'
import TrainId from './Pages/ID/TrainId'
import BookingTrain from './Pages/Booking/BookingTrain'
import BusId from './Pages/ID/BusId'
import CabId from './Pages/ID/CabId'
import BookingCab from './Pages/Booking/BookingCab'
import BookingCruise from './Pages/Booking/BookingCruise'
import CruiseId from './Pages/ID/CruiseId'
import HotelId from './Pages/ID/HotelId'
import BookingHotel from './Pages/Booking/BookingHotel'
import AirbnbId from './Pages/ID/AirbnbId'
import BookingAirbnb from './Pages/Booking/BookingAirbnb'


const App = () => {

  return (
    <>
      <div>
        <ToastContainer position='bottom-center' autoClose='1500' />
        <Navbar />
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/bookings' element={<Bookings />} />

          <Route path='/flights' element={<Flight />} />
          <Route path='/flights/:id' element={<FlightId />} />
          <Route path='/booking/flight/:id' element={<BookingFlight />} />

          <Route path='/trains' element={<Train />} />
          <Route path='/trains/:id' element={<TrainId />} />
          <Route path='/booking/train/:id' element={<BookingTrain />} />

          <Route path='/buses' element={<Bus />} />
          <Route path='/buses/:id' element={<BusId />} />
          <Route path='/booking/bus/:id' element={<BookingTrain />} />

          <Route path='/cabs' element={<Cab />} />
          <Route path='/cabs/:id' element={<CabId />} />
          <Route path='/booking/cab/:id' element={<BookingCab />} />

          <Route path='/cruises' element={<Cruise />} />
          <Route path='/cruises/:id' element={<CruiseId />} />
          <Route path='/booking/cruise/:id' element={<BookingCruise />} />

          <Route path='/hotels' element={<Hotel />} />
          <Route path='/hotels/:id' element={<HotelId />} />
          <Route path='/booking/hotel/:id' element={<BookingHotel />} />
          
          <Route path='/airbnbs' element={<Airbnb />} />
          <Route path='/airbnbs/:id' element={<AirbnbId />} />
          <Route path='/booking/airbnb/:id' element={<BookingAirbnb />} />

          <Route path='/api/auth/callback' element={<GoogleAuth />} />
        </Routes>
      </div>
    </>
  )
}

export default App
