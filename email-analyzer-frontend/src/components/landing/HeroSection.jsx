// src/components/landing/HeroSection.jsx
import React from 'react';
import { motion } from 'framer-motion';
import styles from './HeroSection.module.css';

// This is a new sub-component for the animated visual.
// We keep it in the same file for simplicity.
const AnimatedInboxVisual = () => {
  const cardVariants = {
    initial: (i) => ({
      y: i * -8,
      x: i % 2 === 0 ? -i * 2 : i * 2,
      rotate: i % 2 === 0 ? -i * 1.5 : i * 1.5,
      opacity: 0,
    }),
    animate: (i) => ({
      y: i * 15,
      x: 0,
      rotate: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
        delay: 1.5 + i * 0.1,
      },
    }),
  };

  const lineVariants = {
    hidden: { pathLength: 0 },
    visible: { pathLength: 1, transition: { duration: 0.5, delay: 2.2 } },
  };
  
  const dotVariants = {
    hidden: { scale: 0 },
    visible: { scale: 1, transition: { duration: 0.2, delay: 2.7 } },
  };

  return (
    <div className={styles.visualContainer}>
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className={`${styles.visualCard} ${i === 2 ? styles.highlightedCard : ''}`}
          custom={i}
          initial="initial"
          animate="animate"
          variants={cardVariants}
        >
          <div className={styles.cardHeader}>
            <div className={styles.cardAvatar}></div>
            <div className={styles.cardAuthor}></div>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.cardLine}></div>
            <div className={styles.cardLineShort}></div>
          </div>
          {i === 2 && (
             <div className={styles.summaryOverlay}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <motion.path variants={lineVariants} initial="hidden" animate="visible" d="M20 6L9 17L4 12" stroke="var(--accent-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className={styles.summaryText}>Summary...</span>
                <motion.div variants={dotVariants} initial="hidden" animate="visible" className={styles.actionPoint}>Action Point 1</motion.div>
             </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};


function HeroSection() {
  const handleLogin = () => {
    window.location.href = '/auth/google';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <div className={styles.heroContainer}>
      <motion.section 
        className={styles.hero}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className={styles.textContainer}>
          <motion.h1 className={styles.title} variants={itemVariants}>
            Find Clarity <br /> in the <span className={styles.highlight}>Inbox Chaos</span>
          </motion.h1>
          <motion.p className={styles.subtitle} variants={itemVariants}>
            InboXAI Compass automatically summarizes, finds action items, and clears the clutter, so you can focus on what's important.
          </motion.p>
          <motion.div variants={itemVariants}>
            <button onClick={handleLogin} className={styles.ctaButton}>
              Get Started with Google
            </button>
          </motion.div>
        </div>
        <AnimatedInboxVisual />
      </motion.section>
    </div>
  );
}

export default HeroSection;