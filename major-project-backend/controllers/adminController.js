const User = require('../models/User');
const mongoose = require('mongoose');

// Maintain classification state in database instead of memory
const SystemConfig = mongoose.model('SystemConfig', new mongoose.Schema({
  key: String,
  value: mongoose.Schema.Types.Mixed
}));

// Initialize system configuration
async function initializeSystemConfig() {
  try {
    const config = await SystemConfig.findOne({ key: 'classificationEnabled' });
    if (!config) {
      await SystemConfig.create({ key: 'classificationEnabled', value: true });
    }
  } catch (error) {
    console.error('Error initializing system config:', error);
  }
}
initializeSystemConfig();

// Get all doctors
exports.getDoctors = async (req, res) => {
    try {
        const doctors = await User.find({ role: 'doctor' }).select('-password');
        res.json(doctors);
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ error: 'Failed to fetch doctors' });
    }
};

// Get all patients
exports.getPatients = async (req, res) => {
    try {
        const patients = await User.find({ role: 'patient' }).select('-password');
        res.json(patients);
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ error: 'Failed to fetch patients' });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const { userType, id } = req.params;
        console.log(`Attempting to delete user: type=${userType}, id=${id}`);
        
        const deletedUser = await User.findByIdAndDelete(id);
        console.log('Delete result:', deletedUser ? 'User found and deleted' : 'No user found');
        
        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ 
            message: 'User deleted successfully',
            deletedUser: {
                id: deletedUser._id,
                name: deletedUser.name,
                email: deletedUser.email,
                role: deletedUser.role
            }
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

// Toggle classification
exports.toggleClassification = async (req, res) => {
    try {
        const config = await SystemConfig.findOne({ key: 'classificationEnabled' });
        if (!config) {
            return res.status(500).json({ error: 'System configuration not found' });
        }

        config.value = !config.value;
        await config.save();

        res.json({ classificationEnabled: config.value });
    } catch (error) {
        console.error('Error toggling classification:', error);
        res.status(500).json({ error: 'Failed to toggle classification' });
    }
};

// Get classification state
exports.getClassificationState = async (req, res) => {
    try {
        const config = await SystemConfig.findOne({ key: 'classificationEnabled' });
        if (!config) {
            return res.status(500).json({ error: 'System configuration not found' });
        }

        res.json({ classificationEnabled: config.value });
    } catch (error) {
        console.error('Error getting classification state:', error);
        res.status(500).json({ error: 'Failed to get classification state' });
    }
};
