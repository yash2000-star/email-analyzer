// src/pages/SettingsPage.jsx
// --- DEFINITIVE FIX: REMOVED REDUNDANT API CALL ---

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import styles from './SettingsPage.module.css';
import api from '../utils/api';
import { FaUser, FaGoogle, FaSignOutAlt, FaBrain } from 'react-icons/fa';

function SettingsPage() {
    const navigate = useNavigate();
    // --- UPDATED: We now get the userEmail directly from the layout context ---
    const { userName, isUserLoading, userEmail } = useOutletContext();
    
    // The broken useEffect and useState for userEmail have been completely REMOVED.

    const handleLogout = async () => {
        try {
            await api.get('/auth/logout');
            navigate('/login');
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    return (
        <div className={styles.settingsPage}>
            <h1 className={styles.header}>Settings</h1>

            <div className={styles.settingsGrid}>
                {/* Profile Card */}
                <div className={styles.settingsCard}>
                    <h2 className={styles.cardHeader}>Profile</h2>
                    <div className={styles.profileContent}>
                        <div className={styles.profileAvatar}>
                            {isUserLoading ? '' : (userName ? userName.charAt(0).toUpperCase() : '?')}
                        </div>
                        <div className={styles.profileDetails}>
                            <span className={styles.profileName}>{isUserLoading ? 'Loading...' : userName}</span>
                            {/* This will now display the email correctly */}
                            <span className={styles.profileEmail}>{isUserLoading ? 'Loading email...' : userEmail}</span>
                        </div>
                    </div>
                </div>

                {/* Account Connection Card */}
                <div className={styles.settingsCard}>
                    <h2 className={styles.cardHeader}>Account Connection</h2>
                    <div className={styles.connectionContent}>
                        <FaGoogle size={24} color="#4285F4" />
                        {/* This will also display the email correctly */}
                        <span className={styles.connectionText}>Connected as {isUserLoading ? '...' : userEmail}</span>
                    </div>
                    <button onClick={handleLogout} className={styles.logoutButton}>
                        <FaSignOutAlt />
                        Logout
                    </button>
                </div>

                {/* AI Preferences Card (Placeholder) */}
                <div className={`${styles.settingsCard} ${styles.placeholderCard}`}>
                    <h2 className={styles.cardHeader}>AI Preferences</h2>
                    <div className={styles.placeholderContent}>
                        <FaBrain size={32} />
                        <p>Customize AI summaries, categories, and more.</p>
                        <span>(Coming Soon)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SettingsPage;