import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Aurora from "../../StatefullComponents/Aurora/Aurora.jsx";
import "./login.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState("verify"); // "verify", "request", or "reset"
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationData, setVerificationData] = useState({
    dateOfBirth: "",
    emailConfirm: "",
  });

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/password/request-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to request password reset');
        return;
      }

      if (data.status === 'success') {
        setMessage(data.message);
        setStep("reset");
        // In development, we get the token directly
        if (data.resetToken) {
          setResetToken(data.resetToken);
        }
      } else {
        setError(data.error || 'Failed to process password reset request');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!resetToken) {
      setError("Invalid reset token");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/password/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: resetToken,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to reset password');
        return;
      }

      setMessage('Password has been successfully reset');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError('An error occurred. Please try again later.');
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email || !verificationData.emailConfirm) {
      setError("Please enter your email address twice for confirmation");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/password/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          emailConfirm: verificationData.emailConfirm,
          dateOfBirth: verificationData.dateOfBirth
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Verification failed');
        return;
      }

      if (data.verified) {
        setMessage('Identity verified successfully');
        setStep("request");
      }
    } catch (err) {
      setError('An error occurred during verification');
    }
  };

  return (
    <div className="login-page">
      <Aurora />
      <div className="login-card">
        <h2>
          {step === "verify" 
            ? "Verify Identity" 
            : step === "request" 
              ? "Forgot Password" 
              : "Reset Password"}
        </h2>
        
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-container"><p className="error-message">{error}</p></div>}

        {step === "verify" ? (
          <form onSubmit={handleVerification}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="email"
              placeholder="Confirm your email"
              value={verificationData.emailConfirm}
              onChange={(e) => setVerificationData(prev => ({
                ...prev,
                emailConfirm: e.target.value
              }))}
            />
            <input
              type="date"
              placeholder="Date of Birth"
              value={verificationData.dateOfBirth}
              onChange={(e) => setVerificationData(prev => ({
                ...prev,
                dateOfBirth: e.target.value
              }))}
            />
            <button type="submit">Verify Identity</button>
            <button 
              type="button" 
              className="back-to-login"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </button>
          </form>
        ) : step === "request" ? (
          <form onSubmit={handleRequestReset}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit">Send Reset Link</button>
            <button 
              type="button" 
              className="back-to-login"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <input
              type="text"
              placeholder="Enter reset token"
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
            />
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button type="submit">Reset Password</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
