const mongoose = require("mongoose");

let isConnected = false;

async function connectToDatabase() {
  if (isConnected) {
    return;
  }

  try {
    mongoose.set("strictQuery", false);

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // ⏱ prevents Azure startup hang
    });

    isConnected = true;
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    // IMPORTANT: do NOT crash Azure container
  }
}

module.exports = { connectToDatabase };
