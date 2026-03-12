// Using standard fetch (HTTPS) to bypass Render's SMTP firewall
const crypto = require('crypto');

// Generate a 6-digit OTP
exports.generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to send email via Brevo REST API
const sendBrevoEmail = async (toEmail, toName, subject, htmlContent) => {
    const url = 'https://api.brevo.com/v3/smtp/email';
    
    const payload = {
        sender: { 
            name: "NeuroVision System", 
            email: process.env.EMAIL_USER // This must match the email you verified on Brevo!
        },
        to: [{ email: toEmail, name: toName || "User" }],
        subject: subject,
        htmlContent: htmlContent
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Brevo API Error:', error);
        throw new Error('Failed to send email via API');
    }
};

// Send OTP verification email
exports.sendOTPEmail = async (to, name, otp) => {
    const subject = 'Email Verification - Alzheimer Detection System';
    const html = `<p>Hi ${name},</p>
                   <p>Thank you for signing up. Your verification code is:</p>
                   <h2 style="text-align: center; font-size: 32px; padding: 10px; background-color: #f0f0f0; border-radius: 5px;">${otp}</h2>
                   <p>Please enter this code to verify your email address.</p>
                   <p>This code will expire in 15 minutes.</p>
                   <p>If you did not sign up for our service, please ignore this email.</p>`;
    await sendBrevoEmail(to, name, subject, html);
};

// Send email to patient with doctor assignment
exports.sendDoctorAssignmentEmail = async (patientEmail, patientName, doctorName) => {
    const subject = 'Doctor Assigned - Alzheimer Detection System';
    const html = `<p>Hi ${patientName},</p>
                   <p>We're pleased to inform you that Dr. ${doctorName} has been assigned as your doctor.</p>
                   <p>They will now have access to your medical records and reports, and will be able to provide guidance on your condition.</p>
                   <p>If you have any questions, please contact our support team.</p>`;
    await sendBrevoEmail(patientEmail, patientName, subject, html);
};

// Send notification email to doctor about new report
exports.sendNewReportNotificationEmail = async (doctorEmail, doctorName, patientName) => {
    const subject = 'New Patient Report Available - Alzheimer Detection System';
    const html = `<p>Hi Dr. ${doctorName},</p>
                   <p>A new report has been generated for your patient ${patientName}.</p>
                   <p>Please log in to your dashboard to review the report and provide your assessment.</p>`;
    await sendBrevoEmail(doctorEmail, doctorName, subject, html);
};

// Send report status update to patient
exports.sendReportStatusUpdateEmail = async (patientEmail, patientName, status) => {
    const subject = 'Report Status Update - Alzheimer Detection System';
    const html = `<p>Hi ${patientName},</p>
                   <p>Your report status has been updated to: <strong>${status}</strong></p>
                   <p>Please log in to your dashboard to view any comments or recommendations from your doctor.</p>`;
    await sendBrevoEmail(patientEmail, patientName, subject, html);
};

// Send admin credentials email
exports.sendAdminCredentialsEmail = async (adminEmail, adminName, tempPassword) => {
    const subject = 'Admin Account Created - Alzheimer Detection System';
    const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                   <h2 style="color: #2c3e50;">Welcome to Alzheimer Detection System</h2>
                   <p>Hi ${adminName},</p>
                   <p>Your admin account has been successfully created and verified. Here are your login credentials:</p>
                   <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                       <h3 style="margin-top: 0; color: #2c3e50;">Login Credentials</h3>
                       <p><strong>Email:</strong> ${adminEmail}</p>
                       <p><strong>Temporary Password:</strong> <code style="background-color: #e9ecef; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
                   </div>
                   <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                       <strong>⚠️ Important Security Instructions:</strong>
                       <ul style="margin: 10px 0;">
                           <li>Please change your password immediately after your first login</li>
                           <li>Do not share these credentials with anyone</li>
                           <li>This is a temporary password and should be changed for security</li>
                       </ul>
                   </div>
                   <p>You can now log in to the admin dashboard using these credentials.</p>
                   <p>If you have any questions or need assistance, please contact the system administrator.</p>
                   <p style="margin-top: 30px;">Best regards,<br>Alzheimer Detection System Team</p>
                   </div>`;
    await sendBrevoEmail(adminEmail, adminName, subject, html);
};