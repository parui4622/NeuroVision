const validateResetRequest = (req, res, next) => {
    const { email, emailConfirm, dateOfBirth } = req.body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate email confirmation
    if (email !== emailConfirm) {
        return res.status(400).json({ error: 'Email addresses do not match' });
    }

    // Validate date of birth if provided
    if (dateOfBirth) {
        const dobDate = new Date(dateOfBirth);
        const currentDate = new Date();
        if (isNaN(dobDate) || dobDate > currentDate) {
            return res.status(400).json({ error: 'Invalid date of birth' });
        }
    }

    next();
};

const validatePasswordReset = (req, res, next) => {
    const { token, newPassword } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Reset token is required' });
    }

    if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ 
            error: 'Password must be at least 8 characters long' 
        });
    }

    // Check password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
            error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        });
    }

    next();
};

module.exports = {
    validateResetRequest,
    validatePasswordReset
};
