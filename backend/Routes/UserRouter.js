import express from "express";
import { handleLoginGet, handleLoginPost, handleLogout, handleRegisterPost } from "../Controllers/UserController.js";
const userRouter = express.Router();

userRouter
    .route( "/login" )
    .get( handleLoginGet )
    .post( handleLoginPost );

userRouter
    .route( "/register" )
    .post( handleRegisterPost );

userRouter
    .route( "/logout" )
    .get(handleLogout);

export default userRouter;