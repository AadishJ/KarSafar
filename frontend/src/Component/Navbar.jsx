import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlane, FaTrain, FaTaxi, FaShip, FaBus, FaUser, FaSearch, FaBars, FaTimes, FaHotel, FaHome, FaSignOutAlt, FaTicketAlt, FaUserCircle, FaCog, FaHistory } from 'react-icons/fa';
import { InputBase, Paper, Avatar, Menu, MenuItem, IconButton, Tooltip, Badge, Divider } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../Contexts/auth.context';

const Navbar = () => {
    const [ isOpen, setIsOpen ] = useState( false );
    const [ isUserDropdownOpen, setIsUserDropdownOpen ] = useState( false );
    const [ isAuthenticated, setIsAuthenticated ] = useState( false );
    const [ anchorEl, setAnchorEl ] = useState( null );
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect( () => {
        if ( user ) {
            setIsAuthenticated( true );
        } else {
            setIsAuthenticated( false );
        }
    }, [ user ] );

    const handleProfileMenuOpen = ( event ) => {
        setAnchorEl( event.currentTarget );
    };

    const handleProfileMenuClose = () => {
        setAnchorEl( null );
    };

    const handleLogout = () => {
        handleProfileMenuClose();
        logout();
        navigate( '/' );
    };

    // Get user initials for avatar
    const getUserInitials = () => {
        if ( !user || !user.name ) return "U";
        return user.name[ 0 ]?.toUpperCase() || "U";
    };


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

                    <Link to="/airbnbs" className="flex items-center text-gray-700 hover:text-blue-600 transition duration-300 font-medium">
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
                    {/* Authenticated Desktop View */}
                    {isAuthenticated ? (
                        <div className="hidden md:flex items-center ml-6">
                            <Tooltip title="Your account">
                                <IconButton
                                    onClick={handleProfileMenuOpen}
                                    size="small"
                                    sx={{ ml: 2 }}
                                    aria-controls="profile-menu"
                                    aria-haspopup="true"
                                >
                                    {user?.profilePicture ? (
                                        <Avatar
                                            src={user.profilePicture}
                                            alt={user.name}
                                            sx={{ width: 48, height: 48, bgcolor: '#3b82f6' }}
                                        />
                                    ) : (
                                        <Avatar sx={{ width: 36, height: 36, bgcolor: '#3b82f6' }}>
                                            {getUserInitials()}
                                        </Avatar>
                                    )}
                                </IconButton>
                            </Tooltip>

                            <Menu
                                id="profile-menu"
                                anchorEl={anchorEl}
                                open={Boolean( anchorEl )}
                                onClose={handleProfileMenuClose}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                                PaperProps={{
                                    sx: {
                                        mt: 1.5,
                                        width: 220,
                                        boxShadow: '0 4px 20px 0px rgba(0,0,0,0.1)'
                                    }
                                }}
                            >
                                <div className="px-4 py-3">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {user?.name || 'User'}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {user?.email || 'user@example.com'}
                                    </p>
                                </div>
                                <Divider />
                                <MenuItem onClick={() => { handleProfileMenuClose(); navigate( '/profile' ); }}>
                                    <FaUserCircle className="mr-3 text-blue-500" /> Profile
                                </MenuItem>
                                <MenuItem onClick={() => { handleProfileMenuClose(); navigate( '/bookings' ); }}>
                                    <FaTicketAlt className="mr-3 text-blue-500" /> My Bookings
                                </MenuItem>
                                <MenuItem onClick={() => { handleProfileMenuClose(); navigate( '/history' ); }}>
                                    <FaHistory className="mr-3 text-blue-500" /> Trip History
                                </MenuItem>
                                <MenuItem onClick={() => { handleProfileMenuClose(); navigate( '/settings' ); }}>
                                    <FaCog className="mr-3 text-blue-500" /> Settings
                                </MenuItem>
                                <Divider />
                                <MenuItem onClick={handleLogout}>
                                    <FaSignOutAlt className="mr-3 text-red-500" />
                                    <span className="text-red-500">Logout</span>
                                </MenuItem>
                            </Menu>
                        </div>
                    ) : (
                        /* Login/Register - Non-authenticated Desktop View */
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
                    )}

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

                    {/* Mobile Navigation Links */}
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

                    {/* Mobile User Account Section */}
                    <div className="border-t border-gray-100 mt-2 pt-2">
                        {isAuthenticated ? (
                            /* Authenticated Mobile View */
                            <>
                                <div className="flex items-center py-3">
                                    {user?.profilePicture ? (
                                        <Avatar
                                            src={user.profilePicture}
                                            alt={user.name}
                                            sx={{ width: 40, height: 40, bgcolor: '#3b82f6', mr: 2 }}
                                        />
                                    ) : (
                                        <Avatar sx={{ width: 40, height: 40, bgcolor: '#3b82f6', mr: 2 }}>
                                            {getUserInitials()}
                                        </Avatar>
                                    )}
                                    <div>
                                        <p className="text-sm font-medium">{user?.name || 'User'}</p>
                                        <p className="text-xs text-gray-500 truncate">{user?.email || 'user@example.com'}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsUserDropdownOpen( !isUserDropdownOpen )}
                                    className="flex justify-between items-center w-full py-2.5 text-gray-700 hover:text-blue-600 transition duration-300"
                                >
                                    <span className="flex items-center">
                                        <FaUserCircle className="mr-3 text-blue-500" /> Account
                                    </span>
                                    <svg className={`w-4 h-4 transform ${ isUserDropdownOpen ? 'rotate-180' : '' }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </button>

                                {isUserDropdownOpen && (
                                    <div className="pl-8 mt-1">
                                        <Link to="/profile" className="flex items-center py-2 text-gray-700 hover:text-blue-600 transition duration-300" onClick={() => setIsOpen( false )}>
                                            <FaUserCircle className="mr-2 text-blue-500" /> Profile
                                        </Link>
                                        <Link to="/bookings" className="flex items-center py-2 text-gray-700 hover:text-blue-600 transition duration-300" onClick={() => setIsOpen( false )}>
                                            <FaTicketAlt className="mr-2 text-blue-500" /> My Bookings
                                        </Link>
                                        <Link to="/history" className="flex items-center py-2 text-gray-700 hover:text-blue-600 transition duration-300" onClick={() => setIsOpen( false )}>
                                            <FaHistory className="mr-2 text-blue-500" /> Trip History
                                        </Link>
                                        <Link to="/settings" className="flex items-center py-2 text-gray-700 hover:text-blue-600 transition duration-300" onClick={() => setIsOpen( false )}>
                                            <FaCog className="mr-2 text-blue-500" /> Settings
                                        </Link>
                                        <button
                                            onClick={() => { setIsOpen( false ); logout(); navigate( '/' ); }}
                                            className="flex items-center w-full py-2 text-left text-red-500 hover:text-red-600 transition duration-300"
                                        >
                                            <FaSignOutAlt className="mr-2" /> Logout
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* Non-authenticated Mobile View */
                            <>
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
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;