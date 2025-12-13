const mongoose = require('mongoose');

// Global variable to cache the connection across function executions (warm starts)
let cachedPromise = null;

const connectToDatabase = async () => {
    // Return existing connection promise if available
    if (cachedPromise) {
        return cachedPromise;
    }

    // Use COSMOS_CONNECTION_STRING if available, otherwise fallback to MONGO_URI
    const connectionString = process.env.COSMOS_CONNECTION_STRING || process.env.MONGO_URI;

    if (!connectionString) {
        throw new Error('Database connection string is missing. Please set COSMOS_CONNECTION_STRING or MONGO_URI.');
    }

    // Configure Mongoose options for Cosmos DB
    const options = {
        // Cosmos DB specific recommendations
        maxPoolSize: 10, // Limit connections in serverless to avoid excessive usage
        socketTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        waitQueueTimeoutMS: 30000,
        serverSelectionTimeoutMS: 30000,
    };

    // Store the promise so simultaneous calls wait for the same connection
    cachedPromise = mongoose.connect(connectionString, options)
        .then((mongooseInstance) => {
            console.log('✅ New database connection established');
            return mongooseInstance;
        })
        .catch((err) => {
            console.error('❌ Database connection failed:', err);
            cachedPromise = null; // Reset cache on failure
            throw err;
        });

    return cachedPromise;
};

module.exports = { connectToDatabase };
