const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        console.error('❌ MONGO_URI is not set. Add it to your .env file.');
        // Don't crash — fall through to in-memory fallback mode
        return;
    }

    try {
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 8000,
            socketTimeoutMS: 30000,
            // Atlas recommends these for production
            maxPoolSize: 10,
            retryWrites: true,
        });

        const host = conn.connection.host;
        const db   = conn.connection.name;
        const isAtlas = host.includes('mongodb.net');

        console.log(`✅ MongoDB connected: ${isAtlas ? '☁️  Atlas' : '🏠 Local'} — ${host} / ${db}`);
    } catch (err) {
        console.error('⚠️  MongoDB connection failed:', err.message);
        if (!uri.includes('mongodb.net')) {
            console.warn('   Local: make sure mongod is running.');
        } else {
            console.warn('   Atlas: check your MONGO_URI, network access, and IP whitelist.');
        }
        console.warn('   Running without DB — chat history will not be persisted.');
        // Do NOT exit — keyword responses work without MongoDB
    }
};

const isDBConnected = () => mongoose.connection.readyState === 1;

module.exports = connectDB;
module.exports.isDBConnected = isDBConnected;
