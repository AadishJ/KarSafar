import express from "express";
import { handleLoginGet, handleLoginPost, handleRegisterPost } from "../Controllers/UserController.js";
const userRouter = express.Router();

userRouter
    .route( "/login" )
    .get( handleLoginGet )
    .post( handleLoginPost );

userRouter
    .route( "/register" )
    .post( handleRegisterPost );

export default userRouter;