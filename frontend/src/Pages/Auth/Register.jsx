import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { FaUser, FaLock, FaEnvelope, FaCheck, FaEye, FaEyeSlash, FaPhone } from 'react-icons/fa';
import { useAuth } from '../../Contexts/auth.context';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();

    // Form states
    const [ name, setName ] = useState( '' );
    const [ email, setEmail ] = useState( '' );
    const [ phone, setPhone ] = useState( '' );
    const [ password, setPassword ] = useState( '' );
    const [ confirmPassword, setConfirmPassword ] = useState( '' );
    const [ showPassword, setShowPassword ] = useState( false );
    const [ showConfirmPassword, setShowConfirmPassword ] = useState( false );
    const [ agreeToTerms, setAgreeToTerms ] = useState( false );

    // UI states
    const [ error, setError ] = useState( '' );
    const [ loading, setLoading ] = useState( false );

    // Password strength indicators
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test( password );
    const hasLowerCase = /[a-z]/.test( password );
    const hasNumber = /\d/.test( password );
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test( password );

    const passwordStrength = [
        hasMinLength,
        hasUpperCase,
        hasLowerCase,
        hasNumber,
        hasSpecialChar
    ].filter( Boolean ).length;

    const getStrengthLabel = () => {
        if ( passwordStrength <= 2 ) return 'Weak';
        if ( passwordStrength <= 4 ) return 'Moderate';
        return 'Strong';
    };

    const getStrengthColor = () => {
        if ( passwordStrength <= 2 ) return 'bg-red-500';
        if ( passwordStrength <= 4 ) return 'bg-yellow-500';
        return 'bg-green-500';
    };


    const handleGoogleLogin = async () => {
        const googleAuthUrl = new URL(
            "https://accounts.google.com/o/oauth2/v2/auth"
        );

        // Set required OAuth 2.0 parameters
        googleAuthUrl.searchParams.set(
            "client_id",
            import.meta.env.VITE_GOOGLE_ID
        );
        googleAuthUrl.searchParams.set(
            "redirect_uri",
            import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${ window.location.origin }/auth/google/callback`
        );
        googleAuthUrl.searchParams.set( "response_type", "code" );
        googleAuthUrl.searchParams.set( "scope", "openid email profile" );
        googleAuthUrl.searchParams.set( "prompt", "select_account" );

        // Redirect to Google's OAuth page
        window.location.href = googleAuthUrl.toString();
    };


    const handleSubmit = async ( e ) => {
        e.preventDefault();
        setLoading( true );
        setError( '' );

        // Validation
        if ( password !== confirmPassword ) {
            setError( 'Passwords do not match' );
            setLoading( false );
            return;
        }

        if ( !agreeToTerms ) {
            setError( 'You must agree to the Terms of Service and Privacy Policy' );
            setLoading( false );
            return;
        }

        if ( passwordStrength < 3 ) {
            setError( 'Please use a stronger password' );
            setLoading( false );
            return;
        }

        try {
            await register( name, email, password, phone );
            navigate( '/' );
        } catch ( err ) {
            setError( err.response?.data?.message || 'Registration failed. Please try again.' );
        } finally {
            setLoading( false );
        }
    };

    useEffect( () => {
        const userData = localStorage.getItem( 'user' );
        if ( userData ) {
            navigate( '/' );
        }
    }
        , [ navigate ] );

    return (
        <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-neutral-100 p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>
                    <p className="text-gray-500">Join KarSafar to start booking your trips</p>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="text-sm font-medium text-gray-700 block mb-1">
                            Full Name
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaUser className="text-gray-400" />
                            </div>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={( e ) => setName( e.target.value )}
                                className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                placeholder="John Doe"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-gray-700 block mb-1">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaEnvelope className="text-gray-400" />
                            </div>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={( e ) => setEmail( e.target.value )}
                                className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="phone" className="text-sm font-medium text-gray-700 block mb-1">
                            Phone Number
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaPhone className="text-gray-400" />
                            </div>
                            <input
                                id="phone"
                                type="tel"
                                value={phone}
                                onChange={( e ) => setPhone( e.target.value )}
                                className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                placeholder="+1234567890"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="text-sm font-medium text-gray-700 block mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaLock className="text-gray-400" />
                            </div>
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={( e ) => setPassword( e.target.value )}
                                className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowPassword( !showPassword )}
                            >
                                {showPassword ? (
                                    <FaEyeSlash className="text-gray-400 hover:text-gray-500" />
                                ) : (
                                    <FaEye className="text-gray-400 hover:text-gray-500" />
                                )}
                            </button>
                        </div>

                        {/* Password strength meter */}
                        {password && (
                            <div className="mt-2">
                                <div className="flex justify-between mb-1">
                                    <span className="text-xs text-gray-500">Password strength:</span>
                                    <span className={`text-xs font-medium ${ passwordStrength <= 2 ? 'text-red-500' :
                                        passwordStrength <= 4 ? 'text-yellow-500' : 'text-green-500'
                                        }`}>{getStrengthLabel()}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full ${ getStrengthColor() }`}
                                        style={{ width: `${ ( passwordStrength / 5 ) * 100 }%` }}
                                    ></div>
                                </div>

                                <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2">
                                    <div className="flex items-center text-xs">
                                        <div className={`w-3 h-3 rounded-full mr-2 ${ hasMinLength ? 'bg-green-500' : 'bg-gray-300' }`}></div>
                                        <span className="text-gray-600">At least 8 characters</span>
                                    </div>
                                    <div className="flex items-center text-xs">
                                        <div className={`w-3 h-3 rounded-full mr-2 ${ hasUpperCase ? 'bg-green-500' : 'bg-gray-300' }`}></div>
                                        <span className="text-gray-600">Uppercase letter</span>
                                    </div>
                                    <div className="flex items-center text-xs">
                                        <div className={`w-3 h-3 rounded-full mr-2 ${ hasLowerCase ? 'bg-green-500' : 'bg-gray-300' }`}></div>
                                        <span className="text-gray-600">Lowercase letter</span>
                                    </div>
                                    <div className="flex items-center text-xs">
                                        <div className={`w-3 h-3 rounded-full mr-2 ${ hasNumber ? 'bg-green-500' : 'bg-gray-300' }`}></div>
                                        <span className="text-gray-600">Number</span>
                                    </div>
                                    <div className="flex items-center text-xs">
                                        <div className={`w-3 h-3 rounded-full mr-2 ${ hasSpecialChar ? 'bg-green-500' : 'bg-gray-300' }`}></div>
                                        <span className="text-gray-600">Special character</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 block mb-1">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaLock className="text-gray-400" />
                            </div>
                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={( e ) => setConfirmPassword( e.target.value )}
                                className={`pl-10 w-full px-4 py-2.5 border ${ confirmPassword && password !== confirmPassword
                                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                    } rounded-lg`}
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowConfirmPassword( !showConfirmPassword )}
                            >
                                {showConfirmPassword ? (
                                    <FaEyeSlash className="text-gray-400 hover:text-gray-500" />
                                ) : (
                                    <FaEye className="text-gray-400 hover:text-gray-500" />
                                )}
                            </button>
                        </div>
                        {confirmPassword && password !== confirmPassword && (
                            <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                        )}
                    </div>

                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <input
                                id="terms"
                                type="checkbox"
                                checked={agreeToTerms}
                                onChange={( e ) => setAgreeToTerms( e.target.checked )}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="terms" className="font-medium text-gray-700">
                                I agree to the{' '}
                                <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
                                {' '}and{' '}
                                <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${ loading ? 'opacity-70 cursor-not-allowed' : '' }`}
                    >
                        {loading ? 'Creating your account...' : 'Create Account'}
                    </button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or sign up with</span>
                    </div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    type="button"
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 
                          bg-white hover:bg-gray-50 text-gray-700 
                          border border-gray-200 rounded-lg
                          shadow-sm transition-all duration-150
                          hover:shadow-md focus:outline-none focus:ring-2 
                          focus:ring-blue-500 focus:ring-offset-2"
                >
                    <FcGoogle className="w-5 h-5" />
                    <span className="font-medium">Sign up with Google</span>
                </button>

                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Register;