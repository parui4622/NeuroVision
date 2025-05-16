const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Session = require('../models/Session');
const config = require('../config');

function generatePatientSerial() {
    // Example: PAT-YYYYMMDD-<random4>
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `PAT-${date}-${rand}`;
}

const emailService = require('../utils/emailService');

exports.signup = async (req, res) => {
    try {
        const { name, email, password, role = 'patient', patientInfo } = req.body;

        console.log('Signup attempt:', { email, role, name });

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

        // Check if the user already exists
        // (Removed duplicate email check to allow multiple users with same email)

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate OTP for email verification
        const otp = emailService.generateOTP();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 15); // OTP valid for 15 minutes

        // Create user object with basic info
        const userData = {
            name,
            email,
            password: hashedPassword,
            role,
            emailVerificationOTP: otp,
            otpExpiry,
            isEmailVerified: false
        };

        // Add role-specific information
        if (role === 'doctor') {
            userData.doctorInfo = {
                isVerified: true // Doctors are auto-verified now - simplified registration
            };
        } else if (role === 'patient') {
            userData.patientInfo = patientInfoToSave;
        }

        // Create new user
        const user = new User(userData);
        await user.save();

        // Send verification email
        await emailService.sendOTPEmail(email, name, otp);

        // Don't send password in response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            message: "User created successfully. Please verify your email to continue.",
            user: userResponse,
            userId: user._id // Return userId for OTP verification
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { userId, otp } = req.body;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }
        
        // Check OTP validity
        if (user.emailVerificationOTP !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }
        
        // Check if OTP is expired
        if (new Date() > new Date(user.otpExpiry)) {
            return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
        }
        
        // Mark email as verified
        user.isEmailVerified = true;
        user.emailVerificationOTP = null;
        user.otpExpiry = null;
        await user.save();
        
        // Create token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            config.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Create session
        const session = new Session({
            userId: user._id,
            token,
            deviceInfo: req.headers['user-agent']
        });
        await session.save();
        
        // Don't send password in response
        const userResponse = user.toObject();
        delete userResponse.password;
        
        res.status(200).json({
            message: "Email verified successfully",
            token,
            user: userResponse,
            sessionId: session._id,
            role: user.role // Add role to response for frontend redirect
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.resendOTP = async (req, res) => {
    try {
        const { userId } = req.body;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }
        
        if (user.isEmailVerified) {
            return res.status(400).json({ error: 'Email already verified' });
        }
        
        // Generate new OTP
        const otp = emailService.generateOTP();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 15);
        
        user.emailVerificationOTP = otp;
        user.otpExpiry = otpExpiry;
        await user.save();
        
        // Send verification email
        await emailService.sendOTPEmail(user.email, user.name, otp);
        
        res.status(200).json({ message: 'OTP has been resent to your email' });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        console.log('Login attempt:', { email, role });
        
        // Find user by email and include debugging
        console.log('Searching for user with email:', email);
        const foundUser = await User.findOne({ email }).exec();
        console.log('Found user:', foundUser ? 'Yes' : 'No');
        
        // User not found
        if (!foundUser) {
            console.log('User not found in database');
            return res.status(401).json({ 
                success: false,
                error: "Invalid email or password"
            });
        }

        // Verify role matches
        if (role && foundUser.role !== role) {
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
        
        res.json({
            message: "Login successful",
            token,
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
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(400).json({ error: 'No token provided' });
        }

        // Invalidate session in MongoDB
        await Session.findOneAndUpdate(
            { token },
            { isValid: false }
        );

        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.validateSession = async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
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
