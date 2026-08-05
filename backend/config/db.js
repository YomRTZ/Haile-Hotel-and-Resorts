const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,  // fail fast — don't block startup
            socketTimeoutMS: 10000,
        });
        isConnected = true;
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('⚠️  MongoDB connection failed:', error.message);
        console.warn('   Running without database — chat history will not be persisted.');
        // Do NOT call process.exit — the chatbot works fine without MongoDB
        // (keyword lookups and templates need no DB)
    }
};

/** Returns true if mongoose is currently connected */
const isDBConnected = () =>
    mongoose.connection.readyState === 1;

module.exports = connectDB;
module.exports.isDBConnected = isDBConnected;
