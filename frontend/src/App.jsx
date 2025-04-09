import React from 'react'
import { ToastContainer } from 'react-toastify'
import Home from './Pages/Home'
import Navbar from './Component/Navbar'
import { Route, Routes } from 'react-router-dom'
import Login from './Pages/Login'
import Register from './Pages/Register'
import Flight from './Pages/Flight'


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
          </Routes>
      </div>
    </>
  )
}

export default App
