import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../utils/apiConfig';

const ProtectedRoute = ({ element: Component, allowedRoles = [] }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true; 

    const validateSession = async () => {
      try {
        const storedUserString = localStorage.getItem('user');
        const storedUser = storedUserString ? JSON.parse(storedUserString) : null;

        // Developer bypass (optional, ignores secure cookie for local dev)
        const devToken = localStorage.getItem('token');
        if (devToken === 'dev-bypass-token' && storedUser) {
          if (isMounted) {
            setUser(storedUser);
            setIsAuthenticated(true);
            setLoading(false);
          }
          return;
        }

        // Validate session entirely via httpOnly cookie.
        // We do NOT send an Authorization header; the browser attaches the cookie automatically.
        const response = await fetch(`${API_BASE_URL}/api/auth/validate-session`, {
          method: 'GET',
          credentials: 'include', 
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            setUser(data.user);
            setIsAuthenticated(true);
            localStorage.setItem('user', JSON.stringify(data.user)); 
          }
        } else {
          if (isMounted) {
            // Backend rejected cookie (expired or invalid), so clear UI data
            localStorage.removeItem('user');
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        if (isMounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    validateSession();
    
    return () => {
      isMounted = false; 
    };
  }, []); 

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#062859', color: 'white' }}>
        <h2>Verifying Secure Session...</h2>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'doctor':
        return <Navigate to="/doctor" replace />;
      case 'patient':
        return <Navigate to="/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return Component;
};

export default ProtectedRoute;