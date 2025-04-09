import { pool } from '../Config/ConnectDB.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const handleLoginGet = async ( req, res ) => { 

}

const handleLoginPost = async ( req, res ) => { 

}

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

        res.status( 201 ).json( {
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: userId,
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
const handleLogout = async ( req, res ) => { 

}

export { handleLoginGet, handleLoginPost, handleRegisterPost, handleLogout };