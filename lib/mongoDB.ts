import mongoose from "mongoose";

let isConnected: boolean = false;

// Connect to MongoDB
export const connectToDB = async (): Promise<void> => {
  // Set strictQuery to true to prevent queries on non-existing fields
  mongoose.set("strictQuery", true);

  if (isConnected) {
    console.log("mongoDB is already connected");
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URL || "", {
      dbName: "Granaina_Admin",
    });
    isConnected = true;
    console.log("mongoDB is connected");
  } catch (err) {
    console.error(err);
  }
};
