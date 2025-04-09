import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlane, FaTrain, FaTaxi, FaShip, FaBus, FaUser, FaSearch, FaBars, FaTimes, FaHotel, FaHome } from 'react-icons/fa';
import { InputBase, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const Navbar = () => {
    const [ isOpen, setIsOpen ] = useState( false );
    const [ isUserDropdownOpen, setIsUserDropdownOpen ] = useState( false );
    const navigate = useNavigate();

    return (
        <nav className="bg-white shadow-md py-4 sticky top-0 z-50 w-full">
            <div className="container mx-auto px-4 lg:px-8 flex justify-between items-center">
                {/* Logo */}
                <Link to="/" className="flex items-center">
                    <span className="text-2xl mx-4 font-bold text-blue-600 hover:text-blue-700 transition duration-300">KarSafar</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-4 lg:space-x-8">
                    <Link to="/flights" className="flex items-center text-gray-700 hover:text-blue-600 transition duration-300 font-medium">
                        <FaPlane className="mr-1.5 text-blue-500" /> Flights
                    </Link>

                    <Link to="/trains" className="flex items-center text-gray-700 hover:text-blue-600 transition duration-300 font-medium">
                        <FaTrain className="mr-1.5 text-blue-500" /> Trains
                    </Link>

                    <Link to="/buses" className="flex items-center text-gray-700 hover:text-blue-600 transition duration-300 font-medium">
                        <FaBus className="mr-1.5 text-blue-500" /> Buses
                    </Link>

                    <Link to="/cabs" className="flex items-center text-gray-700 hover:text-blue-600 transition duration-300 font-medium">
                        <FaTaxi className="mr-1.5 text-blue-500" /> Cabs
                    </Link>

                    <Link to="/cruises" className="flex items-center text-gray-700 hover:text-blue-600 transition duration-300 font-medium">
                        <FaShip className="mr-1.5 text-blue-500" /> Cruises
                    </Link>

                    <Link to="/hotels" className="flex items-center text-gray-700 hover:text-blue-600 transition duration-300 font-medium">
                        <FaHotel className="mr-1.5 text-blue-500" /> Hotels
                    </Link>

                    <Link to="/airbnb" className="flex items-center text-gray-700 hover:text-blue-600 transition duration-300 font-medium">
                        <FaHome className="mr-1.5 text-blue-500" /> Airbnb
                    </Link>
                </div>

                {/* Search Bar */}
                <div className="hidden md:block ml-4">
                    <Paper
                        component="form"
                        elevation={0}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '20px',
                            backgroundColor: '#f3f4f6',
                            '&:hover': { backgroundColor: '#e5e7eb' },
                            border: '1px solid #e5e7eb',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <SearchIcon sx={{ color: '#6b7280', mr: 1 }} />
                        <InputBase
                            placeholder="Search destinations"
                            inputProps={{ 'aria-label': 'search' }}
                            sx={{
                                fontSize: '0.875rem',
                                width: '200px',
                                '& input': {
                                    padding: '4px 0'
                                }
                            }}
                            onKeyPress={( e ) => e.key === 'Enter' && navigate( '/search' )}
                        />
                    </Paper>
                </div>

                <div className="flex items-center">
                    {/* Login/Register */}
                    <div className="hidden md:flex items-center space-x-4 ml-6">
                        <Link to="/login" className="flex items-center text-gray-700 hover:text-blue-600 transition duration-300 font-medium">
                            <FaUser className="mr-1.5 text-blue-500" /> Login
                        </Link>
                        <Link
                            to="/register"
                            className="py-1.5 px-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition duration-300 font-medium text-sm"
                        >
                            Register
                        </Link>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden ml-4">
                        <button onClick={() => setIsOpen( !isOpen )} className="text-gray-700 hover:text-blue-600 focus:outline-none transition duration-300">
                            {isOpen ? <FaTimes className="h-6 w-6" /> : <FaBars className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden mt-4 pb-4 px-6 border-t border-gray-100 pt-4">
                    {/* Mobile Search Bar */}
                    <div className="mb-4">
                        <Paper
                            component="form"
                            elevation={0}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                px: 1.5,
                                py: 0.5,
                                borderRadius: '20px',
                                backgroundColor: '#f3f4f6',
                                border: '1px solid #e5e7eb'
                            }}
                        >
                            <SearchIcon sx={{ color: '#6b7280', mr: 1 }} />
                            <InputBase
                                placeholder="Search destinations"
                                inputProps={{ 'aria-label': 'search' }}
                                sx={{
                                    fontSize: '0.875rem',
                                    width: '100%',
                                }}
                                onKeyPress={( e ) => e.key === 'Enter' && navigate( '/search' )}
                            />
                        </Paper>
                    </div>

                    <Link to="/flights" className="flex items-center py-2.5 text-gray-700 hover:text-blue-600 transition duration-300" onClick={() => setIsOpen( false )}>
                        <FaPlane className="mr-3 text-blue-500" /> Flights
                    </Link>

                    <Link to="/trains" className="flex items-center py-2.5 text-gray-700 hover:text-blue-600 transition duration-300" onClick={() => setIsOpen( false )}>
                        <FaTrain className="mr-3 text-blue-500" /> Trains
                    </Link>

                    <Link to="/buses" className="flex items-center py-2.5 text-gray-700 hover:text-blue-600 transition duration-300" onClick={() => setIsOpen( false )}>
                        <FaBus className="mr-3 text-blue-500" /> Buses
                    </Link>

                    <Link to="/cabs" className="flex items-center py-2.5 text-gray-700 hover:text-blue-600 transition duration-300" onClick={() => setIsOpen( false )}>
                        <FaTaxi className="mr-3 text-blue-500" /> Cabs
                    </Link>

                    <Link to="/cruises" className="flex items-center py-2.5 text-gray-700 hover:text-blue-600 transition duration-300" onClick={() => setIsOpen( false )}>
                        <FaShip className="mr-3 text-blue-500" /> Cruises
                    </Link>

                    <Link to="/hotels" className="flex items-center py-2.5 text-gray-700 hover:text-blue-600 transition duration-300" onClick={() => setIsOpen( false )}>
                        <FaHotel className="mr-3 text-blue-500" /> Hotels
                    </Link>

                    <Link to="/airbnb" className="flex items-center py-2.5 text-gray-700 hover:text-blue-600 transition duration-300" onClick={() => setIsOpen( false )}>
                        <FaHome className="mr-3 text-blue-500" /> Airbnb
                    </Link>

                    {/* Mobile User Dropdown */}
                    <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                            onClick={() => setIsUserDropdownOpen( !isUserDropdownOpen )}
                            className="flex justify-between items-center w-full py-2.5 text-gray-700 hover:text-blue-600 transition duration-300"
                        >
                            <span className="flex items-center">
                                <FaUser className="mr-3 text-blue-500" /> Account
                            </span>
                            <svg className={`w-4 h-4 transform ${ isUserDropdownOpen ? 'rotate-180' : '' }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>

                        {isUserDropdownOpen && (
                            <div className="pl-8 mt-1">
                                <Link to="/login" className="block py-2 text-gray-700 hover:text-blue-600 transition duration-300" onClick={() => setIsOpen( false )}>
                                    Login
                                </Link>
                                <Link to="/register" className="block py-2 text-gray-700 hover:text-blue-600 transition duration-300" onClick={() => setIsOpen( false )}>
                                    Register
                                </Link>
                                <Link to="/bookings" className="block py-2 text-gray-700 hover:text-blue-600 transition duration-300" onClick={() => setIsOpen( false )}>
                                    My Bookings
                                </Link>
                                <Link to="/profile" className="block py-2 text-gray-700 hover:text-blue-600 transition duration-300" onClick={() => setIsOpen( false )}>
                                    Profile
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;