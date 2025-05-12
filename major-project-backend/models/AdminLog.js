const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true
    },
    value: mongoose.Schema.Types.Mixed,
    timestamp: {
        type: Date,
        default: Date.now
    },
    details: Object,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('AdminLog', adminLogSchema);
