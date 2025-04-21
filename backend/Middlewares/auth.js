import jwt from 'jsonwebtoken';

const authUser = async ( req, res, next ) => {
    // First check for cookie
    const token = req.cookies.user;

    // If no cookie, check Authorization header
    const authHeader = req.headers.authorization;
    let finalToken = token;

    if ( !finalToken && authHeader && authHeader.startsWith( 'Bearer ' ) ) {
        finalToken = authHeader.split( ' ' )[ 1 ];
    }

    if ( !finalToken ) {
        return res.status( 401 ).json( { success: false, message: 'Please Login' } );
    }

    try {
        const decoded = jwt.verify( finalToken, process.env.JWT_SECRET );
        req.body.userId = decoded.id;
        next();
    } catch ( error ) {
        console.log( error );
        res.status( 401 ).json( { success: false, message: error.message } );
    }
}

export { authUser };