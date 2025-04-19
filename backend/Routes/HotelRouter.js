import express from "express";
import {
    handleHotelListGet,
    handleHotelDetailGet,
    handleHotelRoomAvailabilityGet,
} from "../Controllers/HotelController.js";
const hotelRouter = express.Router();

hotelRouter
    .route( "/list" )
    .get( handleHotelListGet );

hotelRouter
    .route( "/:hotelId" )
    .get( handleHotelDetailGet );

hotelRouter
    .route( "/:hotelId/rooms" )
    .get( handleHotelRoomAvailabilityGet );


export default hotelRouter;