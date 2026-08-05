const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    messages: [{
        role: {
            type: String,
            enum: ['user', 'assistant', 'system'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    userInfo: {
        name: String,
        email: String,
        phone: String,
        ipAddress: String,
        userAgent: String
    },
    metadata: {
        totalMessages: {
            type: Number,
            default: 0
        },
        lastInteraction: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamps and metadata on save
chatSessionSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    if (this.messages) {
        this.metadata.totalMessages = this.messages.length;
        this.metadata.lastInteraction = new Date();
    }
    next();
});

// Indexes for faster queries
// Note: sessionId is already indexed via unique:true on the field definition
chatSessionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
