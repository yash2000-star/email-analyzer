// src/components/landing/HeroSection.jsx
import React from 'react';
import styles from './HeroSection.module.css'; // Use the CSS module

function HeroSection() {
  const handleLogin = () => {
    window.location.href = '/auth/google';
  };

  return (
    // Adding a container for potential background effects
    <div className={styles.heroContainer}>
      <section className={styles.hero}>
        {/* Optional: Background shapes/glows (can use pseudo-elements or separate divs) */}
        {/* <div className={styles.glowTopLeft}></div> */}

        <h1 className={styles.title}>
          The Perfect <span className={styles.highlight}>AI Assistant</span> For Your Inbox
          {/* Alternative Title: Smarter Email Management Starts Here */}
        </h1>
        <p className={styles.subtitle}>
          Our AI automatically summarizes, finds action points, and helps you focus
          on what matters within your Gmail inbox. Securely and privately.
        </p>
        <button onClick={handleLogin} className={styles.ctaButton}>
          Connect Your Google Account
        </button>
      </section>
    </div>
  );
}

export default HeroSection;