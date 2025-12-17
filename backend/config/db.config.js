import mongoose from "mongoose";
 
const connectionDB=async()=>{
    try {
        await mongoose.connect(process.env.MongoDB_Url);
        console.log("DB connected successfully");
    } catch (error) {
        console.error("error connecting DB",error.message);
        process.exit(1);
    }
}

export default connectionDB;