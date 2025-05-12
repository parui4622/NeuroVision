const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const config = require('../config');

exports.signup = async (req, res) => {
    try {
        const { name, email, password, role = 'patient', doctorInfo, patientInfo } = req.body;

        console.log('Signup attempt:', { email, role, name });

        if (!email || !password || !name) {
            return res.status(400).json({ 
                success: false, 
                error: "Please provide all required fields" 
            });
        }

        // Check if the user already exists
        console.log('Checking for existing user...');
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
            console.log('User already exists with email:', email);
            return res.status(400).json({ 
                success: false,
                error: "An account with this email already exists" 
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user object with basic info
        const userData = {
            name,
            email,
            password: hashedPassword,
            role
        };

        // Add role-specific information
        if (role === 'doctor' && doctorInfo) {
            userData.doctorInfo = {
                ...doctorInfo,
                isVerified: false // Doctors need verification
            };
        } else if (role === 'patient' && patientInfo) {
            userData.patientInfo = patientInfo;
        }

        // Create new user
        const user = new User(userData);

        await user.save();

        // Create token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            config.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Create session in MongoDB
        const session = new Session({
            userId: user._id,
            token,
            deviceInfo: req.headers['user-agent']
        });
        await session.save();

        // Don't send password in response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            message: "User created successfully",
            token,
            user: userResponse,
            sessionId: session._id
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
