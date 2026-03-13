import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../utils/apiConfig';

const ProtectedRoute = ({ element: Component, allowedRoles = [] }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true; // Prevents memory leaks

    const validateSession = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUserString = localStorage.getItem('user');
        const storedUser = storedUserString ? JSON.parse(storedUserString) : null;

        // 1. Handle developer bypass token
        if (token === 'dev-bypass-token' && storedUser) {
          if (isMounted) {
            setUser(storedUser);
            setIsAuthenticated(true);
            setLoading(false);
          }
          return;
        }

        // 2. We MUST have a token or we fail immediately
        if (!token) {
          if (isMounted) {
            setIsAuthenticated(false);
            setLoading(false);
          }
          return;
        }

        // 3. Validate session with backend
        const response = await fetch(`${API_BASE_URL}/api/auth/validate-session`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            setUser(data.user);
            setIsAuthenticated(true);
            // Save fresh user data just in case
            localStorage.setItem('user', JSON.stringify(data.user)); 
          }
        } else {
          if (isMounted) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Session validation error:', error);
        if (isMounted) {
          setIsAuthenticated(false);
        }
      } finally {
        // 4. Finally block ensures loading is ALWAYS set to false, 
        // but only after all state updates above are queued.
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    validateSession();
    
    return () => {
      isMounted = false; // Cleanup function
    };
  }, []); // Run once on mount

  // === RENDERING LOGIC ===

  if (loading) {
    // Return a better looking loader so the screen doesn't just flash white
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#062859', color: 'white' }}>
        <h2>Verifying Secure Session...</h2>
      </div>
    );
  }

  // If not authenticated, kick to login
  if (!isAuthenticated || !user) {
    // Pass the attempted URL so we could potentially redirect them back later
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required, check user's role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // If they are logged in but tried to go to the wrong dashboard, send them to their correct one
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

  // If they passed all checks, render the protected component!
  return Component;
};

export default ProtectedRoute;