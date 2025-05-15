# NeuroVision API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication Endpoints

### Register User

Creates a new user account.

- **URL**: `/auth/signup`
- **Method**: `POST`
- **Auth Required**: No
- **Content-Type**: `application/json`

**Request Body**:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "patient",
  "patientInfo": {
    "dateOfBirth": "1980-01-01",
    "gender": "Male",
    "medicalHistory": ["Hypertension"]
  }
}
```

For doctors:

```json
{
  "name": "Dr. Jane Smith",
  "email": "jane@hospital.com",
  "password": "securePassword123",
  "role": "doctor",
  "doctorInfo": {
    "licenseNumber": "MED12345",
    "specialty": "Neurology",
    "hospital": "General Hospital",
    "yearsOfExperience": 10,
    "education": "Harvard Medical School"
  }
}
```

**Response**:

```json
{
  "message": "User created successfully",
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "patient",
    "patientInfo": {
      "dateOfBirth": "1980-01-01T00:00:00.000Z",
      "gender": "Male",
      "medicalHistory": ["Hypertension"],
      "serial": "PAT-20250515-A1B2"
    },
    "createdAt": "2025-05-15T10:00:00.000Z"
  },
  "sessionId": "session_id"
}
```

### Login

Authenticates a user and returns a token.

- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth Required**: No
- **Content-Type**: `application/json`

**Request Body**:

```json
{
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "patient"
}
```

**Response**:

```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "patient",
    "patientInfo": {
      "dateOfBirth": "1980-01-01T00:00:00.000Z",
      "gender": "Male",
      "medicalHistory": ["Hypertension"],
      "serial": "PAT-20250515-A1B2"
    },
    "lastActive": "2025-05-15T10:30:00.000Z"
  },
  "sessionId": "session_id"
}
```

### Logout

Invalidates the user's session.

- **URL**: `/auth/logout`
- **Method**: `POST`
- **Auth Required**: Yes
- **Headers**: `Authorization: Bearer jwt_token_here`

**Response**:

```json
{
  "message": "Logged out successfully"
}
```

### Validate Session

Checks if the current session is valid.

- **URL**: `/auth/validate-session`
- **Method**: `GET`
- **Auth Required**: Yes
- **Headers**: `Authorization: Bearer jwt_token_here`

**Response**:

```json
{
  "valid": true,
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "patient",
    "patientInfo": {
      "dateOfBirth": "1980-01-01T00:00:00.000Z",
      "gender": "Male",
      "medicalHistory": ["Hypertension"],
      "serial": "PAT-20250515-A1B2"
    }
  },
  "sessionId": "session_id"
}
```

## Password Reset Endpoints

### Request Password Reset

Initiates the password reset process.

- **URL**: `/password/request-reset`
- **Method**: `POST`
- **Auth Required**: No
- **Content-Type**: `application/json`

**Request Body**:

```json
{
  "email": "john@example.com",
  "dateOfBirth": "1980-01-01"
}
```

**Response**:

```json
{
  "status": "success",
  "verified": true,
  "message": "Recovery email sent to your address."
}
```

### Reset Password

Completes the password reset process.

- **URL**: `/password/reset`
- **Method**: `POST`
- **Auth Required**: No
- **Content-Type**: `application/json`

**Request Body**:

```json
{
  "token": "reset_token_here",
  "password": "newSecurePassword123"
}
```

**Response**:

```json
{
  "status": "success",
  "message": "Password has been reset successfully."
}
```

## MRI Analysis Endpoints

### Predict from MRI Image

Uploads and analyzes an MRI scan.

- **URL**: `/predict`
- **Method**: `POST`
- **Auth Required**: Yes
- **Headers**: `Authorization: Bearer jwt_token_here`
- **Content-Type**: `application/json`

**Request Body**:

```json
{
  "image": "base64_encoded_image_data",
  "filename": "brain_scan.jpg"
}
```

**Response**:

```json
{
  "prediction": "Normal",
  "confidence": 0.95,
  "processingTime": "2.5s"
}
```

## Admin Endpoints

### Get All Doctors

Retrieves all registered doctors.

- **URL**: `/admin/doctors`
- **Method**: `GET`
- **Auth Required**: Yes (Admin only)
- **Headers**: `Authorization: Bearer jwt_token_here`

**Response**:

```json
[
  {
    "_id": "doctor_id",
    "name": "Dr. Jane Smith",
    "email": "jane@hospital.com",
    "role": "doctor",
    "doctorInfo": {
      "licenseNumber": "MED12345",
      "specialty": "Neurology",
      "hospital": "General Hospital",
      "yearsOfExperience": 10,
      "education": "Harvard Medical School",
      "isVerified": true
    },
    "createdAt": "2025-04-15T09:00:00.000Z"
  },
  ...
]
```

### Get All Patients

Retrieves all registered patients.

- **URL**: `/admin/patients`
- **Method**: `GET`
- **Auth Required**: Yes (Admin only)
- **Headers**: `Authorization: Bearer jwt_token_here`

**Response**:

```json
[
  {
    "_id": "patient_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "patient",
    "patientInfo": {
      "dateOfBirth": "1980-01-01T00:00:00.000Z",
      "gender": "Male",
      "medicalHistory": ["Hypertension"],
      "serial": "PAT-20250515-A1B2"
    },
    "createdAt": "2025-05-15T10:00:00.000Z",
    "lastActive": "2025-05-15T14:30:00.000Z"
  },
  ...
]
```

### Delete User

Removes a user from the system.

- **URL**: `/admin/:userType/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (Admin only)
- **Headers**: `Authorization: Bearer jwt_token_here`
- **URL Parameters**: 
  - `userType`: Either 'doctor' or 'patient'
  - `id`: MongoDB ObjectId of the user

**Response**:

```json
{
  "message": "User deleted successfully"
}
```

### Toggle Classification System

Enables or disables the MRI classification system.

- **URL**: `/admin/toggle-classification`
- **Method**: `POST`
- **Auth Required**: Yes (Admin only)
- **Headers**: `Authorization: Bearer jwt_token_here`
- **Content-Type**: `application/json`

**Request Body**:

```json
{
  "enabled": true
}
```

**Response**:

```json
{
  "classificationEnabled": true
}
```

### Get Classification System State

Retrieves the current state of the classification system.

- **URL**: `/admin/classification-state`
- **Method**: `GET`
- **Auth Required**: Yes (Admin only)
- **Headers**: `Authorization: Bearer jwt_token_here`

**Response**:

```json
{
  "classificationEnabled": true
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "error": "Invalid input data",
  "details": "Error details here"
}
```

### 401 Unauthorized

```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "error": "Access denied",
  "details": "This endpoint requires admin privileges"
}
```

### 404 Not Found

```json
{
  "error": "Resource not found"
}
```

### 500 Server Error

```json
{
  "error": "Internal server error"
}
```

## Authentication

The API uses JWT (JSON Web Token) authentication. After login or registration, include the returned token in the Authorization header for subsequent requests:

```
Authorization: Bearer your_jwt_token_here
```

Tokens expire after 24 hours, after which you need to login again to get a new token.
