import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { FaUser, FaLock } from 'react-icons/fa';
import { useAuth } from '../Contexts/auth.context';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [ email, setEmail ] = React.useState( '' );
    const [ password, setPassword ] = React.useState( '' );
    const [ error, setError ] = React.useState( '' );
    const [ loading, setLoading ] = React.useState( false );

    const handleEmailLogin = async ( e ) => {
        e.preventDefault();
        setLoading( true );
        setError( '' );

        try {
            await login( email, password );
            navigate( '/' );
        } catch ( err ) {
            setError( err.response?.data?.message || 'Invalid credentials. Please try again.' );
        } finally {
            setLoading( false );
        }
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

    return (
        <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-neutral-100 p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-semibold text-gray-900">Welcome Back</h1>
                    <p className="text-gray-500">Sign in to continue to KarSafar</p>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-gray-700 block mb-1">
                            Email
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaUser className="text-gray-400" />
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
                        <label htmlFor="password" className="text-sm font-medium text-gray-700 block mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaLock className="text-gray-400" />
                            </div>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={( e ) => setPassword( e.target.value )}
                                className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                Remember me
                            </label>
                        </div>

                        <div className="text-sm">
                            <a href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                                Forgot password?
                            </a>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${ loading ? 'opacity-70 cursor-not-allowed' : '' }`}
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or continue with</span>
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
                    <span className="font-medium">Sign in with Google</span>
                </button>

                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                            Sign up
                        </Link>
                    </p>
                </div>

                <p className="text-center text-xs text-gray-500 mt-8">
                    By continuing, you agree to our{' '}
                    <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
                </p>
            </div>
        </section>
    );
};

export default Login;