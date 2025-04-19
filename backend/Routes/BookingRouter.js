import express from "express";
import { handleBookingsListGet, handleBusBookPost, handleFlightBookPost, handleTrainBookPost } from "../Controllers/BookingController.js";
const bookingRouter = express.Router();

bookingRouter
    .route( "/flight/:id" )
    .post( handleFlightBookPost );

bookingRouter
    .route( "/train/:id" )
    .post( handleTrainBookPost );

bookingRouter
    .route( "/bus/:id" )
    .post( handleBusBookPost );

bookingRouter
    .route( "/list" )
    .get( handleBookingsListGet );


export default bookingRouter;