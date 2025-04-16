import express from "express";
import { handleBookingsListGet, handleFlightBookPost } from "../Controllers/BookingController.js";
const bookingRouter = express.Router();

bookingRouter
    .route( "/flight/:id" )
    .post( handleFlightBookPost );

bookingRouter
    .route( "/list" )
    .get( handleBookingsListGet );


export default bookingRouter;