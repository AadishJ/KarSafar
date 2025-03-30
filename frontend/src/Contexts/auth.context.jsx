import React, { createContext, useState, useContext, useEffect } from 'react';
import axiosInstance from '../Config/axiosInstance';

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
    // State for authentication information
    const [ user, setUser ] = useState( null );
    const [ isAuthenticated, setIsAuthenticated ] = useState( false );
    const [ loading, setLoading ] = useState( true );
    const [ error, setError ] = useState( null );

    // Initialize auth state by checking if user is already logged in
    useEffect( () => {
        const loadUser = async () => {
            try {
                // Check if token exists in localStorage
                const token = localStorage.getItem( 'user' );

                if ( !token ) {
                    setLoading( false );
                    return;
                }

                // Get user data
                const response = await axiosInstance.get( `/auth/login` );

                setUser( response.data );
                setIsAuthenticated( true );
                setLoading( false );
            } catch ( err ) {
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

            // Store token in localStorage
            localStorage.setItem( 'user', token );

            setUser( user );
            setIsAuthenticated( true );
            setError( null );

            return user;
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

            localStorage.setItem( 'user', token );

            setUser( user );
            setIsAuthenticated( true );
            setError( null );

            return user;
        } catch ( err ) {
            setError( err.response?.data?.message || 'Registration failed. Please try again.' );
            throw err;
        }
    };

    // Logout function
    const logout = () => {
        // Remove token from localStorage
        localStorage.removeItem( 'user' );

        // Reset state
        setUser( null );
        setIsAuthenticated( false );
        setError( null );
    };

    // Update profile function
    const updateProfile = async ( userData ) => {
        try {
            const response = await axiosInstance.put( `/auth/profile`, userData );

            setUser( response.data );
            setError( null );

            return response.data;
        } catch ( err ) {
            setError( err.response?.data?.message || 'Failed to update profile.' );
            throw err;
        }
    };

    // Clear error function
    const clearError = () => {
        setError( null );
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
        clearError
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;