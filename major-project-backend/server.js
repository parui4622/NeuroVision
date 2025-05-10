const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const predictRoutes = require('./routes/predict');

const app = express();

// CORS Configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Updated frontend URL for Vite
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' })); // Increased limit for image uploads

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', predictRoutes);

// Add a test route
app.get('/', (req, res) => {
    res.json({ message: 'Backend server is running successfully' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
