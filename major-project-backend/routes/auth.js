const express = require('express');
const router = express.Router();
const { 
    signup, 
    login, 
    logout, 
    validateSession, 
    verifyEmail, 
    resendOTP 
} = require('../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/validate-session', validateSession);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOTP);

module.exports = router;
