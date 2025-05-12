import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./userSignUp.css";

const UserSignUp = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "patient",
    doctorInfo: {
      licenseNumber: "",
      specialty: "",
      hospital: "",
      yearsOfExperience: "",
      education: ""
    },
    patientInfo: {
      dateOfBirth: "",
      gender: ""
    }
  });
  
  const [showDoctorFields, setShowDoctorFields] = useState(false);
  const navigate = useNavigate();
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
    }

    if (name === 'role') {
      setShowDoctorFields(value === 'doctor');
    }
  };
  const handleGoogleSignup = async () => {
    // Initialize Google Sign-In
    const auth2 = await window.gapi.auth2.getAuthInstance();
    const googleUser = await auth2.signIn();
    
    const profile = googleUser.getBasicProfile();
    const googleData = {
      name: profile.getName(),
      email: profile.getEmail(),
      googleId: profile.getId(),
      picture: profile.getImageUrl(),
      role: 'patient' // Google signup is only for patients
    };
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/google-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleData)
      });
      
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      alert("Please fill in all required fields");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (form.role === 'doctor') {
      const doctorFields = ['licenseNumber', 'specialty', 'hospital', 'yearsOfExperience', 'education'];
      for (const field of doctorFields) {
        if (!form.doctorInfo[field]) {
          alert(`Please fill in all doctor verification fields: ${field} is missing`);
          return;
        }
      }
    }    try {
      // Format the dateOfBirth as ISO string if it exists
      const formattedForm = {
        ...form,
        doctorInfo: form.role === 'doctor' ? {
          ...form.doctorInfo,
          yearsOfExperience: parseInt(form.doctorInfo.yearsOfExperience) || 0
        } : undefined,
        patientInfo: form.role === 'patient' ? {
          ...form.patientInfo,
          dateOfBirth: form.patientInfo.dateOfBirth ? new Date(form.patientInfo.dateOfBirth).toISOString() : undefined
        } : undefined
      };

      // Remove undefined fields
      if (!formattedForm.doctorInfo) delete formattedForm.doctorInfo;
      if (!formattedForm.patientInfo) delete formattedForm.patientInfo;

      console.log('Submitting form:', { ...formattedForm, password: '[REDACTED]' });
      
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formattedForm)
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);      if (response.ok) {
        // Save the token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        alert('Registration successful!');
        
        // Redirect based on role
        switch (form.role) {
          case "doctor":
            navigate('/doctor');
            break;
          case "patient":
            navigate('/dashboard');
            break;
          default:
            navigate('/dashboard');
        }
      } else {
        throw new Error(data.error || 'Failed to register');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert(error.message || 'An error occurred during registration');
    }
  };
  return (
    <div className="signup-page">
      <div className="signup-card">
        <h2>Create Account</h2>
        <form onSubmit={handleSubmit}>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="role-select"
          >
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
          </select>

          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />

          {showDoctorFields && (
            <div className="doctor-fields">
              <h3>Doctor Verification</h3>
              <input
                type="text"
                name="doctorInfo.licenseNumber"
                placeholder="License Number"
                value={form.doctorInfo.licenseNumber}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="doctorInfo.specialty"
                placeholder="Specialty"
                value={form.doctorInfo.specialty}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="doctorInfo.hospital"
                placeholder="Hospital/Clinic"
                value={form.doctorInfo.hospital}
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="doctorInfo.yearsOfExperience"
                placeholder="Years of Experience"
                value={form.doctorInfo.yearsOfExperience}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="doctorInfo.education"
                placeholder="Education/Qualifications"
                value={form.doctorInfo.education}
                onChange={handleChange}
                required
              />
            </div>
          )}

          {form.role === 'patient' && (
            <div className="patient-fields">
              <input
                type="date"
                name="patientInfo.dateOfBirth"
                value={form.patientInfo.dateOfBirth}
                onChange={handleChange}
              />
              <select
                name="patientInfo.gender"
                value={form.patientInfo.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}

          <button type="submit" className="signup-button">Sign Up</button>
          
          {form.role === 'patient' && (
            <button 
              type="button" 
              onClick={handleGoogleSignup}
              className="google-signup-button"
            >
              Sign up with Google
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default UserSignUp;
