// src/components/landing/CallToActionSection.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import styles from './CallToActionSection.module.css';

function CallToActionSection() {
  const handleLogin = () => {
    window.location.href = '/auth/google';
  };

  return (
    <section className={styles.cta}>
      <motion.div 
        className={styles.container}
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className={styles.ctaTitle}>Ready to Reclaim Your Inbox?</h2>
        <p className={styles.ctaText}>
          Stop letting email dictate your day. Start with InboXAI for free.
        </p>
        <button onClick={handleLogin} className={styles.ctaButton}>
          <span>Get Started with Google</span>
          <FiArrowRight size={22} />
        </button>
      </motion.div>
    </section>
  );
}

export default CallToActionSection;