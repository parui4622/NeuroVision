const User = require('../models/User');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const generateResetToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Helper to send email
const sendRecoveryEmail = async (to, name, serial, token) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Password Recovery - Alzheimer Detection System',
        html: `<p>Hi ${name},</p>
               <p>We received a request to reset your password. Please use the following link to reset your password:</p>
               <p><a href="${process.env.FRONTEND_URL}/reset-password?token=${token}">Reset Password</a></p>
               <p>Your Patient Serial: <b>${serial}</b></p>
               <p>If you did not request this, please ignore this email.</p>`
    };
    await transporter.sendMail(mailOptions);
};

exports.verifyUser = async (req, res) => {
    try {
        const { email, dateOfBirth, emailConfirm } = req.body;
        
        // Use timing-safe comparison for email
        if (crypto.timingSafeEqual(Buffer.from(email), Buffer.from(emailConfirm)) === false) {
            return res.status(400).json({ error: 'Email addresses do not match' });
        }

        // Add delay to prevent user enumeration
        await new Promise(resolve => setTimeout(resolve, 500));

        const user = await User.findOne({ email }).select('+patientInfo.dateOfBirth name patientInfo.serial');

        if (!user) {
            // Return same message as invalid DOB to prevent user enumeration
            return res.status(400).json({ error: 'Invalid verification details' });
        }

        // Check if user is a patient and verify DOB
        if (user.role === 'patient' && user.patientInfo?.dateOfBirth) {
            const userDOB = new Date(user.patientInfo.dateOfBirth).toISOString().split('T')[0];
            const providedDOB = new Date(dateOfBirth).toISOString().split('T')[0];
            
            if (userDOB !== providedDOB) {
                return res.status(400).json({ error: 'Invalid verification details' });
            }
        }

        // Generate a verification token that expires in 10 minutes
        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationToken = verificationToken;
        user.verificationTokenExpiry = Date.now() + 600000; // 10 minutes
        await user.save();

        // Send recovery email
        await sendRecoveryEmail(user.email, user.name, user.patientInfo?.serial || '', verificationToken);

        res.json({ 
            status: 'success', 
            verified: true,
            message: 'Recovery email sent to your address.'
        });
    } catch (error) {
        console.error('User verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate reset token and expiry
        const resetToken = generateResetToken();
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

        // Save reset token and expiry to user
        user.resetToken = resetToken;
        user.resetTokenExpiry = resetTokenExpiry;
        await user.save();

        // TODO: Send email with reset link
        // For development, return both message and token
        res.json({
            status: 'success',
            message: 'Password reset instructions sent to your email',
            resetToken: resetToken, // This would be removed in production
        });
    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                error: 'Invalid or expired reset token'
            });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update user's password and clear reset token
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.json({ message: 'Password successfully reset' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
