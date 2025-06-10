// src/components/dashboard/Sidebar.jsx
// --- UPDATED: SETTINGS LINK NOW FUNCTIONAL ---

import React from 'react';
// --- NEW: Import Link component ---
import { Link } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { FaInbox, FaRegStar, FaTasks, FaChevronLeft, FaChevronRight, FaCog, FaTag } from 'react-icons/fa';
import logo from '../../assets/logo.png';

function Sidebar({ isCollapsed, onToggle, activeView, onSelectView, categories }) {

  // We now determine the selected item based on the activeView state
  // A helper function makes the JSX cleaner
  const getNavItemClass = (viewName) => {
    return `${styles.navItem} ${activeView === viewName ? styles.selected : ''}`;
  }

  return (
    <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      
      <button onClick={onToggle} className={styles.toggleButton}>
        {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
      </button>

      <div className={styles.logoContainer}>
        <img src={logo} alt="InboxAI Compass Logo" className={styles.logo} />
        <h2 className={styles.logoText}>INBOXAI COMPASS</h2>
      </div>

      <nav className={styles.navigation}>
        {/* --- UPDATED to use Link and the helper function --- */}
        <Link 
          to="/dashboard"
          className={getNavItemClass('inbox')}
          onClick={() => onSelectView('inbox')}
        >
          <FaInbox className={styles.icon} />
          <span className={styles.navText}>Inbox</span>
        </Link>

        <a
          className={getNavItemClass('starred')}
          onClick={() => onSelectView('starred')}
        >
          <FaRegStar className={styles.icon} />
          <span className={styles.navText}>Starred</span>
        </a>

        <a
          className={getNavItemClass('action-items')}
          onClick={() => onSelectView('action-items')}
        >
          <FaTasks className={styles.icon} />
          <span className={styles.navText}>Action Items</span>
        </a>

        {categories && categories.length > 0 && (
          <div className={styles.categorySection}>
            <h4 className={styles.categoryHeader}>Categories</h4>
            {categories.map(category => (
              <a
                key={category}
                className={getNavItemClass(category)}
                onClick={() => onSelectView(category)}
              >
                <FaTag className={styles.icon} />
                <span className={styles.navText}>{category}</span>
              </a>
            ))}
          </div>
        )}
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.divider}></div>
        {/* --- UPDATED: This is now a Link that goes to the new page --- */}
        <Link
          to="/dashboard/settings"
          className={getNavItemClass('settings')}
          onClick={() => onSelectView('settings')}
        >
          <FaCog className={styles.icon} />
          <span className={styles.navText}>Settings</span>
        </Link>
      </div>
    </div>
  );
}

export default Sidebar;