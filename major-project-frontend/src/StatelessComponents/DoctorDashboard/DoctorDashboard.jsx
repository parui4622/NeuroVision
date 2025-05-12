import { FileUp, UserCircle2 } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DateCalendarValue from "../../StatefullComponents/DateCalender/dateCalender";
import "./DoctorDashboard.css";

const DoctorDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check for authentication
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user) {
      navigate('/login');
      return;
    }

    // Verify doctor role
    if (user.role !== 'doctor') {
      switch (user.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'patient':
          navigate('/dashboard');
          break;
        default:
          navigate('/login');
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h1 className="sidebar__title">Doctor Panel</h1>
        <nav className="sidebar__nav">
          <button className="sidebar__button sidebar__button--active">
            <UserCircle2 size={20} /> Dashboard
          </button>
          <button className="sidebar__button">
            <FileUp size={20} /> Patient Reports
          </button>
        </nav>
        <button className="sidebar__logout" onClick={handleLogout}>
          <UserCircle2 size={18} /> Log Out
        </button>
      </aside>

      <main className="main-content">
        <header className="main-content__header">
          <div>
            <h2>Welcome, <strong>Dr. Smith</strong></h2>
            <p>Manage your patients and their reports</p>
          </div>
        </header>

        <section className="doctor-section">
          <h3>Patient Overview</h3>
          <div className="doctor-cards">
            <div className="doctor-card">
              <h4>Total Patients</h4>
              <p>48</p>
            </div>
            <div className="doctor-card">
              <h4>Today's Appointments</h4>
              <p>8</p>
            </div>
            <div className="doctor-card">
              <h4>Pending Reports</h4>
              <p>12</p>
            </div>
          </div>
        </section>
      </main>

      <aside className="right-panel">
        <div className="profile-card">
          <h3>Dr. John Smith</h3>
          <p>Neurologist | New York Hospital</p>
        </div>
        <div className="calendar-container">
          <DateCalendarValue />
        </div>
      </aside>
    </div>
  );
};

export default DoctorDashboard;
