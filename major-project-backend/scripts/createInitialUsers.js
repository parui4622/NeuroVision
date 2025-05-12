const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const config = require('../config');
const User = require('../models/User');

async function createInitialUsers() {
    try {
        await mongoose.connect(config.MONGODB_URI, config.DB_OPTIONS);
        console.log('Connected to MongoDB');

        // Create admin user
        const adminPassword = await bcrypt.hash('admin123', 10);
        const admin = new User({
            name: 'Admin User',
            email: 'admin@example.com',
            password: adminPassword,
            role: 'admin'
        });

        // Create doctor user
        const doctorPassword = await bcrypt.hash('doctor123', 10);
        const doctor = new User({
            name: 'Dr. John Smith',
            email: 'doctor@example.com',
            password: doctorPassword,
            role: 'doctor'
        });

        // Create patient user
        const patientPassword = await bcrypt.hash('patient123', 10);
        const patient = new User({
            name: 'Patient User',
            email: 'patient@example.com',
            password: patientPassword,
            role: 'patient'
        });

        // Save the users
        await User.deleteMany({}); // Clear existing users
        await admin.save();
        await doctor.save();
        await patient.save();

        console.log('Initial users created successfully');
        console.log('Admin credentials: admin@example.com / admin123');
        console.log('Doctor credentials: doctor@example.com / doctor123');
        console.log('Patient credentials: patient@example.com / patient123');

    } catch (error) {
        console.error('Error creating initial users:', error);
    } finally {
        await mongoose.connection.close();
    }
}

createInitialUsers();
