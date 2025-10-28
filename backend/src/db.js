import mongoose from "mongoose";

export async function connectDB(uri) {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri, {
        maxPoolSize: 50,               // concurrent sockets to Mongo,
        serverSelectionTimeoutMS: 15000
    });
    console.log("✅ MongoDB connected");
}
