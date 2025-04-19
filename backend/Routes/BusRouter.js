import express from "express";
import { handleBusDetailGet, handleBusListGet, handleBusSeatGet } from "../Controllers/BusController.js";
const busRouter = express.Router();

busRouter
    .route( "/list" )
    .get( handleBusListGet );

busRouter
    .route( "/:busId" )
    .get( handleBusDetailGet );

busRouter
    .route( "/:busId/seats" )
    .get( handleBusSeatGet );


export default busRouter;