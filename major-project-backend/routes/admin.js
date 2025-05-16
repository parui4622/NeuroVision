const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const {
  getDoctors,
  getPatients,
  deleteUser,
  toggleClassification,
  getClassificationState,
  assignDoctorToPatient
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

// Define authentication middleware for all routes
const authenticate = adminAuth;

// Get all doctors
router.get('/doctors', authenticate, getDoctors);

// Get all patients
router.get('/patients', authenticate, getPatients);

// Delete a user (doctor or patient)
router.delete('/:userType/:id', authenticate, deleteUser);

// Toggle classification system
router.post('/toggle-classification', authenticate, toggleClassification);

// Get classification system state
router.get('/classification-state', authenticate, getClassificationState);

// Assign doctor to patient
router.post('/assign-doctor', authenticate, assignDoctorToPatient);

module.exports = router;
