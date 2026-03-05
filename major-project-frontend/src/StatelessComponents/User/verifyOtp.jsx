import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../utils/apiConfig";
import { useAuth } from "../../utils/authHelpers";
import "../Login/login.css";


const VerifyOtp = () => {
    const { redirectBasedOnRole, setAuthData } = useAuth();
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [expired, setExpired] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setResendMsg("");
    setExpired(false);
    if (!otp) {
      setError("Please enter the OTP sent to your email.");
      return;
    }
    if (!email) {
      setError("No user found. Please sign up again.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const data = await response.json();
      if (response.ok && data.user?.role) {
        setSuccess("Email verified! Logging you in...");
        setAuthData(null, data.user);
        switch (data.user.role) {
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
            navigate('/');
        }
      } else if (response.ok) {
        setSuccess("Email verified! Redirecting...");
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(data.error || "Invalid OTP");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");
    setResendMsg("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok) {
        setResendMsg("OTP resent to your email.");
      } else {
        const errorMessage = data.error || "Failed to resend OTP";
        if (/user not found/i.test(errorMessage)) {
          setExpired(true);
          setError("Your verification session expired. Please sign up again.");
        } else {
          setError(errorMessage);
        }
      }
    } catch (err) {
      console.error('resend-otp failed:', err);
      setError("An error occurred. Please try again.");
    }
  };

  if (!email) {
    return (
      <div className="signup-page">
        <div className="signup-card">
          <h2>Verification Needed</h2>
          <div className="field-error" style={{marginTop: 10}}>No user found. Please sign up again.</div>
          <div className="button-container" style={{marginTop: 16}}>
            <button type="button" onClick={() => navigate('/signup')} className="animated-btn">Sign Up</button>
            <button type="button" onClick={() => navigate('/login')} className="back-to-login">Back to Login</button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="signup-page">
      <div className="signup-card">
        <h2>Verify Your Email</h2>
        <div className="info-text" style={{ marginBottom: '20px' }}>
          We've sent a verification code to <strong>{email}</strong>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            required
            className="animated-input"
          />
          <div className="button-container">
            <button type="submit" className="animated-btn">Verify</button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="back-to-login"
            >
              Back to Login
            </button>
          </div>
        </form>
        {error && <div className="field-error">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        {resendMsg && <div className="success-message">{resendMsg}</div>}
        <button type="button" onClick={handleResend} className="back-to-login" style={{ marginTop: 12 }}>
          Resend OTP
        </button>
      </div>
    </div>
  );
};

export default VerifyOtp;
