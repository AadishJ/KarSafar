import express from "express";
import { handleCruiseDetailGet, handleCruiseListGet, handleCruiseSeatGet } from "../Controllers/CruiseController.js";
const cruiseRouter = express.Router();

cruiseRouter
    .route( "/list" )
    .get( handleCruiseListGet );

cruiseRouter
    .route( "/:cruiseId" )
    .get( handleCruiseDetailGet );
    
cruiseRouter
    .route( "/:cruiseId/seats" )
    .get( handleCruiseSeatGet );
    


export default cruiseRouter;