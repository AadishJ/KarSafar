import React, { createContext, useState, useContext, useEffect } from 'react';
import axiosInstance from '../Config/axiosInstance';
import Cookies from 'js-cookie';

// Create the Auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
    const context = useContext( AuthContext );
    if ( !context ) {
        throw new Error( 'useAuth must be used within an AuthProvider' );
    }
    return context;
};

export const AuthProvider = ( { children } ) => {
    // Simplified state - user contains all user data
    const [ user, setUser ] = useState( null );
    const [ isAuthenticated, setIsAuthenticated ] = useState( false );
    const [ loading, setLoading ] = useState( true );
    const [ error, setError ] = useState( null );

    // Initialize auth state by checking if user data exists in localStorage
    useEffect( () => {
        const loadUser = () => {
            try {
                // Get user data from localStorage
                const userData = localStorage.getItem( 'user' );

                if ( !userData ) {
                    setLoading( false );
                    return;
                }

                // Parse stored user JSON
                const parsedUser = JSON.parse( userData );

                // Set user state
                setUser( parsedUser );
                setIsAuthenticated( true );
                setLoading( false );
            } catch ( err ) {
                console.error( 'Error loading user data:', err );
                localStorage.removeItem( 'user' );
                setUser( null );
                setIsAuthenticated( false );
                setLoading( false );
                setError( 'Authentication failed. Please log in again.' );
            }
        };

        loadUser();
    }, [] );

    // Login function
    const login = async ( email, password ) => {
        try {
            const response = await axiosInstance.post( `/auth/login`, {
                email,
                password
            } );

            const { token, user } = response.data;

            // Add token to user object
            const userData = {
                ...user,
                token
            };

            // Store complete user data in localStorage
            localStorage.setItem( 'user', JSON.stringify( userData ) );

            setUser( userData );
            setIsAuthenticated( true );
            setError( null );

            // Configure axios to use the token
            axiosInstance.defaults.headers.common[ 'Authorization' ] = `Bearer ${ token }`;

            return userData;
        } catch ( err ) {
            setError( err.response?.data?.message || 'Login failed. Please check your credentials.' );
            throw err;
        }
    };

    // Register function
    const register = async ( name, email, password, phone ) => {
        try {
            const response = await axiosInstance.post( `/auth/register`, {
                name,
                email,
                password,
                phone
            } );

            const { token, user } = response.data;

            // Add token to user object
            const userData = {
                ...user,
                token
            };

            // Store complete user data in localStorage
            localStorage.setItem( 'user', JSON.stringify( userData ) );

            setUser( userData );
            setIsAuthenticated( true );
            setError( null );

            // Configure axios to use the token
            axiosInstance.defaults.headers.common[ 'Authorization' ] = `Bearer ${ token }`;

            return userData;
        } catch ( err ) {
            setError( err.response?.data?.message || 'Registration failed. Please try again.' );
            throw err;
        }
    };

    // Logout function
    const logout = () => {
        // API call to logout (keeping this)
        axiosInstance.get( `/auth/logout` ).catch( err =>
            console.error( 'Logout API error:', err )
        );

        // Remove user data from localStorage
        localStorage.removeItem( 'user' );
        Cookies.remove( 'user' );

        // Remove auth header
        delete axiosInstance.defaults.headers.common[ 'Authorization' ];

        // Reset state
        setUser( null );
        setIsAuthenticated( false );
        setError( null );
    };

    // Update profile function
    const updateProfile = async ( userData ) => {
        try {
            const response = await axiosInstance.put( `/auth/profile`, userData );

            // Get the updated user data
            const updatedUserData = response.data;

            // Preserve the token from the current user data
            const updatedUser = {
                ...updatedUserData,
                token: user.token
            };

            // Update localStorage
            localStorage.setItem( 'user', JSON.stringify( updatedUser ) );

            // Update state
            setUser( updatedUser );
            setError( null );

            return updatedUser;
        } catch ( err ) {
            setError( err.response?.data?.message || 'Failed to update profile.' );
            throw err;
        }
    };

    // Clear error function
    const clearError = () => {
        setError( null );
    };

    // Get user's name helper (for avatar, etc.)
    const getUserName = () => {
        return user?.name || '';
    };

    // Create the context value object containing state and functions
    const value = {
        user,
        isAuthenticated,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        clearError,
        setUser,
        userName: getUserName()
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;