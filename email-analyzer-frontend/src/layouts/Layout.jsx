// src/components/Layout.jsx
import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Layout.module.css';
import { FaSignOutAlt } from 'react-icons/fa';

function Layout() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('User');
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      setIsLoadingUser(true);
      try {
        const response = await axios.get('/auth/status');
        if (response.data.isAuthenticated && response.data.user) {
          setUserName(response.data.user.name.split(' ')[0] || 'User');
        } else {
          console.warn("User not authenticated in Layout fetch.");
          setUserName('User');
        }
      } catch (error) {
        console.error("Failed to fetch user info for layout:", error);
        setUserName('User');
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUserInfo();
  }, []);

  const handleLogout = async () => {
     try {
            await axios.get('/auth/logout');
            navigate('/login');
        } catch (err) {
            console.error("Logout failed:", err);
        }
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/dashboard" className={styles.logo}>
            InboXAI Compass 🧭
          </Link>
        </div>
        <div className={styles.headerCenter}>
          <input type="search" placeholder="Search emails..." className={styles.searchBar} disabled />
        </div>
        <div className={styles.headerRight}>
          <span className={styles.userName}>
            {isLoadingUser ? '...' : userName}
          </span>
          <button onClick={handleLogout} className={styles.logoutButton} title="Logout">
            <FaSignOutAlt />
          </button>
        </div>
      </header>
      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;