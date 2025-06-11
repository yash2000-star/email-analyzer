// src/components/AuthChecker.jsx
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

function AuthChecker({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = checking, true = yes, false = no
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoading(true);
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL;
const response = await axios.get(`${API_BASE}/auth/status`);
        setIsAuthenticated(response.data.isAuthenticated);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false); // Assume not authenticated on error
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []); // Check only once on mount

  if (loading) {
    return <div>Loading authentication status...</div>; // Or a spinner component
  }

  if (isAuthenticated === false) {
    // Redirect to login page if not authenticated
    // Pass the current location so login can redirect back after success (optional)
    return <Navigate to="/login" replace />;
  }

  if (isAuthenticated === true) {
    // Render the protected component if authenticated
    return children;
  }

  // Should ideally not reach here if logic is correct, but return null or fallback
  return null;
}

export default AuthChecker;