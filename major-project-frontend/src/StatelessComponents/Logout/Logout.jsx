import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();
  useEffect(() => {
    // Clear all auth and app state
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('mriImage');
    localStorage.removeItem('mriImageName');
    localStorage.removeItem('mriUploadDate');
    // Optionally clear more if needed
    const timer = setTimeout(() => {
      navigate("/");
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="logout-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <h2>You have been logged out.</h2>
      <p>Redirecting to login page...</p>
    </div>
  );
};

export default Logout;
