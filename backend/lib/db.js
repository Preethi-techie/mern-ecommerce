import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.Mongo_URI);
        console.log(`Mongodb connected : ${conn.connection.host}`);
     } catch(error) {
        console.log("Error connecting to MONGODB", error.message);
        process.exit(1);
        
    }
}