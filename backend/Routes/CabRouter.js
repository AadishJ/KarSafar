import express from "express";
import { handleCabDetailGet, handleCabListGet, handleCabSeatGet } from "../Controllers/CabController.js";
const cabRouter = express.Router();

cabRouter
    .route( "/list" )
    .get( handleCabListGet );

cabRouter
    .route( "/:cabId" )
    .get( handleCabDetailGet );

cabRouter
    .route( "/:cabId/seats" )
    .get( handleCabSeatGet );



export default cabRouter;