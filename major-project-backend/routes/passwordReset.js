const express = require('express');
const router = express.Router();
const { requestPasswordReset, resetPassword, verifyUser } = require('../controllers/passwordResetController');
const { resetAttemptLimiter } = require('../middleware/rateLimit');
const { validateResetRequest, validatePasswordReset } = require('../middleware/validation');
const { sessionAuth } = require('../middleware/sessionAuth');

// Apply rate limiting to all password reset routes
router.use(resetAttemptLimiter);

// Security Headers Middleware
router.use((req, res, next) => {
    res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    });
    next();
});

// Route to verify user identity with validation
router.post('/verify', validateResetRequest, verifyUser);

// Route to request a password reset
router.post('/request-reset', requestPasswordReset);

// Route to reset password with token and validation
router.post('/reset', validatePasswordReset, resetPassword);

module.exports = router;
