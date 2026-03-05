const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const Session = require('../models/Session');
const { config } = require('../config');

function generatePatientSerial() {
    // Example: PAT-YYYYMMDD-<random4>
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `PAT-${date}-${rand}`;
}

const emailService = require('../utils/emailService');

// Utility: mask email for responses
function maskEmail(email) {
    if (!email) return '';
    const [name, domain] = email.split('@');
    const maskedName = name.length <= 2 ? name[0] + '*' : name[0] + '***' + name.slice(-1);
    const [d1, d2] = (domain || '').split('.');
    const maskedDomain = d1 ? d1[0] + '***' + (d1.slice(-1) || '') : '';
    return `${maskedName}@${maskedDomain}.${d2 || ''}`;
}

exports.signup = async (req, res) => {
    try {
        const { name, email, password, role = 'patient', patientInfo } = req.body;

        // Avoid logging sensitive details in production
        if (process.env.NODE_ENV !== 'production') {
            console.log('Signup attempt:', { email, role, name });
        }

        if (!email || !password || !name) {
            return res.status(400).json({ 
                success: false, 
                error: "Please provide all required fields" 
            });
        }

        let patientInfoToSave = patientInfo;
        if (role === 'patient') {
            if (!patientInfo || !patientInfo.dateOfBirth) {
                return res.status(400).json({ error: 'Date of birth is required for patients.' });
            }
            // Always generate and assign a unique serial
            patientInfoToSave = { ...patientInfo, serial: generatePatientSerial() };
        }

    // Check if user already exists in main User collection
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        return res.status(409).json({
            success: false,
            error: "Email already registered",
            message: "An account with this email already exists. Please login instead or use a different email.",
            errorType: "DUPLICATE_EMAIL"
        });
    }

    // Remove any existing pending signup for this email
    let pending = await PendingUser.findOne({ email: email.toLowerCase() });
    if (pending) {
        await PendingUser.deleteOne({ _id: pending._id });
    }

    // Hash password and generate OTP
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = emailService.generateOTP();

    // Save to PendingUser collection
    const pendingUser = new PendingUser({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        otp,
        role,
        patientInfo: patientInfoToSave
    });
    await pendingUser.save();

    // Send OTP email
    try {
        await emailService.sendOTPEmail(email, name, otp);
    } catch (emailError) {
        console.error('Email sending failed:', emailError.message);
        await PendingUser.deleteOne({ _id: pendingUser._id });
        return res.status(500).json({
            success: false,
            error: "Email service is not configured properly. User registration requires email verification. Please contact the administrator to configure email settings.",
            details: emailError.message
        });
    }

    return res.status(200).json({
        success: true,
        message: "OTP sent to your email. Please verify to complete registration."
    });
    } catch (err) {
        console.error('Signup error:', err.message);
        
        // Handle MongoDB duplicate key error (email already exists)
        if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
            return res.status(409).json({ 
                success: false,
                error: "Email already exists",
                message: "An account with this email already exists. Please login instead.",
                errorType: "DUPLICATE_EMAIL"
            });
        }
        
        // Handle other validation errors
        if (err.name === 'ValidationError') {
            return res.status(400).json({ 
                success: false,
                error: "Validation failed",
                message: err.message,
                errorType: "VALIDATION_ERROR"
            });
        }
        
        // Handle other errors
        res.status(500).json({ 
            success: false,
            error: "Internal server error",
            message: "Something went wrong. Please try again later.",
            errorType: "SERVER_ERROR"
        });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Validate required fields
        if (!email || !otp) {
            return res.status(400).json({ error: 'Missing required fields: email or otp' });
        }

        // Find pending user by email
        const pendingUser = await PendingUser.findOne({ email: email.toLowerCase() });
        if (!pendingUser) {
            return res.status(400).json({ error: 'No pending registration found for this email.' });
        }

        // Check OTP
        if (pendingUser.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP.' });
        }

        // Promote to main User collection
        const { name, password, role, patientInfo } = pendingUser;
        const newUser = new User({
            name,
            email: email.toLowerCase(),
            password,
            isEmailVerified: true,
            role,
            patientInfo
        });
        await newUser.save();
        await PendingUser.deleteOne({ _id: pendingUser._id });

        // Create token with guard for missing secret
        if (!config.JWT_SECRET) {
            console.error('JWT_SECRET is missing; refusing to sign token');
            return res.status(500).json({ error: 'Server misconfiguration: missing JWT secret' });
        }

        const token = jwt.sign(
            { userId: newUser._id, role: newUser.role },
            config.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Create session
        const session = new Session({
            userId: newUser._id,
            token,
            deviceInfo: req.headers['user-agent']
        });
        await session.save();
        
        // Don't send password in response
        const userResponse = newUser.toObject();
        delete userResponse.password;
        delete userResponse.emailVerificationOTP;
        delete userResponse.otpExpiry;
        
        // Update last active time
        newUser.lastActive = new Date();
        await newUser.save();
        
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });
        res.status(200).json({
            message: "Email verified successfully",
            user: userResponse,
            sessionId: session._id
        });
        
    } catch (error) {
        console.error('verifyEmail error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        const pendingUser = await PendingUser.findOne({ email: email.toLowerCase() });
        if (!pendingUser) {
            return res.status(400).json({ error: 'No pending registration found for this email.' });
        }
        // Generate new OTP and update createdAt to reset TTL
        const otp = emailService.generateOTP();
        pendingUser.otp = otp;
        pendingUser.createdAt = new Date();
        await pendingUser.save();
        // Send verification email
        await emailService.sendOTPEmail(pendingUser.email, pendingUser.name, otp);
        res.status(200).json({ message: 'OTP has been resent to your email' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body || {};
        if (process.env.NODE_ENV !== 'production') {
            console.log('Login attempt:', { email, role });
        }

        if (!email || typeof email !== 'string' || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        // Normalize email to lowercase for consistent lookup
        const normalizedEmail = email.toLowerCase();
        
        // Find user by email and include debugging
        if (process.env.NODE_ENV !== 'production') {
            console.log('Searching for user with email:', normalizedEmail);
        }
        const pendingUser = await PendingUser.findOne({ email: normalizedEmail }).exec();
        if (pendingUser) {
            // User started signup but hasn't verified yet
            return res.status(401).json({
                error: "Email not verified",
                requiresVerification: true,
                email: pendingUser.email,
                userId: pendingUser._id
            });
        }

        const foundUser = await User.findOne({ email: normalizedEmail }).exec();
        if (process.env.NODE_ENV !== 'production') {
            console.log('Found user:', foundUser ? 'Yes' : 'No');
        }
        
        // User not found
        if (!foundUser) {
            console.log('User not found in database');
            return res.status(401).json({ 
                success: false,
                error: "Invalid email or password"
            });
        }

        // Verify role matches (case-insensitive)
        if (role && foundUser.role.toLowerCase() !== role.toLowerCase()) {
            return res.status(403).json({ 
                error: role === 'admin'
                    ? "Access Denied - Administrative privileges required"
                    : `Invalid credentials for ${role} access`
            });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, foundUser.password);
        if (!validPassword) {
            return res.status(401).json({ 
                error: "Invalid email or password"
            });
        }
        
        // Check if email is verified
        if (!foundUser.isEmailVerified) {
            // Generate new OTP
            const otp = emailService.generateOTP();
            const otpExpiry = new Date();
            otpExpiry.setMinutes(otpExpiry.getMinutes() + 15);
            
            foundUser.emailVerificationOTP = otp;
            foundUser.otpExpiry = otpExpiry;
            await foundUser.save();
            
            // Send verification email
            await emailService.sendOTPEmail(email, foundUser.name, otp);
            
            return res.status(401).json({
                error: "Email not verified",
                requiresVerification: true,
                email: foundUser.email
            });
        }

        // Update last active
        foundUser.lastActive = new Date();
        await foundUser.save();

        // Create token
        const token = jwt.sign(
            { userId: foundUser._id, role: foundUser.role },
            config.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Create or update session in MongoDB
        const session = new Session({
            userId: foundUser._id,
            token,
            deviceInfo: req.headers['user-agent']
        });
        await session.save();

        // Don't send password in response
        const userResponse = foundUser.toObject();
        delete userResponse.password;

        console.log('Login successful:', { userId: foundUser._id, role: foundUser.role });
        
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });
        res.json({
            message: "Login successful",
            user: userResponse,
            sessionId: session._id
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.logout = async (req, res) => {
    try {
        // Prefer httpOnly cookie; Bearer header as fallback
        const token = req.cookies?.token ?? (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
        if (!token) {
            return res.status(400).json({ error: 'No token provided' });
        }
        // Invalidate session in MongoDB
        await Session.findOneAndUpdate(
            { token },
            { isValid: false }
        );
        res.clearCookie('token');
        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.validateSession = async (req, res) => {
    try {
        // Prefer httpOnly cookie; Bearer header as fallback
        const token = req.cookies?.token ?? (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        // Verify token and find valid session
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const session = await Session.findOne({ 
            token,
            isValid: true
        });

        if (!session) {
            return res.status(401).json({ error: 'Session expired or invalid' });
        }

        // Get user data
        const user = await User.findById(decoded.userId)
            .select('-password'); // Exclude password

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Update session last active time
        session.lastActive = new Date();
        await session.save();

        // Send back user data
        res.json({ 
            valid: true,
            user,
            sessionId: session._id
        });
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        res.status(500).json({ error: err.message });
    }
};
