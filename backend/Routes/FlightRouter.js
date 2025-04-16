import express from "express";
import { handleFlightDetailGet, handleFlightListGet, handleFlightsSeatGet } from "../Controllers/FlightController.js";
const flightRouter = express.Router();

flightRouter
    .route( "/list" )
    .get( handleFlightListGet );

flightRouter
    .route( "/:flightId" )
    .get( handleFlightDetailGet );

flightRouter
    .route( "/:flightId/seats" )
    .get( handleFlightsSeatGet );


export default flightRouter;