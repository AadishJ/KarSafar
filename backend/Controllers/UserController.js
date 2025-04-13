import { pool } from '../Config/ConnectDB.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { oAuthGoogleClient } from '../Config/oAuth.js';

const handleLoginGet = async ( req, res ) => {
    try {
        // Extract user ID from JWT token
        const token = req.cookies.user || req.headers.authorization?.split( ' ' )[ 1 ];

        if ( !token ) {
            return res.status( 401 ).json( {
                success: false,
                message: 'Authentication required'
            } );
        }

        // Verify the token
        const decoded = jwt.verify( token, process.env.JWT_SECRET || 'your_jwt_secret' );

        // Get user from database
        const [ users ] = await pool.execute(
            'SELECT HEX(userId) as userId, firstName, lastName, email, phoneNo, profilePicture FROM users WHERE userId = UNHEX(?)',
            [ decoded.id ]
        );

        if ( users.length === 0 ) {
            return res.status( 404 ).json( {
                success: false,
                message: 'User not found'
            } );
        }

        const user = users[ 0 ];

        return res.status( 200 ).json( {
            success: true,
            user: {
                id: user.userId.toLowerCase(), // Ensure consistent format
                name: `${ user.firstName } ${ user.lastName }`.trim(),
                email: user.email,
                phone: user.phoneNo,
                profilePicture: user.profilePicture
            }
        } );
    } catch ( error ) {
        console.error( 'Get user error:', error );

        if ( error.name === 'TokenExpiredError' ) {
            return res.status( 401 ).json( {
                success: false,
                message: 'Session expired, please login again'
            } );
        } else if ( error.name === 'JsonWebTokenError' ) {
            return res.status( 401 ).json( {
                success: false,
                message: 'Invalid authentication'
            } );
        }

        return res.status( 500 ).json( {
            success: false,
            message: 'Server error while fetching user data',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
};

const handleLoginPost = async ( req, res ) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if ( !email || !password ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Please provide email and password'
            } );
        }

        // Find user by email
        const [ users ] = await pool.execute(
            'SELECT HEX(userId) as userId, firstName, lastName, email, phoneNo, password, profilePicture FROM users WHERE email = ?',
            [ email ]
        );

        if ( users.length === 0 ) {
            return res.status( 401 ).json( {
                success: false,
                message: 'Invalid email or password'
            } );
        }

        const user = users[ 0 ];

        // Compare passwords
        const isMatch = await bcrypt.compare( password, user.password );

        if ( !isMatch ) {
            return res.status( 401 ).json( {
                success: false,
                message: 'Invalid email or password'
            } );
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.userId },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '7d' }
        );

        // Set HTTP-only cookie with the token
        res.cookie( 'user', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: 'strict'
        } );

        // Return user data and token
        res.status( 200 ).json( {
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.userId.toLowerCase(), // Ensure consistent format
                name: `${ user.firstName } ${ user.lastName }`.trim(),
                email: user.email,
                phone: user.phoneNo,
                profilePicture: user.profilePicture
            }
        } );
    } catch ( error ) {
        console.error( 'Login error:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Server error during login',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
};

const handleRegisterPost = async ( req, res ) => {
    try {
        const { name, email, password, phone } = req.body;

        if ( !name || !email || !password || !phone ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Please provide all required fields'
            } );
        }

        const [ existingUsers ] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [ email ]
        );

        if ( existingUsers.length > 0 ) {
            return res.status( 400 ).json( {
                success: false,
                message: 'Email already in use'
            } );
        }

        const nameParts = name.split( ' ' );
        const firstName = nameParts[ 0 ];
        const lastName = nameParts.length > 1 ? nameParts.slice( 1 ).join( ' ' ) : '';

        const salt = await bcrypt.genSalt( 10 );
        const hashedPassword = await bcrypt.hash( password, salt );

        // Generate UUID without hyphens
        const userId = uuidv4().replace( /-/g, '' );

        await pool.execute(
            'INSERT INTO users (userId, firstName, lastName, phoneNo, email, password) VALUES (UNHEX(?), ?, ?, ?, ?, ?)',
            [ userId, firstName, lastName, phone, email, hashedPassword ]
        );

        const token = jwt.sign(
            { id: userId },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '7d' }
        );

        // Set HTTP-only cookie with the token
        res.cookie( 'user', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: 'strict'
        } );

        res.status( 201 ).json( {
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: userId.toLowerCase(), // Use the UUID directly, not the DB's hex representation
                name: `${ firstName } ${ lastName }`.trim(),
                email,
                phone
            }
        } );
    } catch ( error ) {
        console.error( 'Register error:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Server error during registration',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
};

const handleLogoutGet = async ( req, res ) => {
    try {
        // Clear the cookie
        res.clearCookie( 'user', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        } );

        res.status( 200 ).json( {
            success: true,
            message: 'Logged out successfully'
        } );
    } catch ( error ) {
        console.error( 'Logout error:', error );
        res.status( 500 ).json( {
            success: false,
            message: 'Server error during logout',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
};

const handleLoginGooglePost = async ( req, res ) => {
    const { code } = req.body;
    try {
        // Get tokens using the authorization code with explicit redirect URI
        const { tokens } = await oAuthGoogleClient.getToken( {
            code: code,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI
        } );

        const idToken = tokens.id_token;
        if ( !idToken ) {
            return res.status( 400 ).json( {
                success: false,
                error: "ID Token missing"
            } );
        }

        // Verify the ID token
        let ticket;
        try {
            ticket = await oAuthGoogleClient.verifyIdToken( {
                idToken: idToken,
                audience: process.env.GOOGLE_ID
            } );
        } catch ( error ) {
            console.error( "OAuth Error:", error );
            return res.status( 400 ).json( {
                success: false,
                error: "OAuth Error"
            } );
        }

        const payload = ticket.getPayload();
        if ( !payload ) {
            console.error( "OAuth Error: Payload missing" );
            return res.status( 400 ).json( {
                success: false,
                error: "OAuth Error: Payload missing"
            } );
        }

        // Extract user information from Google payload
        const name = payload.name;
        const email = payload.email;
        const picture = payload.picture;

        // Check if user exists in database
        const [ existingUsers ] = await pool.execute(
            'SELECT HEX(userId) as userId, firstName, lastName, email, phoneNo, profilePicture FROM users WHERE email = ?',
            [ email ]
        );

        let userId, firstName, lastName;

        if ( existingUsers.length === 0 ) {
            // User doesn't exist, create a new account

            // Split name into first and last name
            const nameParts = name.split( ' ' );
            firstName = nameParts[ 0 ];
            lastName = nameParts.length > 1 ? nameParts.slice( 1 ).join( ' ' ) : '';

            // Generate UUID without hyphens
            userId = uuidv4().replace( /-/g, '' );

            // Default password for Google users (will be hashed)
            const defaultPassword = "googleuser";
            const salt = await bcrypt.genSalt( 10 );
            const hashedPassword = await bcrypt.hash( defaultPassword, salt );

            // Default phone number
            const defaultPhone = "+911111111111";

            // Insert new user
            await pool.execute(
                'INSERT INTO users (userId, firstName, lastName, phoneNo, email, password, profilePicture) VALUES (UNHEX(?), ?, ?, ?, ?, ?, ?)',
                [ userId, firstName, lastName, defaultPhone, email, hashedPassword, picture ]
            );

        } else {
            // User exists, use existing data
            const user = existingUsers[ 0 ];
            userId = user.userId;

            // Update profile picture if it's changed or not set
            if ( !user.profilePicture || user.profilePicture !== picture ) {
                await pool.execute(
                    'UPDATE users SET profilePicture = ? WHERE userId = UNHEX(?)',
                    [ picture, userId ]
                );
            }

            // Extract first and last name from existing user
            const nameParts = user.firstName && user.lastName ?
                [ user.firstName, user.lastName ] : name.split( ' ' );
            firstName = nameParts[ 0 ];
            lastName = nameParts.length > 1 ? nameParts[ 1 ] : '';
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: userId },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '7d' }
        );

        // Set HTTP-only cookie with the token
        res.cookie( 'user', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: 'strict'
        } );

        // Return success with user data
        return res.status( 200 ).json( {
            success: true,
            message: 'Google authentication successful',
            token,
            user: {
                id: userId.toLowerCase(),
                name: `${ firstName } ${ lastName }`.trim(),
                email,
                profilePicture: picture
            }
        } );

    } catch ( error ) {
        console.error( "Google Login Error:", error );
        return res.status( 500 ).json( {
            success: false,
            message: 'Server error during Google authentication',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        } );
    }
};
export { handleLoginGet, handleLoginPost, handleRegisterPost, handleLogoutGet, handleLoginGooglePost };