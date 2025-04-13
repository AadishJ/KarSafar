import React from 'react'
import { ToastContainer } from 'react-toastify'
import Home from './Pages/Home'
import Navbar from './Component/Navbar'
import { Route, Routes } from 'react-router-dom'
import Login from './Pages/Login'
import Register from './Pages/Register'
import Flight from './Pages/Flight'
import Train from './Pages/Train'
import Bus from './Pages/Bus'
import Cab from './Pages/Cab'
import Cruise from './Pages/Cruise'
import Hotel from './Pages/Hotel'
import Airbnb from './Pages/Airbnb'
import GoogleAuth from './Pages/GoogleAuth'


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
          <Route path='/flights' element={<Flight/>} />
          <Route path='/trains' element={<Train/>} />
          <Route path='/buses' element={<Bus />} />
          <Route path='/cabs' element={<Cab />} />
          <Route path='/cruises' element={<Cruise />} />
          <Route path='/hotels' element={<Hotel />} />
          <Route path='/airbnbs' element={<Airbnb />} />
          <Route path='/api/auth/callback' element={<GoogleAuth/>} />
          </Routes>
      </div>
    </>
  )
}

export default App
