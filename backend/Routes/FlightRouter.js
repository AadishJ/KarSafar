import express from "express";
import { handleFlightListGet } from "../Controllers/FlightController.js";
const flightRouter = express.Router();

flightRouter
    .route( "/list" )
    .get( handleFlightListGet)


export default flightRouter;