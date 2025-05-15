import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./userSignUp.css";

const UserSignUp = () => {  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
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

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'name':
        if (!value) error = 'Name is required';
        else if (value.length < 2) error = 'Name must be at least 2 characters';
        break;
      case 'email':
        if (!value) error = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(value)) error = 'Email is invalid';
        break;
      case 'password':
        if (!value) error = 'Password is required';
        else if (value.length < 8) error = 'Password must be at least 8 characters';
        else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          error = 'Password must contain uppercase, lowercase, and number';
        }
        break;
      case 'confirmPassword':
        if (!value) error = 'Please confirm your password';
        else if (value !== form.password) error = 'Passwords do not match';
        break;
      case 'doctorInfo.licenseNumber':
        if (form.role === 'doctor' && !value) error = 'License number is required';
        break;
      case 'doctorInfo.specialty':
        if (form.role === 'doctor' && !value) error = 'Specialty is required';
        break;
      case 'doctorInfo.hospital':
        if (form.role === 'doctor' && !value) error = 'Hospital is required';
        break;
      case 'doctorInfo.yearsOfExperience':
        if (form.role === 'doctor' && !value) error = 'Years of experience is required';
        break;
      case 'doctorInfo.education':
        if (form.role === 'doctor' && !value) error = 'Education details are required';
        break;
      case 'patientInfo.dateOfBirth':
        if (form.role === 'patient' && !value) error = 'Date of birth is required';
        break;
      case 'patientInfo.gender':
        if (form.role === 'patient' && !value) error = 'Gender is required';
        break;
      default:
        break;
    }
    return error;
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, e.target.value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };
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
      // Clear errors when switching roles
      setErrors({});
      setTouched({});
    }

    // Validate field if it's been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
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
  const validateForm = () => {
    const newErrors = {};
    const newTouched = {};
    
    // Validate basic fields
    ['name', 'email', 'password', 'confirmPassword'].forEach(field => {
      newTouched[field] = true;
      newErrors[field] = validateField(field, form[field]);
    });
    
    // Validate role-specific fields
    if (form.role === 'doctor') {
      ['licenseNumber', 'specialty', 'hospital', 'yearsOfExperience', 'education'].forEach(field => {
        const fullField = `doctorInfo.${field}`;
        newTouched[fullField] = true;
        newErrors[fullField] = validateField(fullField, form.doctorInfo[field]);
      });
    } else if (form.role === 'patient') {
      ['dateOfBirth', 'gender'].forEach(field => {
        const fullField = `patientInfo.${field}`;
        newTouched[fullField] = true;
        newErrors[fullField] = validateField(fullField, form.patientInfo[field]);
      });
    }
    
    setTouched(newTouched);
    setErrors(newErrors);
    
    return Object.values(newErrors).every(error => !error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to the first error if any
      const firstError = document.querySelector('.field-error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    try {
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
      console.log('Response data:', data);      
      if (response.ok) {
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
          </select>          <div className="form-group">
            <label className="required-field">Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.name && touched.name ? 'input-error' : ''}
              required
            />
            {errors.name && touched.name && (
              <div className="field-error">{errors.name}</div>
            )}
          </div>

          <div className="form-group">
            <label className="required-field">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.email && touched.email ? 'input-error' : ''}
              required
            />
            {errors.email && touched.email && (
              <div className="field-error">{errors.email}</div>
            )}
          </div>
          
          <div className="form-group">
            <label className="required-field">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.password && touched.password ? 'input-error' : ''}
                required
              />
              <button 
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && touched.password && (
              <div className="field-error">{errors.password}</div>
            )}
          </div>

          <div className="form-group">
            <label className="required-field">Confirm Password</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.confirmPassword && touched.confirmPassword ? 'input-error' : ''}
                required
              />
              <button 
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && touched.confirmPassword && (
              <div className="field-error">{errors.confirmPassword}</div>
            )}
          </div>

          {showDoctorFields && (
            <div className="doctor-fields">
              <h3>Doctor Verification</h3>              <div className="form-group">
                <label className="required-field">License Number</label>
                <input
                  type="text"
                  name="doctorInfo.licenseNumber"
                  placeholder="Enter your medical license number"
                  value={form.doctorInfo.licenseNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors['doctorInfo.licenseNumber'] && touched['doctorInfo.licenseNumber'] ? 'input-error' : ''}
                  required
                />
                {errors['doctorInfo.licenseNumber'] && touched['doctorInfo.licenseNumber'] && (
                  <div className="field-error">{errors['doctorInfo.licenseNumber']}</div>
                )}
              </div>

              <div className="form-group">
                <label className="required-field">Specialty</label>
                <input
                  type="text"
                  name="doctorInfo.specialty"
                  placeholder="Enter your medical specialty"
                  value={form.doctorInfo.specialty}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors['doctorInfo.specialty'] && touched['doctorInfo.specialty'] ? 'input-error' : ''}
                  required
                />
                {errors['doctorInfo.specialty'] && touched['doctorInfo.specialty'] && (
                  <div className="field-error">{errors['doctorInfo.specialty']}</div>
                )}
              </div>

              <div className="form-group">
                <label className="required-field">Hospital/Clinic</label>
                <input
                  type="text"
                  name="doctorInfo.hospital"
                  placeholder="Enter your hospital or clinic name"
                  value={form.doctorInfo.hospital}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors['doctorInfo.hospital'] && touched['doctorInfo.hospital'] ? 'input-error' : ''}
                  required
                />
                {errors['doctorInfo.hospital'] && touched['doctorInfo.hospital'] && (
                  <div className="field-error">{errors['doctorInfo.hospital']}</div>
                )}
              </div>

              <div className="form-group">
                <label className="required-field">Years of Experience</label>
                <input
                  type="number"
                  name="doctorInfo.yearsOfExperience"
                  placeholder="Enter your years of experience"
                  value={form.doctorInfo.yearsOfExperience}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors['doctorInfo.yearsOfExperience'] && touched['doctorInfo.yearsOfExperience'] ? 'input-error' : ''}
                  required
                />
                {errors['doctorInfo.yearsOfExperience'] && touched['doctorInfo.yearsOfExperience'] && (
                  <div className="field-error">{errors['doctorInfo.yearsOfExperience']}</div>
                )}
              </div>

              <div className="form-group">
                <label className="required-field">Education/Qualifications</label>
                <input
                  type="text"
                  name="doctorInfo.education"
                  placeholder="Enter your education and qualifications"
                  value={form.doctorInfo.education}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors['doctorInfo.education'] && touched['doctorInfo.education'] ? 'input-error' : ''}
                  required
                />
                {errors['doctorInfo.education'] && touched['doctorInfo.education'] && (
                  <div className="field-error">{errors['doctorInfo.education']}</div>
                )}
              </div>
            </div>
          )}

          {form.role === 'patient' && (
            <div className="patient-fields">
              <div className="form-group">
                <label className="required-field">Date of Birth</label>
                <input
                  type="date"
                  name="patientInfo.dateOfBirth"
                  value={form.patientInfo.dateOfBirth}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors['patientInfo.dateOfBirth'] && touched['patientInfo.dateOfBirth'] ? 'input-error' : ''}
                  required
                />
                {errors['patientInfo.dateOfBirth'] && touched['patientInfo.dateOfBirth'] && (
                  <div className="field-error">{errors['patientInfo.dateOfBirth']}</div>
                )}
              </div>
              <div className="form-group">
                <label className="required-field">Gender</label>
                <select
                  name="patientInfo.gender"
                  value={form.patientInfo.gender}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors['patientInfo.gender'] && touched['patientInfo.gender'] ? 'input-error' : ''}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors['patientInfo.gender'] && touched['patientInfo.gender'] && (
                  <div className="field-error">{errors['patientInfo.gender']}</div>
                )}
              </div>
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
