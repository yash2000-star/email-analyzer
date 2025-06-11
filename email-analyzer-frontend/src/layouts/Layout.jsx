// src/layouts/Layout.jsx
// --- DEFINITIVE FIX: PASSING DOWN THE USER'S EMAIL ---

import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import styles from './Layout.module.css';
import { FaSignOutAlt } from 'react-icons/fa';

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  // This state is the single source of truth for the user's info
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState(''); // --- NEW STATE FOR EMAIL ---
  const [isUserLoading, setIsLoadingUser] = useState(true);
  
  const isDashboard = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    const fetchUserInfo = async () => {
      setIsLoadingUser(true);
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.get(`${API_BASE}/auth/status`);
        if (response.data.isAuthenticated && response.data.user && response.data.user.name) {
          setUserName(response.data.user.name.split(' ')[0] || 'User');
          setUserEmail(response.data.user.email || 'No email found'); // --- SET THE EMAIL HERE ---
        } else {
          setUserName('User');
          setUserEmail('N/A');
        }
      } catch (error) {
        console.error("Failed to fetch user info for layout:", error);
        setUserName('User');
        setUserEmail('Could not load');
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUserInfo();
  }, []);

  const handleLogout = async () => {
     try {
            const API_BASE = import.meta.env.VITE_API_BASE_URL;
            await axios.get(`${API_BASE}/auth/logout`);
            navigate('/login');
        } catch (err) {
            console.error("Logout failed:", err);
        }
  };

  return (
    <div className={`${styles.layout} ${isDashboard ? styles.dashboardActive : ''}`}>
      {!isDashboard && (
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <Link to="/dashboard" className={styles.logo}>
              InboXAI Compass 
            </Link>
          </div>
          <div className={styles.headerCenter}>
            <input type="search" placeholder="Search..." className={styles.searchBar} disabled />
          </div>
          <div className={styles.headerRight}>
            <span className={styles.userName}>
              {isUserLoading ? '...' : userName}
            </span>
            <button onClick={handleLogout} className={styles.logoutButton} title="Logout">
              <FaSignOutAlt />
            </button>
          </div>
        </header>
      )}

      <main className={styles.mainContent}>
        {/* --- UPDATED: Pass the userEmail down through the context --- */}
        <Outlet context={{ userName, isUserLoading, userEmail }} />
      </main>
    </div>
  );
}

export default Layout;