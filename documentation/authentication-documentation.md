# Authentication and User Management Documentation

## Overview

The NeuroVision application implements a comprehensive authentication system supporting multiple user roles (patients, doctors, administrators) with role-specific features and security concerns.

## User Registration

### Standard Registration Process
1. User provides basic information: name, email, password
2. Role-specific information is collected:
   - **Patient**: Date of birth, gender, medical history
   - **Doctor**: License number, specialty, hospital, years of experience, education
3. System validates input and checks for required fields
4. Password is securely hashed using bcrypt
5. User record is created in the database with role-specific data
6. JWT token is generated and returned with user data
7. For patients, a unique serial number is generated automatically

### Patient Serial Number Generation
- **Function**: `generatePatientSerial()` in `authController.js`
- **Format**: `PAT-YYYYMMDD-XXXX` 
  - `PAT`: Fixed prefix identifying a patient
  - `YYYYMMDD`: Current date in compact form
  - `XXXX`: Random 4-character hexadecimal string
- **Implementation**:
  ```javascript
  function generatePatientSerial() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `PAT-${date}-${rand}`;
  }
  ```
- **Uniqueness**: Enforced by a unique constraint in the MongoDB schema

### Multiple Users Per Email
- The system allows multiple patients to register with the same email address
- Each patient is uniquely identified by their serial number
- This allows family members to share a single email for communication

## Authentication Flow

### Login Process
1. User provides email, password, and role
2. System validates credentials against stored user data
3. Role-specific validation ensures users access appropriate interfaces
4. Upon successful validation, a JWT token is generated
5. A session record is created in the database
6. User is redirected to the appropriate dashboard:
   - Patients → Patient Dashboard
   - Doctors → Doctor Dashboard
   - Admins → Admin Dashboard

### Session Management
- Sessions are tracked in a dedicated collection in MongoDB
- Each session contains:
  - User ID reference
  - JWT token
  - Last active timestamp
  - Valid/invalid flag
  - Device information
- Sessions expire after 24 hours of inactivity
- Users can be logged out on all devices by invalidating all sessions

## Password Reset Flow

### Reset Request Process
1. User initiates password reset from login page
2. User provides email address
3. System locates the user account
4. For patients, additional verification may be required:
   - Date of birth verification
   - Patient serial number confirmation
5. Reset token is generated and stored with expiration time
6. Email with reset instructions is sent to user's email address
7. In development mode, token may be directly provided in the response

### Password Reset Completion
1. User follows link with reset token
2. User provides new password
3. System validates token and updates password
4. All existing sessions are invalidated for security
5. User is redirected to login page with success message

## API Endpoints

### Authentication Routes
- `POST /api/auth/signup`: Register new user
- `POST /api/auth/login`: Authenticate user
- `POST /api/auth/logout`: End user session
- `GET /api/auth/validate-session`: Check if session is valid

### Password Reset Routes
- `POST /api/password/request-reset`: Request password reset
- `POST /api/password/reset`: Complete password reset

## Security Considerations

### Password Security
- Passwords are hashed using bcrypt with appropriate salt rounds
- Plain text passwords are never stored or logged
- Password complexity requirements are enforced

### Session Security
- JWT tokens are signed with a secure secret key
- Tokens have a limited lifetime
- Sessions are tracked in the database for additional control
- Sessions can be forcibly terminated by administrators

### Input Validation
- All user inputs are validated for format and content
- Email format is validated
- Password strength is enforced

## User Roles and Permissions

### Patient
- Can register with minimal verification
- Receives unique serial number on registration
- Can upload and view their own MRI scans
- Can view analysis results and history

### Doctor
- Requires additional professional information
- Must be verified before accessing certain features
- Can view assigned patients and their scan results
- Can provide professional input on results

### Administrator
- Highest level of system access
- Can manage all users (create, view, delete)
- Can verify doctor credentials
- Can enable/disable system features

## Data Model

### User Schema
```javascript
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true }, // Not unique
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['admin', 'doctor', 'patient'],
        default: 'patient',
        required: true
    },
    doctorInfo: {
        // Doctor-specific fields
        licenseNumber: { type: String },
        specialty: { type: String },
        // ...other fields
    },
    patientInfo: {
        // Patient-specific fields
        dateOfBirth: { type: Date },
        gender: { type: String },
        medicalHistory: [String],
        serial: { type: String, unique: true, sparse: true } // Unique constraint
    },
    // ...other fields
});
```
