import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";
import userRouter from "./Routes/UserRouter.js";
import { connectDB } from "./Config/ConnectDB.js";
import flightRouter from "./Routes/FlightRouter.js";
import trainRouter from "./Routes/TrainRouter.js";
import busRouter from "./Routes/BusRouter.js";
import cabRouter from "./Routes/CabRouter.js";
import cruiseRouter from "./Routes/CruiseController.js";
import hotelRouter from "./Routes/HotelRouter.js";
import airbnbRouter from "./Routes/AirbnbRouter.js";

const app = express();
connectDB();
const PORT = process.env.PORT || 5000;
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
app.use( express.urlencoded( { extended: true } ) );
app.use( cors( corsOptions ) );

app.use( "/auth", userRouter );
app.use( "/flight", flightRouter );
app.use( "/train", trainRouter );
app.use( "/bus", busRouter );
app.use( "/cab", cabRouter );
app.use( "/cruise", cruiseRouter );
app.use( "/hotel", hotelRouter );
app.use( "/airbnb", airbnbRouter );

app.get( "/", ( req, res ) => {
    res.send( "Hello World" );
} );

app.listen( PORT, () => {
    console.log( `Server is running on port ${PORT}` );
} );
