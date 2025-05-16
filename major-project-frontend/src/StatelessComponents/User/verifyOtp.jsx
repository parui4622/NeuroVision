import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const VerifyOtp = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const userId = location.state?.userId;
  const email = location.state?.email;
  const role = location.state?.role;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setResendMsg("");
    if (!otp) {
      setError("Please enter the OTP sent to your email.");
      return;
    }
    try {
      const response = await fetch("http://localhost:5000/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, otp })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess("Email verified! Redirecting...");
        setTimeout(() => {
          const verifiedRole = data.role;
          if (verifiedRole === 'doctor') navigate('/doctor');
          else if (verifiedRole === 'patient') navigate('/dashboard');
          else if (verifiedRole === 'admin') navigate('/admin');
          else navigate('/');
        }, 1500);
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
      const response = await fetch("http://localhost:5000/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();
      if (response.ok) {
        setResendMsg("OTP resent to your email.");
      } else {
        setError(data.error || "Failed to resend OTP");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  if (!userId) {
    return <div>No user found. Please sign up again.</div>;
  }

  return (
    <div className="signup-page">
      <div className="signup-card">
        <h2>Verify Your Email</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            required
          />
          <button type="submit">Verify</button>
        </form>
        <button style={{marginTop: 10}} onClick={handleResend} type="button">Resend OTP</button>
        {error && <div className="field-error">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        {resendMsg && <div className="success-message">{resendMsg}</div>}
      </div>
    </div>
  );
};

export default VerifyOtp;
