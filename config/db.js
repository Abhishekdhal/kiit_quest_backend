const mongoose = require('mongoose');
require('dotenv').config();

// Global isConnected variable to cache the connection in serverless environments
let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        console.log('MongoDB is already connected (using cached connection)');
        return;
    }

    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kiit_quest';
    if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
        console.warn('⚠️ MONGO_URI not set; attempting default local MongoDB connection.');
    }

    try {
        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
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