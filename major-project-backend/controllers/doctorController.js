const User = require('../models/User');
const Report = require('../models/Report');
const Appointment = require('../models/Appointment');
const emailService = require('../utils/emailService');

// Get doctor dashboard stats (total patients, appointments today, pending reports)
exports.getDoctorDashboard = async (req, res) => {
    try {
        const doctorId = req.user.userId;
        const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
        if (!doctor) {
            return res.status(403).json({ error: 'Only doctors can access this resource' });
        }
        const totalPatients = await User.countDocuments({ assignedDoctor: doctorId });
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const appointmentsToday = await Appointment.countDocuments({
            doctor: doctorId,
            date: { $gte: todayStart, $lte: todayEnd },
            status: { $in: ['scheduled', 'approved'] }
        });
        const patientIds = await User.find({ assignedDoctor: doctorId }).distinct('_id');
        const pendingReports = await Report.countDocuments({
            patient: { $in: patientIds },
            status: 'pending'
        });
        res.json({
            success: true,
            totalPatients,
            appointmentsToday,
            pendingReports
        });
    } catch (error) {
        console.error('Error fetching doctor dashboard:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
};

// Get single patient details (for doctor view)
exports.getPatientDetails = async (req, res) => {
    try {
        const { patientId } = req.params;
        const doctorId = req.user.userId;
        const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
        if (!doctor) {
            return res.status(403).json({ error: 'Only doctors can access this resource' });
        }
        const patient = await User.findOne({
            _id: patientId,
            assignedDoctor: doctorId,
            role: 'patient'
        }).select('-password').lean();
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found or not assigned to you' });
        }
        const reports = await Report.find({ patient: patientId })
            .sort({ createdAt: -1 })
            .select('-image')
            .lean();
        const latestReport = reports[0] || null;
        const classificationHistory = reports.map(r => r.classification).join(', ') || 'N/A';
        res.json({
            ...patient,
            classificationHistory,
            reports,
            latestReport,
            medicalHistory: patient.patientInfo?.medicalHistory?.join(', ') || 'N/A',
            timeRemaining: null
        });
    } catch (error) {
        console.error('Error fetching patient details:', error);
        res.status(500).json({ error: 'Failed to fetch patient details' });
    }
};

// Update patient medications/review (stored on latest report or patient)
exports.updatePatientDetails = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { medications, review } = req.body;
        const doctorId = req.user.userId;
        const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
        if (!doctor) {
            return res.status(403).json({ error: 'Only doctors can access this resource' });
        }
        const patient = await User.findOne({
            _id: patientId,
            assignedDoctor: doctorId,
            role: 'patient'
        });
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found or not assigned to you' });
        }
        const latestReport = await Report.findOne({ patient: patientId }).sort({ createdAt: -1 });
        if (latestReport) {
            if (medications !== undefined) latestReport.recommendedMedications = Array.isArray(medications) ? medications : (medications ? [medications] : []);
            if (review !== undefined) latestReport.doctorNotes = review;
            latestReport.reviewedAt = new Date();
            latestReport.reviewedBy = doctorId;
            await latestReport.save();
        }
        res.json({ message: 'Medications and review saved successfully.' });
    } catch (error) {
        console.error('Error updating patient details:', error);
        res.status(500).json({ error: 'Failed to save' });
    }
};

// Get all patients assigned to a specific doctor
exports.getAssignedPatients = async (req, res) => {
    try {
        const doctorId = req.user.userId; // From auth middleware
        
        // Verify doctor exists and is a doctor
        const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
        if (!doctor) {
            return res.status(403).json({ error: 'Only doctors can access this resource' });
        }
        
        // Get patients with their latest reports
        const patients = await User.find({ assignedDoctor: doctorId })
            .select('-password')
            .lean();
            
        // Get latest report for each patient
        const patientWithReports = await Promise.all(patients.map(async (patient) => {
            const latestReport = await Report.findOne({ patient: patient._id })
                .sort({ createdAt: -1 })
                .select('-image') // Don't send large image data
                .lean();
                
            return {
                ...patient,
                latestReport: latestReport || null
            };
        }));
        
        res.json(patientWithReports);
    } catch (error) {
        console.error('Error fetching assigned patients:', error);
        res.status(500).json({ error: 'Failed to fetch assigned patients' });
    }
};

// Get all patients categorized by classification
exports.getPatientsByCategory = async (req, res) => {
    try {
        const doctorId = req.user.userId;
        
        // Verify doctor exists and is a doctor
        const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
        if (!doctor) {
            return res.status(403).json({ error: 'Only doctors can access this resource' });
        }
        
        // Get all patients assigned to this doctor
        const patients = await User.find({ assignedDoctor: doctorId })
            .select('-password')
            .lean();
            
        const patientIds = patients.map(p => p._id);
        
        // Get latest reports for all patients
        const latestReports = await Report.aggregate([
            {
                $match: {
                    patient: { $in: patientIds }
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: '$patient',
                    report: { $first: '$$ROOT' }
                }
            }
        ]);
        
        // Map patient info to each report
        const reportsByPatient = latestReports.map(item => {
            const patientInfo = patients.find(p => p._id.toString() === item._id.toString());
            return {
                ...item.report,
                patientInfo
            };
        });
        
        // Group by classification
        const categorizedPatients = {
            'AD': reportsByPatient.filter(r => r.classification === 'AD'),
            'CN': reportsByPatient.filter(r => r.classification === 'CN'),
            'EMCI': reportsByPatient.filter(r => r.classification === 'EMCI'),
            'LMCI': reportsByPatient.filter(r => r.classification === 'LMCI'),
            'Unclassified': patients.filter(p => 
                !latestReports.some(r => r._id.toString() === p._id.toString())
            ).map(p => ({ patientInfo: p }))
        };
        
        res.json(categorizedPatients);
    } catch (error) {
        console.error('Error fetching patients by category:', error);
        res.status(500).json({ error: 'Failed to fetch patients by category' });
    }
};

// Get all reports for a specific patient
exports.getPatientReports = async (req, res) => {
    try {
        const { patientId } = req.params;
        const doctorId = req.user.userId;
        
        // Verify doctor exists and is a doctor
        const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
        if (!doctor) {
            return res.status(403).json({ error: 'Only doctors can access this resource' });
        }
        
        // Verify this patient is assigned to this doctor
        const patient = await User.findOne({ 
            _id: patientId, 
            assignedDoctor: doctorId 
        });
        
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found or not assigned to you' });
        }
        
        // Get all reports for this patient
        const reports = await Report.find({ patient: patientId })
            .sort({ createdAt: -1 })
            .select('-image'); // Don't include full image in listing
            
        res.json(reports);
    } catch (error) {
        console.error('Error fetching patient reports:', error);
        res.status(500).json({ error: 'Failed to fetch patient reports' });
    }
};

// Update a report (add medications, therapies, etc.)
exports.updatePatientReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        const doctorId = req.user.userId;
        const {
            doctorNotes,
            recommendedMedications,
            recommendedTherapies,
            followUpDate,
            status
        } = req.body;
        
        // Verify doctor exists and is a doctor
        const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
        if (!doctor) {
            return res.status(403).json({ error: 'Only doctors can access this resource' });
        }
        
        // Get the report
        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        
        // Verify this patient is assigned to this doctor
        const patient = await User.findOne({ 
            _id: report.patient, 
            assignedDoctor: doctorId 
        });
        
        if (!patient) {
            return res.status(403).json({ 
                error: 'You are not authorized to update this report' 
            });
        }
        
        // Update report fields
        if (doctorNotes !== undefined) report.doctorNotes = doctorNotes;
        if (recommendedMedications !== undefined) {
            report.recommendedMedications = recommendedMedications;
        }
        if (recommendedTherapies !== undefined) {
            report.recommendedTherapies = recommendedTherapies;
        }
        if (followUpDate !== undefined) report.followUpDate = followUpDate;
        if (status !== undefined) report.status = status;
        
        // Update metadata
        report.reviewedAt = new Date();
        report.reviewedBy = doctorId;
        report.updatedAt = new Date();
        
        await report.save();
        
        // Notify patient about the update
        const emailService = require('../utils/emailService');
        try {
            await emailService.sendReportStatusUpdateEmail(
                patient.email,
                patient.name,
                status
            );
        } catch (emailError) {
            console.error('Failed to send report status update email:', emailError);
        }
        
        res.json({
            message: 'Report updated successfully',
            report
        });
    } catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({ error: 'Failed to update report' });
    }
};

// Get all appointments for the logged-in doctor (optionally filter by date, status, etc.)
exports.getAppointments = async (req, res) => {
    try {
        const doctorId = req.user.userId;
        const { date, status } = req.query; // Optional: filter by date or status
        const query = { doctor: doctorId };
        if (date) {
            // Get appointments for the specific day
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            query.date = { $gte: start, $lte: end };
        }
        if (status) {
            // Allow comma-separated status values
            const statusArr = status.split(',').map(s => s.trim());
            query.status = { $in: statusArr };
        }
        // Only fetch future appointments by default
        const now = new Date();
        query.date = query.date || { $gte: now };
        const appointments = await Appointment.find(query)
            .populate('patient', 'name email')
            .sort({ date: 1 });
        // Find next upcoming appointment (approved or scheduled, not completed/denied)
        const next = appointments.find(a => ['approved', 'scheduled'].includes(a.status) && a.date > now);
        res.json({
            appointments: appointments.map(appt => ({
                _id: appt._id,
                patient: appt.patient?._id?.toString?.() || appt.patient,
                patientName: appt.patient?.name || 'Unknown',
                patientEmail: appt.patient?.email || '',
                date: appt.date,
                status: appt.status
            })),
            nextAppointment: next ? {
                _id: next._id,
                patientName: next.patient?.name || 'Unknown',
                patientEmail: next.patient?.email || '',
                date: next.date,
                status: next.status
            } : null
        });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
};

// Get all appointments for the logged-in patient (optionally filter by date, status, etc.)
exports.getPatientAppointments = async (req, res) => {
    try {
        const patientId = req.user.userId;
        const { date, status } = req.query; // Optional: filter by date or status
        const query = { patient: patientId };
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            query.date = { $gte: start, $lte: end };
        }
        if (status) {
            const statusArr = status.split(',').map(s => s.trim());
            query.status = { $in: statusArr };
        }
        // Only fetch future appointments by default
        const now = new Date();
        query.date = query.date || { $gte: now };
        const appointments = await Appointment.find(query)
            .populate('doctor', 'name email')
            .sort({ date: 1 });
        // Find next upcoming appointment (approved or scheduled, not completed/denied)
        const next = appointments.find(a => ['approved', 'scheduled'].includes(a.status) && a.date > now);
        res.json({
            appointments: appointments.map(appt => ({
                _id: appt._id,
                doctorName: appt.doctor?.name || 'Unknown',
                doctorEmail: appt.doctor?.email || '',
                date: appt.date,
                status: appt.status
            })),
            nextAppointment: next ? {
                _id: next._id,
                doctorName: next.doctor?.name || 'Unknown',
                doctorEmail: next.doctor?.email || '',
                date: next.date,
                status: next.status
            } : null
        });
    } catch (error) {
        console.error('Error fetching patient appointments:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
};

// Update appointment status (approve/deny/complete)
exports.updateAppointmentStatus = async (req, res) => {
    try {
        const doctorId = req.user.userId;
        const { appointmentId } = req.params;
        const { status } = req.body;
        if (!['approved', 'denied', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const appointment = await Appointment.findOne({ _id: appointmentId, doctor: doctorId }).populate('patient', 'name email');
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        appointment.status = status;
        appointment.updatedAt = new Date();
        await appointment.save();

        // Send email notification to the patient
        if (status === 'approved' || status === 'denied') {
            const doctor = await User.findById(doctorId, 'name');
            const salutation = doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`;
            const emailSubject = `Your appointment has been ${status}`;
            const emailBody = `Dear ${appointment.patient.name},\n\nYour appointment with ${salutation} has been ${status}.\n\nThank you.`;

            try {
                await emailService.sendEmail(appointment.patient.email, emailSubject, emailBody);
            } catch (emailError) {
                console.error('Failed to send appointment status email:', emailError);
            }
        }

        res.json({ success: true, appointment });
    } catch (error) {
        console.error('Error updating appointment status:', error);
        res.status(500).json({ error: 'Failed to update appointment status' });
    }
};
