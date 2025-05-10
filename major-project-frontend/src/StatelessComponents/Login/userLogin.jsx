import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Aurora from "../../StatefullComponents/Aurora/Aurora.jsx";
import "./login.css";

const UserLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    // Simple validation
    if (!email || !password) {
      alert("Please fill in both fields!");
      return;
    }

    // Future: connect to backend API here
    console.log("Logging in with:", { email, password });

    // For now, navigate to dashboard directly
    // In the future, this should happen after successful API authentication
    navigate('/dashboard');
  };

  return (
    <div className="login-page">
      <Aurora />

      <div className="login-card">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Enter Password"            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Login</button>
          <button 
            type="button" 
            onClick={() => navigate('/dashboard')}
            style={{
              marginTop: '10px',
              backgroundColor: '#163d78',
              color: 'white',
              padding: '12px 20px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Go to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserLogin;
