import express from "express";
import { handleCabListGet } from "../Controllers/CabController.js";
const cabRouter = express.Router();

cabRouter
    .route( "/list" )
    .get( handleCabListGet )


export default cabRouter;