const express = require('express');
const router = express.Router();
const { 
    predict, 
    getPatientReports, 
    getReport, 
    updateReport 
} = require('../controllers/predictController');
const sessionAuth = require('../middleware/sessionAuth');

// Public routes
router.post('/predict', predict);

// Define the protected routes with authentication middleware applied individually
const authenticate = sessionAuth;

// Get all reports for a patient
router.get('/reports/patient/:patientId', authenticate, getPatientReports);

// Get specific report
router.get('/reports/:reportId', authenticate, getReport);

// Update a report
router.put('/reports/:reportId', authenticate, updateReport);

module.exports = router;
