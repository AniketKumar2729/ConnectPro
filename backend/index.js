import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectionDB from "./config/db.config.js";
import { authRouter } from "./routes/auth.rotues.js";


dotenv.config();

const PORT=process.env.PORT;
 const app=express();


 //Middleware
 app.use(express.json());//parse the body data
 app.use(cookieParser());//parse token on every request
 app.use(bodyParser.urlencoded({extended:true}));


 // database connection
 connectionDB();

//Routes
app.use('/api/auth',authRouter);


 app.listen(PORT,()=>{
console.log(`server running on ${PORT} port number`)
 });