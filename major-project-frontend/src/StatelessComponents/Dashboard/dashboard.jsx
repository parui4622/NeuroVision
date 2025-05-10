import axios from "axios";
import { FileUp, UploadCloud, UserCircle2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../StatefullComponents/DashboardButton/Button";
import DateCalendarValue from "../../StatefullComponents/DateCalender/dateCalender";
import "./dashboard.css";

const Dashboard = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateFile = (file) => {
    // List of accepted image extensions
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    
    if (!file) return false;
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    return validExtensions.includes(fileExtension);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setMessage("");
    setPrediction(null);
  };

  const handleSave = async () => {
    if (!selectedFile) {
      setMessage("Please select a file first");
      setMessageType("error");
      return;
    }

    if (!validateFile(selectedFile)) {
      setMessage("Please upload only image files (JPG, JPEG, PNG, GIF, BMP, WEBP)");
      setMessageType("error");
      return;
    }

    // Convert the file to base64
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        // Store in localStorage
        localStorage.setItem('mriImage', reader.result);
        localStorage.setItem('mriImageName', selectedFile.name);
        localStorage.setItem('mriUploadDate', new Date().toISOString());
        
        setMessage("Image saved successfully!");
        setMessageType("success");

        // Prepare the image data for the prediction API
        const imageData = reader.result.split(',')[1]; // Remove data:image/jpeg;base64, part

        // Send to prediction API
        setIsLoading(true);
        const response = await axios.post('http://localhost:5000/api/predict', {
          image: imageData,
          filename: selectedFile.name
        });

        setPrediction(response.data.prediction);
        setMessageType("success");
      } catch (error) {
        console.error('Prediction error:', error);
        setMessage(error.response?.data?.error || "Error processing image");
        setMessageType("error");
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setMessage("Failed to read the file");
      setMessageType("error");
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleGetStarted = () => {
    if (!selectedFile) {
      setMessage("Please upload an MRI scan first");
      setMessageType("error");
      return;
    }
    handleSave();
  };

  const handleLogout = () => {
    // Clear any auth tokens or user data if they exist
    localStorage.removeItem('mriImage');
    localStorage.removeItem('mriImageName');
    localStorage.removeItem('mriUploadDate');
    // Navigate to cover page
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h1 className="sidebar__title">NeuroVision</h1>
        <nav className="sidebar__nav">
          <button className="sidebar__button sidebar__button--active">
            <UserCircle2 size={20} /> Dashboard
          </button>
          <button className="sidebar__button">
            <FileUp size={20} /> Reports
          </button>
        </nav>
        <button className="sidebar__logout" onClick={handleLogout}>
          <UserCircle2 size={18} /> Log Out
        </button>
      </aside>

      <main className="main-content">
        <header className="main-content__header">
          <div>
            <h2>Hello <strong>Tassy Omah</strong>,</h2>
            <p>Have a nice day and don't forget to take care of your health!</p>
            <a href="#" className="main-content__link">Learn more →</a>
          </div>
          <img src="https://cdn-icons-png.flaticon.com/512/2920/2920081.png" alt="Yoga Icon" className="main-content__icon" />
        </header>

        <section className="upload-section">
          <p>Please upload your MRI scan Image</p>
          <p className="upload-instruction">Please upload only image files (JPG, JPEG, PNG, GIF, BMP, WEBP)</p>
          <input 
            type="file" 
            className="upload-section__input" 
            onChange={handleFileChange}
            accept="image/*"
          />
          {message && (
            <p className={`upload-message upload-message--${messageType}`}>
              {message}
            </p>
          )}
          {isLoading && (
            <p className="upload-message upload-message--info">
              Processing your image...
            </p>
          )}
          {prediction && (
            <p className="upload-message upload-message--success">
              Prediction: {prediction}
            </p>
          )}
          <div onClick={handleSave}>
            <Button className="upload-section__save">Save</Button>
          </div>
        </section>

        <div className="get-started">
          <button 
            className="get-started__button"
            onClick={handleGetStarted}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Get Started"} <UploadCloud size={18} />
          </button>
        </div>

        <section className="reports-section">
          <div className="report-card">
            <span className="report-card__dot report-card__dot--current"></span>
            <span>Current Report</span>
          </div>
          <div className="report-card">
            <span className="report-card__dot report-card__dot--previous"></span>
            <span>Previous Reports</span>
          </div>
        </section>
      </main>

      <aside className="right-panel">
        <div className="profile-card">
          <h3>Charles Robbie</h3>
          <p>25 years old | New York, USA</p>
        </div>        <div className="calendar-container">
          <DateCalendarValue />
        </div>
      </aside>
    </div>
  );
};

export default Dashboard;
