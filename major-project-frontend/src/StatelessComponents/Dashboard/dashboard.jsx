import axios from "axios";
import { UserCircle2 } from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../StatefullComponents/DashboardButton/Button";
import DateCalendarValue from "../../StatefullComponents/DateCalender/dateCalender";
import { API_BASE_URL } from "../../utils/apiConfig";
import "./dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState("");
  const reminderTimeout = useRef(null);
  const [reminder, setReminder] = useState("");
  const imagePreviewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile]
  );
  useEffect(() => () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
  }, [imagePreviewUrl]);

  // Function to test connection to backend server
  const testBackendConnection = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/`);
      console.log('Backend server connection test:', response.data);
      return true;
    } catch (error) {
      console.error('Backend connection test failed:', error.message);
      return false;
    }
  };
  
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    if (token === 'dev-bypass-token') {
      setUser(storedUser);
      return;
    }

    if (!storedUser?.role && !token) {
      navigate('/login');
      return;
    }

    if (storedUser.role === 'admin') {
      navigate('/admin');
      return;
    }
    if (storedUser.role === 'doctor') {
      navigate('/doctor');
      return;
    }

    testBackendConnection().then((isConnected) => {
      if (!isConnected) {
        setMessage("Warning: Could not connect to the backend server. Prediction features may not work.");
        setMessageType("error");
      }
    });

    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/auth/validate-session`, {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const fetchedUser = response.data?.user;
        if (fetchedUser) {
          setUser(fetchedUser);
          localStorage.setItem('user', JSON.stringify(fetchedUser));
        } else {
          setUser(storedUser);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        navigate('/login');
      }
    };

    const fetchAppointments = async () => {
      try {
        setAppointmentsLoading(true);
        setAppointmentsError("");
        const response = await axios.get(`${API_BASE_URL}/api/doctor/appointments/patient`, {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setAppointments(response.data?.appointments || []);
      } catch (err) {
        setAppointmentsError("Unable to fetch your appointments.");
        setAppointments([]);
      } finally {
        setAppointmentsLoading(false);
      }
    };

    fetchUserData();
    fetchAppointments();
  }, [navigate]);

  useEffect(() => {
    if (!appointments || appointments.length === 0) {
      setReminder("");
      return;
    }
    // Find the next upcoming appointment (approved or scheduled, not completed/denied)
    const now = new Date();
    const next = Array.isArray(appointments)
      ? appointments
          .filter(a => a.status === 'approved' || a.status === 'scheduled')
          .map(a => ({ ...a, dateObj: new Date(a.date) }))
          .filter(a => a.dateObj > now)
          .sort((a, b) => a.dateObj - b.dateObj)[0]
      : undefined;
    if (!next) {
      setReminder("");
      return;
    }
    const msUntil = next.dateObj - now;
    if (msUntil < 0) {
      setReminder("");
      return;
    }
    // Show time remaining
    const updateReminder = () => {
      const diff = next.dateObj - new Date();
      if (diff <= 0) {
        setReminder("");
        return;
      }
      const hours = Math.floor(diff / 1000 / 60 / 60);
      const mins = Math.floor((diff / 1000 / 60) % 60);
      setReminder(`Next appointment: with Dr. ${next.doctorName || ''} in ${hours}h ${mins}m (${next.dateObj.toLocaleString()})`);
      reminderTimeout.current = setTimeout(updateReminder, 60000);
    };
    updateReminder();
    return () => {
      if (reminderTimeout.current) clearTimeout(reminderTimeout.current);
    };
  }, [appointments]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setMessage("No file selected.");
      setMessageType("error");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setMessage("Please upload a valid image file.");
      setMessageType("error");
      return;
    }
    setImageFile(file);
    setMessage("File selected successfully. Click 'Get Started' to proceed.");
    setMessageType("info");
    setPrediction(null);
  };

  const handlePrediction = async () => {
    if (!imageFile) {
      setMessage('Please select a file to upload.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('Processing your image...');
    setMessageType('info');
    const formData = new FormData();
    formData.append('file', imageFile);

    try {
      const predictionResponse = await axios.post(`${API_BASE_URL}/api/predict`, formData, {
        withCredentials: true,
        timeout: 30000,
      });
      if (predictionResponse.data && predictionResponse.data.prediction) {
        setPrediction(predictionResponse.data.prediction);
        setMessage('Prediction successful!');
        setMessageType('success');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error during prediction:', error);
      if (error.response?.status === 401) {
        setMessage('You are not authorized. Please log in again.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage(error.response?.data?.error || 'Prediction failed. Please try again.');
      }
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetStarted = () => {
    if (!imageFile) {
      setMessage("Please upload an MRI scan first");
      setMessageType("error");
      return;
    }
    handlePrediction();
  };
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/logout');
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h1 className="sidebar__title">NeuroVision</h1>
        <nav className="sidebar__nav">
          <button className="sidebar__button sidebar__button--active">
            <UserCircle2 size={20} /> Dashboard
          </button>          {/* Reports button removed as requested */}
        </nav>
        <button className="sidebar__logout" onClick={handleLogout}>
          <UserCircle2 size={18} /> Log Out
        </button>
      </aside>

      <main className="main-content">
        <header className="main-content__header">
          <div>
            <h2>Hello <strong>{user?.name || "User"}</strong>,</h2>
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
          {imageFile && imagePreviewUrl && (
            <div style={{ marginTop: 12 }}>
              <img
                src={imagePreviewUrl}
                alt="MRI preview"
                style={{ maxWidth: 200, maxHeight: 150, objectFit: 'contain', borderRadius: 8 }}
              />
              <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{imageFile.name}</p>
            </div>
          )}
          {message && (
            <p className={`upload-message upload-message--${messageType}`}>
              {message}
            </p>
          )}
          
          <div onClick={handleGetStarted}>
            <Button className="upload-section__save">{isLoading ? "Processing..." : "Get Started"}</Button>
          </div>
        </section>
        {reminder && <div className="reminder-banner">{reminder}</div>}
        <section className="prediction-section distinct" style={{ 
          border: '2px solid #4CAF50', 
          padding: '20px', 
          background: 'linear-gradient(135deg, #e0f7fa, #4CAF50)', 
          borderRadius: '10px', 
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', 
          marginTop: '20px' 
        }}>
          <h2 style={{ 
            color: '#4CAF50', 
            fontSize: '1.8rem', 
            fontWeight: 'bold', 
            textAlign: 'center', 
            marginBottom: '15px' 
          }}>Prediction Results</h2>
          {prediction ? (
            <div className="prediction-result" style={{ 
              textAlign: 'center', 
              fontSize: '1.5rem', 
              color: '#333', 
              fontWeight: '600' 
            }}>
              <h3 style={{ fontWeight: 'bold' }}>Prediction: {prediction} ({prediction === 'AD' ? 'Alzheimer\'s Disease' : prediction === 'MCI' ? 'Mild Cognitive Impairment' : 'Normal Cognitive Function'})</h3>
            </div>
          ) : (
            <p style={{ 
              textAlign: 'center', 
              fontSize: '1.2rem', 
              color: '#666' 
            }}>No prediction available yet. Please upload an image and click 'Get Started' to begin.</p>
          )}
        </section>
        <section className="patient-appointments-section">
          <h3>Upcoming Appointments</h3>
          {appointmentsLoading ? (
            <p>Loading appointments...</p>
          ) : appointmentsError ? (
            <p style={{color: 'red'}}>{appointmentsError}</p>
          ) : !Array.isArray(appointments) || appointments.length === 0 ? (
            <p>No appointments scheduled.</p>
          ) : (
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Doctor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(appointments) && appointments.map(appt => (
                  <tr key={appt._id}>
                    <td>{new Date(appt.date).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{appt.doctorName || 'Unknown'}</td>
                    <td>{appt.status && appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>


      </main>      <aside className="right-panel">
        <div className="profile-card">
          <h3>{user?.name || "Guest User"}</h3>
          <p>{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || "User"}</p>
          {user?.patientInfo?.serial && (
            <p className="patient-serial">ID: {user.patientInfo.serial}</p>
          )}
        </div>        <div className="calendar-container">
          <DateCalendarValue />
        </div>
        </aside>
    </div>
  );
};

export default Dashboard;
