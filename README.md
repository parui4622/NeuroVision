# 🧠 NeuroVision: Alzheimer's Detection System

A modern web-based application for early detection and monitoring of Alzheimer's disease using deep learning and medical imaging analysis.

![NeuroVision](major-project-frontend/src/assets/brain-2.png)

---

## 🚀 Recent Updates (2025-2026)
- Admin: Change Password feature added (API + UI) with improved validation and status messages.
- Admin Dashboard: Classification toggle and state endpoints available.
- Admin Data: Dashboard lists for doctors, patients, and admins.
- Prediction: Improved parsing of Python stdout and error logging.
- Frontend Security: Console logs suppressed in production builds.
- Duplicate Emails Allowed: Multiple users can register with the same email address (unique by userId).
- Simplified Doctor Signup: Only name, email, and password required.
- OTP Email Verification: All users must verify their email via OTP before dashboard access.
- Role-based Redirects: After OTP verification, users are redirected to the correct dashboard based on backend-verified role.
- Resend OTP Feature: Users can request a new OTP during verification.
- All Business Logic in Backend: Role, verification, and redirect logic handled server-side.
- Admin Management Scripts: Tools for admin user creation and password reset included.
- Patient Serial Numbers: Each patient receives a unique serial number.

---

## 📖 Table of Contents
- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Setup & Installation](#setup--installation)
- [Running the Application](#running-the-application)
- [Further Documentation](#further-documentation)
- [License](#license)
- [Contact](#contact)

---

## Project Overview
This full-stack application enables:
- Upload and analysis of brain MRI scans
- Real-time AI-powered analysis
- Patient progress tracking
- Secure management of medical histories
- Role-based dashboards for patients, doctors, and admins

---

## 🛠 Tech Stack
**Frontend:**
- React 18 (Vite)
- React Router
- Lucide React (icons)
- Modern CSS3
- JWT Authentication

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose
- JWT & bcrypt
- PyTorch & Python (AI model)
- CORS & Helmet

---

## ✨ Key Features
- Multi-role authentication (patient, doctor, admin)
- OTP email verification for all users
- Secure password reset and management
- Unique patient serial numbers
- Admin management scripts
- AI-powered MRI scan analysis
- Role-based dashboards

---

## 🖥️ Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- npm (comes with Node.js)
- Python (v3.8 or higher)
- pip (Python package manager)
- MongoDB (local or cloud instance)

### 1. Clone the Repository
```bash
git clone https://github.com/[your-username]/neurovision.git
cd neurovision
```

### 2. Install Dependencies
You can use the provided setup script (Windows):
```bash
setup.cmd
```
Or, install manually:
```bash
# Backend dependencies
cd major-project-backend
npm install
cd ..

# Frontend dependencies
cd major-project-frontend
npm install
cd ..

# Python AI dependencies
cd major-project-backend/python
pip install -r requirements.txt
cd ../../..
```

### 3. Environment Configuration
- **Backend:**
  - Copy or create `major-project-backend/.env` with the following (replace with your values):
    ```env
    MONGODB_URI=mongodb://localhost:27017/neurovision_database
    JWT_SECRET=REPLACE_WITH_SECURE_RANDOM_SECRET
    EMAIL_USER=your-email@gmail.com
    EMAIL_PASS=your-gmail-app-password
    FRONTEND_URL=http://localhost:5173
    PORT=5000
    ```
- **Frontend:**
  - Copy or create `major-project-frontend/.env`:
    ```env
    VITE_API_URL=http://localhost:5000
    BACKEND_URL=http://localhost:5000
    ```

> **Note:** Never commit your `.env` files or secrets to version control.

---

## ▶️ Running the Application

### 1. Start MongoDB
Make sure MongoDB is running locally or use a cloud instance (e.g., MongoDB Atlas).

### 2. Start Backend Server
```bash
cd major-project-backend
npm run dev
```

### 3. Start Frontend Development Server
```bash
cd major-project-frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## 📚 Further Documentation
- For API details, authentication flows, Docker setup, and more, see the `documentation/` folder:
  - [API Documentation](documentation/api-documentation.md)
  - [Authentication](documentation/authentication-documentation.md)
  - [Docker Setup](documentation/docker-documentation.md)
  - [Patient Serial System](documentation/patient-serial-documentation.md)
  - [Project Architecture](documentation/project-documentation.md)
  - [Implementation Summary](documentation/implementation-summary.md)

---

## 📄 License
This project is licensed under the MIT License. See the LICENSE file for details.

---

## 📞 Contact
For any queries regarding this project, please contact:
- Repository: [NeuroVision](https://github.com/parui4622/NeuroVision)
- Owner: Sourabh Parui (saurav4622)

---

© 2026 NeuroVision Team. All rights reserved.
