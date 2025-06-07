// src/components/landing/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import styles from './Navbar.module.css';
import Logo from '../../assets/logo.png'; // <-- Import your new SVG logo

function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    // This effect prevents the body from scrolling when the mobile menu is open
    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        // Cleanup function to reset the style when the component unmounts
        return () => document.body.style.overflow = 'unset';
    }, [menuOpen]);

    const handleLogin = () => {
        window.location.href = '/auth/google';
    };

    const handleLinkClick = () => {
        setMenuOpen(false); // Close menu when a link is clicked
    };

    return (
        <header className={styles.navbar}>
            <div className={styles.navContent}>
                {/* Left Side: Logo */}
                <Link to="/" className={styles.brandLogo} onClick={() => setMenuOpen(false)}>
                    <img src={Logo} alt="InboXAI Compass Logo" className={styles.logoImage} />
                     <span className={styles.brandNameText}>InboXAI Compass</span>
                </Link>

                {/* Center: Navigation Links for Desktop */}
                <nav className={`${styles.navLinks} ${menuOpen ? styles.navLinksOpen : ''}`}>
                    {/* For a single landing page, regular <a> tags are better for anchor links */}
                    <a href="#features" className={styles.navLink} onClick={handleLinkClick}>Features</a>
                    <a href="#security" className={styles.navLink} onClick={handleLinkClick}>Security</a>
                    <a href="#about" className={styles.navLink} onClick={handleLinkClick}>About</a>
                </nav>

                {/* Right Side: Login Button & Mobile Menu Toggle */}
                <div className={styles.navActions}>
                    <button onClick={handleLogin} className={styles.loginButton}>
                        Login
                    </button>
                    <button 
                        className={styles.menuToggle} 
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Navbar;