const rateLimit = require('express-rate-limit');

const resetAttemptLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: { error: 'Too many verification attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    resetAttemptLimiter
};
