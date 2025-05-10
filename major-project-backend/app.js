const express = require('express');
const app = express();

// Basic middleware
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

module.exports = app;
