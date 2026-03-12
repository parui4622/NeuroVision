# 🧠 NeuroVision: Alzheimer's Detection System

A modern web-based application for early detection and monitoring of Alzheimer's disease using deep learning and medical imaging analysis.

![NeuroVision](major-project-frontend/src/assets/brain-2.png)

---

## 🚀 Recent Updates (2025-2026)
- **Microservices Architecture**: Migrated heavy PyTorch AI inference to a dedicated Hugging Face Space to eliminate server memory bottlenecks.
- **Modern Email API**: Integrated the Brevo REST API to handle OTP delivery, bypassing traditional SMTP firewalls for instant, reliable email verification.
- Admin: Change Password feature added (API + UI) with improved validation and status messages.
- Admin Dashboard: Classification toggle and state endpoints available.
- Admin Data: Dashboard lists for doctors, patients, and admins.
- Prediction: Improved parsing of Python stdout and error logging.
- Frontend Security: Console logs suppressed in production builds.
- Duplicate Emails Allowed: Multiple users can register with the same email address (unique by userId).
- Simplified Doctor Signup: Only name, email, and password required.
- OTP Email Verification: All users must verify their email via OTP before dashboard access.
- Role-based Redirects: After OTP verification, users are redirected to the correct dashboard based on backend-verified role.
- All Business Logic in Backend: Role, verification, and redirect logic handled server-side.
- Patient Serial Numbers: Each patient receives a unique serial number.

---

## 📖 Table of Contents
- [Project Overview](#project-overview)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Setup & Installation](#setup--installation)
- [Running the Application](#running-the-application)
- [Further Documentation](#further-documentation)
- [License](#license)
- [Contact](#contact)

---

## 🎯 Project Overview
This full-stack application enables:
- Upload and analysis of brain MRI scans
- Real-time AI-powered analysis
- Patient progress tracking
- Secure management of medical histories
- Role-based dashboards for patients, doctors, and admins

---

## 🏗️ System Architecture
To handle heavy AI computations on a budget while maintaining a fast user experience, this project utilizes a modern **Microservices Architecture**:
1. **Frontend**: React.js (Deployed on Vercel).
2. **Main Backend**: Node.js & Express.js (Deployed on Render) - Handles Auth, routing, database management, and API bridging.
3. **AI Engine**: Python & FastAPI (Hosted on Hugging Face Spaces) - A dedicated 16GB RAM environment running the PyTorch/ResNet50 model for blazing-fast MRI predictions.
4. **Email Service**: Brevo REST API - Ensures 100% deliverability for OTPs and notifications.

---

## 🛠 Tech Stack
**Frontend:**
- React 18 (Vite)
- React Router
- Lucide React (icons)
- Modern CSS3
- Vercel (Deployment)

**Backend:**
- Node.js & Express.js
- MongoDB Atlas & Mongoose
- JWT & bcrypt
- Render (Deployment)

**AI Microservice:**
- Python 3.8+
- FastAPI
- PyTorch (ResNet50)
- Hugging Face Spaces (Deployment)

---

## ✨ Key Features
- Multi-role authentication (patient, doctor, admin)
- OTP email verification via REST API
- Secure password reset and management
- Unique patient serial numbers
- Admin management scripts
- AI-powered MRI scan analysis via external microservice
- Role-based dashboards

---

## 🖥️ Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- npm (comes with Node.js)
- MongoDB (local or cloud instance)

### 1. Clone the Repository
```bash
git clone [https://github.com/parui4622/NeuroVision.git](https://github.com/parui4622/NeuroVision.git)
cd NeuroVision

```

### 2. Install Dependencies

```bash
# Backend dependencies
cd major-project-backend
npm install

# Frontend dependencies
cd ../major-project-frontend
npm install

```

### 3. Environment Configuration

* **Backend:**
Create a `major-project-backend/.env` file with the following:
```env
MONGODB_URI=mongodb+srv://<your-cluster-url>
JWT_SECRET=REPLACE_WITH_SECURE_RANDOM_SECRET
EMAIL_USER=your-verified-brevo-email@gmail.com
BREVO_API_KEY=your-brevo-api-key
FRONTEND_URL=http://localhost:5173
PORT=5000

```


* **Frontend:**
Create a `major-project-frontend/.env` file:
```env
VITE_API_URL=http://localhost:5000

```



> **Note:** Never commit your `.env` files or secrets to version control.

---

## ▶️ Running the Application

### 1. Start Backend Server

```bash
cd major-project-backend
npm run dev

```

### 2. Start Frontend Development Server

```bash
cd major-project-frontend
npm run dev

```

* Frontend: `http://localhost:5173`
* Backend API: `http://localhost:5000`

---

## 📚 Further Documentation

* For API details, authentication flows, Docker setup, and more, see the `documentation/` folder:
* [API Documentation](https://www.google.com/search?q=documentation/api-documentation.md)
* [Authentication](https://www.google.com/search?q=documentation/authentication-documentation.md)
* [Docker Setup](https://www.google.com/search?q=documentation/docker-documentation.md)
* [Patient Serial System](https://www.google.com/search?q=documentation/patient-serial-documentation.md)
* [Project Architecture](https://www.google.com/search?q=documentation/project-documentation.md)
* [Implementation Summary](https://www.google.com/search?q=documentation/implementation-summary.md)



---

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

---

## 📞 Contact

For any queries regarding this project, please contact:

* Repository: [NeuroVision](https://github.com/parui4622/NeuroVision)
* Owner: Sourabh Parui (saurav4622)

---

© 2026 NeuroVision Team. All rights reserved.
