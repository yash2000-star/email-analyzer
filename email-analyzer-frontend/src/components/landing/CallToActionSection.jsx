// src/components/landing/CallToActionSection.jsx
import React from 'react';
import styles from './CallToActionSection.module.css';

function CallToActionSection() {
   const handleLogin = () => {
    window.location.href = '/auth/google';
  };

  return (
    <section className={styles.cta}>
      <h2 className={styles.ctaTitle}>Ready to Tame Your Inbox?</h2>
      <p className={styles.ctaText}>Get started with InboXAI Compass today. It's free!</p>
       <button onClick={handleLogin} className={styles.ctaButton}>
          Login with Google
        </button>
    </section>
  );
}

export default CallToActionSection;