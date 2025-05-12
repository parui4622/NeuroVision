const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    isValid: {
        type: Boolean,
        default: true
    },
    deviceInfo: {
        type: String
    }
}, {
    timestamps: true
});

// Add index for faster queries and automatic deletion after 24 hours
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 24 hours
sessionSchema.index({ token: 1 }, { unique: true });

module.exports = mongoose.model('Session', sessionSchema);
