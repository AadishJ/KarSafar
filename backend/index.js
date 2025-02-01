import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 4000;
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split( "," ) || [];
const corsOptions = {
    origin: ( origin, callback ) => {
        if ( allowedOrigins.includes( origin ) || !origin ) {
            callback( null, true );
        } else {
            callback( new Error( "Not allowed by CORS" ) );
        }
    },
    credentials: true,
    methods: [ "GET", "POST", "PUT", "DELETE", "OPTIONS" ],
    allowedHeaders: [ "Content-Type", "Authorization" ]
};

app.use( cookieParser() );
app.use( express.json() );
app.use( cors( corsOptions ) );

app.get( "/", ( req, res ) => {
    res.send( "Hello World" );
} );

app.listen( PORT, () => {
    console.log( `Server is running on port ${PORT}` );
} );
