const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const config = require('./config');
require('dotenv').config();

// MongoDB Connection Options
mongoose.set('strictQuery', false);

const authRoutes = require('./routes/auth');
const predictRoutes = require('./routes/predict');

const app = express();

// CORS Configuration
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' })); // Increased limit for image uploads

// Connect to MongoDB with proper configurations
mongoose.connect(config.MONGODB_URI, config.DB_OPTIONS)
  .then(() => {
    console.log('Connected to MongoDB successfully');
    console.log('Connection Details:');
    console.log('- Database:', mongoose.connection.name);
    console.log('- Host:', mongoose.connection.host);
    console.log('- Port:', mongoose.connection.port);
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/admin', require('./routes/admin'));

// Add a test route
app.get('/', (req, res) => {
    res.json({ message: 'Backend server is running successfully' });
});

// Add health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const startServer = async (port) => {
    try {
        const server = await new Promise((resolve, reject) => {
            const server = app.listen(port)
                .once('error', (err) => {
                    if (err.code === 'EADDRINUSE') {
                        console.log(`Port ${port} is busy, trying ${port + 1}...`);
                        server.close();
                        resolve(startServer(port + 1));
                    } else {
                        reject(err);
                    }
                })
                .once('listening', () => {
                    console.log(`Server running on http://localhost:${port}`);
                    console.log('Available routes:');
                    console.log('- /health (GET)');
                    console.log('- /api/auth/signup (POST)');
                    console.log('- /api/auth/login (POST)');
                    resolve(server);
                });
        });
        return server;
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

const PORT = process.env.PORT || 5000;
startServer(PORT).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
