const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Generate a 6-digit OTP
exports.generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Setup email transporter
const getTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Send OTP verification email
exports.sendOTPEmail = async (to, name, otp) => {
    const transporter = getTransporter();
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Email Verification - Alzheimer Detection System',
        html: `<p>Hi ${name},</p>
               <p>Thank you for signing up. Your verification code is:</p>
               <h2 style="text-align: center; font-size: 32px; padding: 10px; background-color: #f0f0f0; border-radius: 5px;">${otp}</h2>
               <p>Please enter this code to verify your email address.</p>
               <p>This code will expire in 15 minutes.</p>
               <p>If you did not sign up for our service, please ignore this email.</p>`
    };
    await transporter.sendMail(mailOptions);
};

// Send email to patient with doctor assignment
exports.sendDoctorAssignmentEmail = async (patientEmail, patientName, doctorName) => {
    const transporter = getTransporter();
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: patientEmail,
        subject: 'Doctor Assigned - Alzheimer Detection System',
        html: `<p>Hi ${patientName},</p>
               <p>We're pleased to inform you that Dr. ${doctorName} has been assigned as your doctor.</p>
               <p>They will now have access to your medical records and reports, and will be able to provide guidance on your condition.</p>
               <p>If you have any questions, please contact our support team.</p>`
    };
    await transporter.sendMail(mailOptions);
};

// Send notification email to doctor about new report
exports.sendNewReportNotificationEmail = async (doctorEmail, doctorName, patientName) => {
    const transporter = getTransporter();
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: doctorEmail,
        subject: 'New Patient Report Available - Alzheimer Detection System',
        html: `<p>Hi Dr. ${doctorName},</p>
               <p>A new report has been generated for your patient ${patientName}.</p>
               <p>Please log in to your dashboard to review the report and provide your assessment.</p>`
    };
    await transporter.sendMail(mailOptions);
};

// Send report status update to patient
exports.sendReportStatusUpdateEmail = async (patientEmail, patientName, status) => {
    const transporter = getTransporter();
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: patientEmail,
        subject: 'Report Status Update - Alzheimer Detection System',
        html: `<p>Hi ${patientName},</p>
               <p>Your report status has been updated to: <strong>${status}</strong></p>
               <p>Please log in to your dashboard to view any comments or recommendations from your doctor.</p>`
    };
    await transporter.sendMail(mailOptions);
};
