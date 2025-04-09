import express from "express";
import { handleBusListGet } from "../Controllers/BusController.js";
const busRouter = express.Router();

busRouter
    .route( "/list" )
    .get( handleBusListGet )


export default busRouter;