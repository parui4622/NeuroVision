const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['admin', 'doctor', 'patient'],
        default: 'patient',
        required: true
    },
    // Doctor specific fields
    doctorInfo: {
        licenseNumber: { type: String },
        specialty: { type: String },
        hospital: { type: String },
        yearsOfExperience: { type: Number },
        education: { type: String },
        isVerified: { type: Boolean, default: false }
    },
    // Patient specific fields
    patientInfo: {
        dateOfBirth: { type: Date },
        gender: { type: String },
        medicalHistory: [String]
    },
    // Google Auth fields
    googleId: { type: String },
    picture: { type: String },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    assignedDoctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    specialty: {
        type: String,
        required: function() { return this.role === 'doctor'; }
    },
    hospital: String,
    lastScanDate: Date,
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    meta: {
        reportCount: { type: Number, default: 0 },
        successfulScans: { type: Number, default: 0 },
        failedScans: { type: Number, default: 0 }
    }
});

module.exports = mongoose.model('User', userSchema);
