const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const Session = require('../models/Session');
const { config } = require('../config');

function generatePatientSerial() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `PAT-${date}-${rand}`;
}

const emailService = require('../utils/emailService');

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

        if (!email || !password || !name) {
            return res.status(400).json({ success: false, error: "Please provide all required fields" });
        }

        let patientInfoToSave = patientInfo;
        if (role === 'patient') {
            if (!patientInfo || !patientInfo.dateOfBirth) {
                return res.status(400).json({ error: 'Date of birth is required for patients.' });
            }
            patientInfoToSave = { ...patientInfo, serial: generatePatientSerial() };
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: "Email already registered",
                message: "An account with this email already exists. Please login instead or use a different email."
            });
        }

        let pending = await PendingUser.findOne({ email: email.toLowerCase() });
        if (pending) {
            await PendingUser.deleteOne({ _id: pending._id });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = emailService.generateOTP();

        const pendingUser = new PendingUser({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            otp,
            role,
            patientInfo: patientInfoToSave
        });
        await pendingUser.save();

        try {
            await emailService.sendOTPEmail(email, name, otp);
        } catch (emailError) {
            console.error('Email sending failed:', emailError.message);
            await PendingUser.deleteOne({ _id: pendingUser._id });
            return res.status(500).json({
                success: false,
                error: "Email service is not configured properly. User registration requires email verification.",
                details: emailError.message
            });
        }

        return res.status(200).json({
            success: true,
            message: "OTP sent to your email. Please verify to complete registration."
        });
    } catch (err) {
        console.error('Signup error:', err.message);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Missing required fields: email or otp' });
        }

        const pendingUser = await PendingUser.findOne({ email: email.toLowerCase() });
        if (!pendingUser) {
            return res.status(400).json({ error: 'No pending registration found for this email.' });
        }

        if (pendingUser.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP.' });
        }

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

        const token = jwt.sign(
            { userId: newUser._id, role: newUser.role },
            config.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        const session = new Session({
            userId: newUser._id,
            token,
            deviceInfo: req.headers['user-agent']
        });
        await session.save();
        
        const userResponse = newUser.toObject();
        delete userResponse.password;
        delete userResponse.emailVerificationOTP;
        delete userResponse.otpExpiry;
        
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
            sessionId: session._id,
            token: token
        });
        
    } catch (error) {
        console.error('verifyEmail error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });
        
        const pendingUser = await PendingUser.findOne({ email: email.toLowerCase() });
        if (!pendingUser) return res.status(400).json({ error: 'No pending registration found.' });
        
        const otp = emailService.generateOTP();
        pendingUser.otp = otp;
        pendingUser.createdAt = new Date();
        await pendingUser.save();
        
        await emailService.sendOTPEmail(pendingUser.email, pendingUser.name, otp);
        res.status(200).json({ message: 'OTP has been resent to your email' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const normalizedEmail = email.toLowerCase();
        
        const pendingUser = await PendingUser.findOne({ email: normalizedEmail }).exec();
        if (pendingUser) {
            return res.status(401).json({
                error: "Email not verified",
                requiresVerification: true,
                email: pendingUser.email,
                userId: pendingUser._id
            });
        }

        const foundUser = await User.findOne({ email: normalizedEmail }).exec();
        
        if (!foundUser) {
            return res.status(401).json({ success: false, error: "Invalid email or password" });
        }

        if (role && foundUser.role.toLowerCase() !== role.toLowerCase()) {
            return res.status(403).json({ 
                error: role === 'admin'
                    ? "Access Denied - Administrative privileges required"
                    : `Invalid credentials for ${role} access`
            });
        }

        const validPassword = await bcrypt.compare(password, foundUser.password);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        
        if (!foundUser.isEmailVerified) {
            const otp = emailService.generateOTP();
            const otpExpiry = new Date();
            otpExpiry.setMinutes(otpExpiry.getMinutes() + 15);
            
            foundUser.emailVerificationOTP = otp;
            foundUser.otpExpiry = otpExpiry;
            await foundUser.save();
            
            await emailService.sendOTPEmail(email, foundUser.name, otp);
            
            return res.status(401).json({
                error: "Email not verified",
                requiresVerification: true,
                email: foundUser.email
            });
        }

        foundUser.lastActive = new Date();
        await foundUser.save();

        const token = jwt.sign(
            { userId: foundUser._id, role: foundUser.role },
            config.JWT_SECRET,
            { expiresIn: '24h' }
        );

        const session = new Session({
            userId: foundUser._id,
            token,
            deviceInfo: req.headers['user-agent']
        });
        await session.save();

        const userResponse = foundUser.toObject();
        delete userResponse.password;

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });
        
        res.json({
            message: "Login successful",
            user: userResponse,
            sessionId: session._id,
            token: token
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.logout = async (req, res) => {
    try {
        const token = req.cookies?.token ?? (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
        if (!token) {
            return res.status(400).json({ error: 'No token provided' });
        }
        await Session.findOneAndUpdate({ token }, { isValid: false });
        res.clearCookie('token');
        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.validateSession = async (req, res) => {
    try {
        const token = req.cookies?.token ?? (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const session = await Session.findOne({ token, isValid: true });

        if (!session) {
            return res.status(401).json({ error: 'Session expired or invalid' });
        }

        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        session.lastActive = new Date();
        await session.save();

        res.json({ valid: true, user, sessionId: session._id });
    } catch (err) {
        if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
        if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
        res.status(500).json({ error: err.message });
    }
};