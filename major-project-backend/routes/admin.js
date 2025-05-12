const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const {
  getDoctors,
  getPatients,
  deleteUser,
  toggleClassification,
  getClassificationState
} = require('../controllers/adminController');

// Debug middleware
router.use((req, res, next) => {
    console.log('Admin Route Request:', {
        path: req.path,
        method: req.method,
        headers: req.headers,
        query: req.query,
        body: req.body
    });
    next();
});

// Apply admin authentication to all routes
router.use(adminAuth);

// Get all doctors
router.get('/doctors', getDoctors);

// Get all patients
router.get('/patients', getPatients);

// Delete a user (doctor or patient)
router.delete('/:userType/:id', deleteUser);

// Toggle classification system
router.post('/toggle-classification', toggleClassification);

// Get classification system state
router.get('/classification-state', getClassificationState);

module.exports = router;
