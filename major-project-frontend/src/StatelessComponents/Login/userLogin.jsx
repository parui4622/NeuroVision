import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Aurora from "../../StatefullComponents/Aurora/Aurora.jsx";
import "./login.css";

const UserLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!email || !password) {
      setError("Please fill in both fields!");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, role })
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different error cases
        if (response.status === 401) {
          if (role === 'admin') {
            throw new Error('Access Denied - Administrative privileges required');
          } else {
            throw new Error(`${role === 'doctor' ? 'Doctor' : 'User'} not found. Please sign up first.`);
          }
        }
        throw new Error(data.error || 'Login failed');
      }

      // Verify role matches
      if (data.user.role !== role) {
        if (role === 'admin') {
          throw new Error('Access Denied - Administrative privileges required');
        } else {
          throw new Error(`Invalid credentials for ${role} access`);
        }
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      switch (data.user.role) {
        case "admin":
          navigate('/admin');
          break;
        case "doctor":
          navigate('/doctor');
          break;
        case "patient":
          navigate('/dashboard');
          break;
        default:
          navigate('/login');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  // Developer bypass function
  const handleDeveloperAccess = () => {
    const tempUser = {
      _id: 'dev-user-id',
      name: 'Developer Access',
      role: role,
      email: 'dev@example.com'
    };
    
    localStorage.setItem('token', 'dev-bypass-token');
    localStorage.setItem('user', JSON.stringify(tempUser));
    
    switch (role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'doctor':
        navigate('/doctor');
        break;
      case 'patient':
        navigate('/dashboard');
        break;
      default:
        navigate('/login');
    }
  };

  return (
    <div className="login-page">
      <Aurora />
      <div className="login-card">
        <h2>Login</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button 
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <select 
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="role-select"
          >
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit">Login</button>
          
          {/* Developer bypass button - TO BE REMOVED IN PRODUCTION */}
          <button 
            type="button" 
            onClick={handleDeveloperAccess}
            className="developer-button"
          >
            Developer Access - {role.charAt(0).toUpperCase() + role.slice(1)} Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserLogin;
