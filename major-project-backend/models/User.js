const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true }, // Removed unique constraint
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
        medicalHistory: [String],
        serial: { type: String, unique: true, sparse: true }
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
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    meta: {
        reportCount: { type: Number, default: 0 },
        successfulScans: { type: Number, default: 0 },
        failedScans: { type: Number, default: 0 }
    }
});

// Adding compound indexes for better filtering and sorting
userSchema.index({ role: 1, status: 1 });
userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ 'doctorInfo.isVerified': 1, role: 1 });

// Check if any index exists on email field and remove it
userSchema.collection.dropIndex('email_1', function(err, result) {
  if (err && err.code !== 27) {
    console.log('Error dropping email index:', err);
  } else {
    console.log('Successfully ensured email is not unique');
  }
});

// Virtual field to help in MongoDB Compass visualization
userSchema.virtual('userType').get(function() {
    if (this.role === 'doctor') {
        return `Doctor - ${this.doctorInfo.specialty || 'Unspecified'}`;
    } else if (this.role === 'patient') {
        return 'Patient';
    } else if (this.role === 'admin') {
        return 'Admin';
    }
    return this.role;
});

// Ensure virtuals are included in JSON output
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
