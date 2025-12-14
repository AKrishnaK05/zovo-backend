const mongoose = require("mongoose");

let isConnected = false;

async function connectToDatabase() {
  if (isConnected) {
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined");
  }

  try {
    mongoose.set("strictQuery", true);

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // 🔴 IMPORTANT: prevents Azure hang
    });

    isConnected = true;
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    throw error;
  }
}

module.exports = { connectToDatabase };
