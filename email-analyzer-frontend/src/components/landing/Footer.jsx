// src/components/landing/Footer.jsx
import React from 'react';
import styles from './Footer.module.css';
import Logo from '../../assets/logo.png'; // Import your logo
import { FaLinkedin, FaGithub, FaTwitter } from 'react-icons/fa';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.topSection}>
          {/* Left Side: Logo and Tagline */}
          <div className={styles.brandColumn}>
            <div className={styles.brandLogo}>
                <img src={Logo} alt="InboXAI Compass Logo" className={styles.logoImage} />
                <span>InboXAI Compass</span>
            </div>
            <p className={styles.tagline}>Find clarity in the inbox chaos.</p>
          </div>
          
          {/* Right Side: Link Grid */}
          <div className={styles.linksGrid}>
            <div className={styles.linkColumn}>
              <h4>Product</h4>
              <a href="/#features">Features</a>
              <a href="/#security">Security</a>
              <a href="https://github.com/your-repo/email-analyzer-frontend" target="_blank" rel="noopener noreferrer">Integrations</a>
            </div>
            <div className={styles.linkColumn}>
              <h4>Company</h4>
              <a href="/#about">About</a>
              <a href="mailto:contact.yash.nirwan@gmail.com">Contact Us</a>
            </div>
            <div className={styles.linkColumn}>
              <h4>Legal</h4>
              {/* These would link to actual pages in a real app */}
              <a href="#/privacy">Privacy Policy</a>
              <a href="#/terms">Terms of Service</a>
            </div>
          </div>
        </div>

        {/* Bottom Bar Section */}
        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            © {currentYear} InboXAI Compass. All Rights Reserved.
          </p>
          <div className={styles.socialLinks}>
            <a href="https://github.com/yash-nirwan" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <FaGithub />
            </a>
            <a href="https://linkedin.com/in/yash-nirwan-b07212265" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <FaLinkedin />
            </a>
            <a href="https://twitter.com/your-profile" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <FaTwitter />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;