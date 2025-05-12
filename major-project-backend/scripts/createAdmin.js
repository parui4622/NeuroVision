const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const config = require('../config');
const User = require('../models/User');

async function createAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Admin credentials
        const adminData = {
            name: 'Sourabh Parui',
            email: 'admin@alzheimers.com',
            password: 'admin123',  // This will be hashed
            role: 'admin'
        };

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminData.email });
        if (existingAdmin) {
            console.log('Admin user already exists');
            return;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(adminData.password, 10);

        // Create admin user with timestamps
        const admin = new User({
            name: adminData.name,
            email: adminData.email,
            password: hashedPassword,
            role: adminData.role,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Save the admin user
        const savedAdmin = await admin.save();
        
        if (savedAdmin) {
            console.log('Admin user created successfully');
            console.log('Use these credentials to login:');
            console.log('Email:', adminData.email);
            console.log('Password:', adminData.password);
            console.log('Role: Admin');
        } else {
            console.error('Failed to save admin user');
        }
    } catch (error) {
        console.error('Error creating admin:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the function
createAdmin();
