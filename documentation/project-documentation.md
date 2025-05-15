# NeuroVision Project Documentation

## Project Overview

NeuroVision is a web application designed to assist in the analysis of brain MRI scans for early detection of Alzheimer's disease. The system provides an intuitive interface for patients, doctors, and administrators, allowing for secure upload, analysis, and management of medical imaging data.

## Architecture

The project follows a modern client-server architecture:

1. **Frontend**: React-based single page application
2. **Backend**: Node.js/Express.js REST API
3. **Database**: MongoDB for data persistence
4. **Analysis Engine**: Python-based deep learning model for MRI analysis
5. **Container Support**: Docker-based deployment for all components

## Key Features

### User Management
- **Multi-role Authentication**: Support for patients, doctors, and administrators
- **Patient Registration**: Includes generation of unique patient serial numbers
- **Email Flexibility**: Multiple patients can share the same email address
- **Password Recovery**: Self-service password reset functionality
- **Session Management**: Secure session handling with JWT tokens

### MRI Analysis
- **Image Upload**: Support for multiple image formats (JPG, JPEG, PNG, GIF, BMP, WEBP)
- **Automated Analysis**: AI-powered detection of Alzheimer's markers in MRI scans
- **Result Visualization**: Clear presentation of analysis results
- **Report Storage**: Historical tracking of patient scans and results

### Administrative Tools
- **User Management**: Tools for administrators to manage both doctors and patients
- **System Configuration**: Ability to enable/disable system features
- **Doctor Verification**: Process for verifying doctor credentials

### Dashboard Interfaces
- **Patient Dashboard**: Upload scans, view results, track history
- **Doctor Dashboard**: Patient management, result review, reporting
- **Admin Dashboard**: System management, user administration

## Technical Implementation

### Frontend (React)
- **Component Structure**:
  - Stateless Components: Dashboard, Login, SignUp, etc.
  - Stateful Components: Button, Calendar, Aurora animation, etc.
- **Routing**: React Router with protected routes
- **State Management**: React Hooks for local state management
- **API Integration**: Axios for HTTP requests
- **UI Design**: Custom CSS with responsive design

### Backend (Node.js/Express)
- **API Endpoints**:
  - `/api/auth`: Authentication and user management
  - `/api/predict`: MRI analysis and prediction
  - `/api/admin`: Administrative functions
  - `/api/password`: Password reset functionality
- **Middleware**:
  - Session authentication
  - Admin authorization
  - Rate limiting
  - Input validation
- **Data Models**:
  - User: Core user data with role-specific fields
  - Session: For tracking active user sessions
  - AdminLog: For auditing administrative actions

### Security Features
- **Authentication**: JWT-based authentication
- **Password Security**: bcrypt hashing
- **Role-Based Access Control**: Authorization checks based on user roles
- **API Protection**: Rate limiting and input validation
- **Session Management**: Secure session tracking and timeout

### Patient Serial Number System
- **Format**: `PAT-YYYYMMDD-XXXX` where:
  - `PAT`: Fixed prefix for patient identifiers
  - `YYYYMMDD`: Date of registration
  - `XXXX`: Random 4-character hexadecimal string
- **Generation**: Automatic creation during patient registration
- **Uniqueness**: Enforced by database unique constraint
- **Display**: Shown on patient dashboard and admin interfaces

## Database Schema

### User Collection
- Core Fields: `name`, `email`, `password`, `role`
- Role-specific Fields:
  - `doctorInfo`: For doctors (license, specialty, etc.)
  - `patientInfo`: For patients (dateOfBirth, gender, serial, etc.)
- Additional Fields: `createdAt`, `lastActive`, `status`, etc.

### Session Collection
- `userId`: Reference to User
- `token`: JWT token
- `lastActive`: Timestamp
- `isValid`: Boolean flag
- `deviceInfo`: Client information

### System Configuration Collection
- `key`: Configuration key
- `value`: Configuration value

## Docker Setup

The project includes Docker support for containerized deployment:

- **Frontend Container**: Serves the React application
- **Backend Container**: Runs the Node.js/Express API
- **MongoDB Container**: Provides the database service
- **Docker Compose**: Orchestrates all services

## Security Considerations

1. **Data Protection**: Secure handling of medical data
2. **Authentication**: Strong password policies and secure authentication
3. **Session Management**: Proper session timeout and validation
4. **Input Validation**: Protection against injection attacks
5. **Access Control**: Role-based permissions enforcement

## Development and Deployment

### Local Development
1. Clone the repository
2. Install dependencies:
   - Backend: `cd major-project-backend && npm install`
   - Frontend: `cd major-project-frontend && npm install`
3. Configure environment variables
4. Start services:
   - Backend: `npm run dev` in backend directory
   - Frontend: `npm run dev` in frontend directory

### Docker Deployment
1. Build images: `docker-compose build`
2. Start services: `docker-compose up -d`
3. Access application at http://localhost:3000

## Scripts and Tools

- `createAdmin.js`: Creates an admin user
- `resetAdmin.js`: Resets admin password
- `createInitialUsers.js`: Creates initial test users

## Future Enhancements

1. **Enhanced Reporting**: More detailed analysis and reporting
2. **Telemedicine Integration**: Direct doctor-patient communication
3. **Mobile Application**: Native mobile clients
4. **Advanced Analytics**: Population-level trend analysis
5. **API Extensions**: Support for third-party integrations
