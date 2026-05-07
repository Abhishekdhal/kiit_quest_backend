const mongoose = require('mongoose');
require('dotenv').config();

// Global isConnected variable to cache the connection in serverless environments
let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        console.log('MongoDB is already connected (using cached connection)');
        return;
    }

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        });
        
        isConnected = conn.connections[0].readyState === 1;
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        // Do NOT use process.exit(1) in serverless, it kills the container ungracefully
        // and results in missing CORS headers on the gateway response, causing "Failed to fetch"
    }
};

module.exports = connectDB;