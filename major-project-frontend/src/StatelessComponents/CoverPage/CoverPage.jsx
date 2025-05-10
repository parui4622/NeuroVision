import { useNavigate } from "react-router-dom";
import coverImage from "../../assets/cover-page.png";
import "./CoverPage.css";

const CoverPage = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/signup');
  };

  return (
    <div className="cover-page">
      <div className="overlay"></div>

      <div className="content">
        <div className="left">
          <img src={coverImage} alt="Human Neuro Image" />
        </div>

        <div className="right">
          <h1>NeuroVision: AI-Driven MRI Analysis for Alzheimer's Detection</h1>
          <h2>Revolutionizing Neurological Insights with AI</h2>

          <div className="buttons">
            <button className="login-btn" onClick={handleLogin}>Login now</button>
            <button className="signup-btn" onClick={handleSignup}>Signup now</button>
          </div>

          <p>
            Our AI-driven system analyzes MRI scans to assist in early Alzheimer's detection,
            bridging the gap between technology and healthcare.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoverPage;
