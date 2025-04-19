import express from "express";
import { handleTrainDetailGet, handleTrainListGet, handleTrainSeatGet } from "../Controllers/TrainController.js";
const trainRouter = express.Router();

trainRouter
    .route( "/list" )
    .get( handleTrainListGet );

trainRouter
    .route( "/:trainId" )
    .get( handleTrainDetailGet );

trainRouter
    .route( "/:trainId/seats" )
    .get( handleTrainSeatGet );



export default trainRouter;