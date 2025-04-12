import express from "express";
import { handleCruiseListGet } from "../Controllers/CruiseController.js";
const cruiseRouter = express.Router();

cruiseRouter
    .route( "/list" )
    .get( handleCruiseListGet )


export default cruiseRouter;