const User = require('../models/User');
const mongoose = require('mongoose');
const SystemConfig = require('../models/SystemConfig');

// Initialize system configuration once MongoDB is connected
function initializeSystemConfig() {
  mongoose.connection.once('open', async () => {
    try {
      const config = await SystemConfig.findOne({ key: 'classificationEnabled' });
      if (!config) {
        await new SystemConfig({
          key: 'classificationEnabled',
          value: true,
          description: 'Controls whether the classification system is enabled'
        }).save();
        console.log('Classification system config initialized');
      }
    } catch (error) {
      console.error('Error initializing system config:', error);
    }
  });
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

// Assign doctor to patient
exports.assignDoctorToPatient = async (req, res) => {
    try {
        const { doctorId, patientId } = req.body;
        
        if (!doctorId || !patientId) {
            return res.status(400).json({ error: 'Doctor ID and Patient ID are required' });
        }
        
        // Verify doctor exists and is a doctor
        const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }
        
        // Verify patient exists and is a patient
        const patient = await User.findOne({ _id: patientId, role: 'patient' });
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        
        // Update patient with assigned doctor
        patient.assignedDoctor = doctorId;
        await patient.save();
        
        // Add patient to doctor's assigned patients
        if (!doctor.assignedPatients) {
            doctor.assignedPatients = [];
        }
        
        if (!doctor.assignedPatients.includes(patientId)) {
            doctor.assignedPatients.push(patientId);
            await doctor.save();
        }
        
        // Send email notification to patient and doctor
        const emailService = require('../utils/emailService');
        try {
            await emailService.sendDoctorAssignmentEmail(
                patient.email,
                patient.name,
                doctor.name
            );
        } catch (emailError) {
            console.error('Failed to send doctor assignment email:', emailError);
        }
        
        res.json({
            success: true,
            message: 'Doctor assigned to patient successfully',
            patient: {
                id: patient._id,
                name: patient.name,
                assignedDoctor: {
                    id: doctor._id,
                    name: doctor.name
                }
            }
        });
    } catch (error) {
        console.error('Error assigning doctor to patient:', error);
        res.status(500).json({ error: 'Failed to assign doctor to patient' });
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
