const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false  // Doctor might be added later
    },
    classification: {
        type: String,
        required: true,
        enum: ['AD', 'CN', 'EMCI', 'LMCI']  // Alzheimer's Disease, Control Normal, Early Mild Cognitive Impairment, Late Mild Cognitive Impairment
    },
    classificationDetails: {
        AD: { type: Number, default: 0 },    // Probability scores for each class
        CN: { type: Number, default: 0 },
        EMCI: { type: Number, default: 0 },
        LMCI: { type: Number, default: 0 }
    },
    image: {
        type: String,  // Base64 encoded image data (first 100 chars only for reference)
        required: true
    },
    notes: {
        type: String,
        default: ''
    },
    doctorNotes: {
        type: String,
        default: ''
    },
    recommendedMedications: [String],
    recommendedTherapies: [String],
    followUpDate: Date,
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'archived'],
        default: 'pending'
    },
    reviewedAt: Date,
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
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

// Add indexes for efficient retrieval
reportSchema.index({ patient: 1, createdAt: -1 });
reportSchema.index({ doctor: 1, createdAt: -1 });
reportSchema.index({ classification: 1 });
reportSchema.index({ status: 1 });

module.exports = mongoose.model('Report', reportSchema);
