import axios from 'axios';
import Cookies from 'js-cookie';
const axiosInstance = axios.create( {
    baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
} );

axiosInstance.interceptors.request.use( config => {
    try {
        const token = Cookies.get( 'user' );

        if ( token ) {
            config.headers.Authorization = `Bearer ${ token }`;
        }
    } catch ( error ) {
        console.error( 'Error setting auth header:', error );
    }
    return config;
}, error => {
    return Promise.reject( error );
} );

export default axiosInstance;