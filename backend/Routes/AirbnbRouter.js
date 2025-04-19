import express from "express";
import {
    handleAirbnbListGet,
    handleAirbnbDetailGet,
    handleAirbnbAvailabilityCheck,
} from "../Controllers/AirbnbController.js";
const airbnbRouter = express.Router();

airbnbRouter
    .route( "/list" )
    .get( handleAirbnbListGet );

airbnbRouter
    .route( "/:airbnbId" )
    .get( handleAirbnbDetailGet );

airbnbRouter
    .route( "/:airbnbId/availability" )
    .get( handleAirbnbAvailabilityCheck );


export default airbnbRouter;