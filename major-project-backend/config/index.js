require('dotenv').config();
const mongoose = require('mongoose');

const config = {
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/Alzheimers_Database',
    PORT: process.env.PORT || 5000,
    JWT_SECRET: process.env.JWT_SECRET || 'alzheimers-detection-system-secret-2025',
    DB_OPTIONS: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
};

// MongoDB Connection Events
mongoose.connection.on('connected', () => {
    console.log('MongoDB Connection Established');
    console.log('Database Name:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    console.log('Port:', mongoose.connection.port);
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB Connection Error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB Connection Disconnected');
});

// Handle application termination
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB Connection Closed');
    process.exit(0);
});

module.exports = config;
