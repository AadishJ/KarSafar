import express from "express";
import { handleHotelListGet } from "../Controllers/HotelController.js";
const hotelRouter = express.Router();

hotelRouter
    .route( "/list" )
    .get( handleHotelListGet )


export default hotelRouter;