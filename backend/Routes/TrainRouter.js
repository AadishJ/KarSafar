import express from "express";
import { handleTrainListGet } from "../Controllers/TrainController.js";
const trainRouter = express.Router();

trainRouter
    .route( "/list" )
    .get( handleTrainListGet )


export default trainRouter;