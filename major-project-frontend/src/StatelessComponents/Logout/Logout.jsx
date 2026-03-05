import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../utils/apiConfig";

const Logout = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const doLogout = async () => {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
      } catch {
        // Ignore; clear local state regardless
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    };
    doLogout();
    const timer = setTimeout(() => navigate("/"), 2000);
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
