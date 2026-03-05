const mongoose = require('mongoose');

// Temporary user storage until email is verified
const pendingUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // already hashed by controller
  otp: { type: String, required: true },
  role: { type: String, enum: ['admin', 'doctor', 'patient'], default: 'patient' },
  patientInfo: {
    dateOfBirth: { type: Date },
    gender: { type: String },
    medicalHistory: [String],
    serial: { type: String }
  },
  createdAt: { type: Date, default: Date.now, expires: 600 } // TTL index: 10 minutes
});
// No pre-save hashing: controller hashes password before creating PendingUser

// Index for faster lookups
// Removed redundant index for email, 'unique: true' already creates an index.

// Strip sensitive fields from any serialization to avoid accidents
pendingUserSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.emailVerificationOTP;
    delete ret.otpExpiry;
    return ret;
  }
});
pendingUserSchema.set('toObject', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.emailVerificationOTP;
    delete ret.otpExpiry;
    return ret;
  }
});

module.exports = mongoose.model('PendingUser', pendingUserSchema);
