const mongoose = require("mongoose");

let isConnected = false;

async function connectToDatabase() {
    if (isConnected) {
        console.log("⚠️ MongoDB usage: Already connected.");
        return;
    }

    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error("❌ FATAL: MONGO_URI is missing in environment variables!");
        return;
    }

    try {
        console.log("⏳ Connecting to MongoDB/CosmosDB...");

        // Masked URI for debugging (show protocol and host only)
        const maskedUri = mongoUri.replace(/(:[^:@]+)@/, ":****@");
        console.log(`🔌 Connection String: ${maskedUri}`);

        mongoose.set("strictQuery", false);

        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            family: 4 // Force IPv4 (sometimes fixes Azure timeout issues)
        });

        isConnected = true;
        console.log("✅ MongoDB/CosmosDB Connected Successfully!");

        // Connection event listeners for runtime debugging
        mongoose.connection.on('error', err => {
            console.error("🔥 Runtime DB Error:", err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn("⚠️ DB Disconnected");
            isConnected = false;
        });

    } catch (error) {
        console.error("❌ DB Connection Failed:");
        console.error(`Status: ${error.name}, Code: ${error.code}`);
        console.error(`Message: ${error.message}`);
        // Do not crash the app, but logs will show why it failed
    }
}

module.exports = { connectToDatabase };
