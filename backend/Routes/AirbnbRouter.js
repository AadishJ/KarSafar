import express from "express";
import { handleAirbnbListGet } from "../Controllers/AirbnbController.js";
const airbnbRouter = express.Router();

airbnbRouter
    .route( "/list" )
    .get( handleAirbnbListGet )


export default airbnbRouter;