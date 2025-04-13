import express from "express";
import { handleLoginGet, handleLoginPost, handleLogoutGet, handleLoginGooglePost, handleRegisterPost } from "../Controllers/UserController.js";
import { authUser } from "../Middlewares/auth.js";
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
    .get( authUser, handleLogoutGet );
    
userRouter
    .route( "/google/login" )
    .post(handleLoginGooglePost)
    

export default userRouter;