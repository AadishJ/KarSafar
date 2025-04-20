import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../../Config/axiosInstance';
import { useAuth } from '../../Contexts/auth.context';
import Cookies from 'js-cookie';

const GoogleAuth = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { setUser, setIsAuthenticated } = useAuth();
    const [ error, setError ] = useState( null );

    useEffect( () => {
        const handleGoogleAuth = async () => {
            try {
                const queryParams = new URLSearchParams( location.search );
                const authCode = queryParams.get( 'code' );

                if ( !authCode ) {
                    setError( "No authentication code received" );
                    return;
                }
                // Send the code to your backend to exchange for tokens
                const response = await axiosInstance.post( '/auth/google/login', {
                    code: authCode
                } );

                if ( response.data.success && response.data.token && response.data.user ) {
                    // Add token to user data
                    const userData = {
                        ...response.data.user,
                        token: response.data.token
                    };
                    Cookies.set( 'user', response.data.token, {
                        secure: process.env.NODE_ENV === 'production', // secure in production
                        sameSite: 'none' // CSRF protection
                    } );

                    // Store in localStorage
                    localStorage.setItem( 'user', JSON.stringify( userData ) );

                    // Update auth context
                    setUser( userData );
                    setIsAuthenticated( true );

                    // Redirect to home
                    navigate( '/' );
                } else {
                    setError( "Invalid response from server" );
                }
            } catch ( error ) {
                console.error( "Google authentication error:", error );
                setError( error.response?.data?.message || "Authentication failed" );

                // After a delay, redirect to login page
                setTimeout( () => navigate( '/login' ), 3000 );
            }
        };

        handleGoogleAuth();
    }, [ location, navigate, setUser, setIsAuthenticated ] );

    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="text-center">
                <>
                    <h2 className="text-xl font-semibold mb-3">Processing Authentication</h2>
                    <p className="text-gray-600">Please wait while we complete your sign-in...</p>

                    {/* Optional loading spinner */}
                    <div className="mt-6 flex justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                </>
            </div>
        </div>
    );
};

export default GoogleAuth;