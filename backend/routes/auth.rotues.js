import express  from "express";
import { checkAuthenticated, logout, sendOTP, updateProfile, verifyOTP } from "../controllers/authentication.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { multerMiddleware } from "../config/cloudinary.config.js";

const router=express.Router();

router.post('/send-otp',sendOTP);
router.post('/verify-otp',verifyOTP);
router.get('/logout',logout);

//protected route
router.put('/update-profile',authMiddleware,multerMiddleware,updateProfile);
router.get('/check-auth',authMiddleware,checkAuthenticated)

export  {router as authRouter};
