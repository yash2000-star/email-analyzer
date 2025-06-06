// src/components/landing/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Use Link for navigation
import styles from './Navbar.module.css';

function Navbar() {
    const navigate = useNavigate();

    const handleLogin = () => {
        // Option 1: Direct to Google OAuth
        window.location.href = '/auth/google';
        // Option 2: Go to our separate Login Page component first (if you create one)
        // navigate('/login');
    };

    return (
        <header className={styles.navbar}>
            <div className={styles.navContent}>
                {/* Left Side: Logo/Brand */}
                <Link to="/" className={styles.brandLogo}>
                    InboXAI Compass 🧭
                </Link>

                {/* Center: Navigation Links (Placeholders) */}
                <nav className={styles.navLinks}>
                    <Link to="/#features" className={styles.navLink}>Features</Link>
                    <Link to="/#security" className={styles.navLink}>Security</Link>
                    {/* <Link to="/#pricing" className={styles.navLink}>Pricing</Link> */}
                    <Link to="/#about" className={styles.navLink}>About</Link>
                </nav>

                {/* Right Side: Login Button */}
                <div className={styles.navActions}>
                    <button onClick={handleLogin} className={styles.loginButton}>
                        Login
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Navbar;