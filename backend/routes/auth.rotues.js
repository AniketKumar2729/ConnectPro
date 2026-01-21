import express  from "express";
import { sendOTP, updateProfile, verifyOTP } from "../controllers/authentication.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { multerMiddleware } from "../config/cloudinary.config.js";

const router=express.Router();

router.post('/send-otp',sendOTP);
router.post('/verify-otp',verifyOTP);

//protected route
router.put('/update-profile',authMiddleware,multerMiddleware,updateProfile)

export  {router as authRouter};
