import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectionDB from "./config/db.config.js";

dotenv.config();

const PORT=process.env.PORT;
 const app=express();

 // database connection
 connectionDB();
 app.listen(PORT,()=>{
console.log(`server running on ${PORT} port number`)
 });