// src/components/landing/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // Use Link for internal nav if needed
import styles from './Footer.module.css';
// Import icons for social links
import { FaLinkedin, FaGithub, FaTwitter } from 'react-icons/fa'; // Example icons

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>

        {/* Link Grid Section */}
        <div className={styles.linksGrid}>
          {/* Column 1: Product (Example) */}
          <div className={styles.linkColumn}>
            <h4>Product</h4>
            {/* Use '#' for placeholders if pages don't exist yet */}
            <Link to="/#features">Features</Link>
            <Link to="/#security">Security</Link>
            <Link to="/#integrations">Integrations</Link>
          </div>

          {/* Column 2: Company (Example) */}
          <div className={styles.linkColumn}>
            <h4>Company</h4>
            <Link to="/#about">About</Link>
            <a href="mailto:your.email@example.com">Contact Us</a> {/* Mailto link */}
            {/* <Link to="/careers">Careers</Link> */}
          </div>

          {/* Column 3: Resources (Example) */}
          <div className={styles.linkColumn}>
            <h4>Resources</h4>
            <Link to="/#blog">Blog</Link>
            <Link to="/#help">Help Center</Link>
            {/* <Link to="/tutorials">Tutorials</Link> */}
          </div>

          {/* Column 4: Legal */}
          <div className={styles.linkColumn}>
            <h4>Legal</h4>
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy</a>
            <a href="/terms-of-service" target="_blank" rel="noopener noreferrer">Terms</a>
            {/* <a href="/aup" target="_blank" rel="noopener noreferrer">AUP</a> */}
          </div>
        </div>

        {/* Bottom Bar Section */}
        <div className={styles.bottomBar}>
          <div className={styles.brandInfo}>
            <span className={styles.logoText}>InboXAI Compass 🧭</span>
            {/* Removed copyright from here, implied */}
          </div>
          <div className={styles.socialLinks}>
            {/* Add your actual social links */}
            <a href="https://github.com/your-profile" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <FaGithub />
            </a>
            <a href="https://linkedin.com/in/your-profile" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
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