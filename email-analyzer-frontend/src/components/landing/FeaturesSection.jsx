// src/components/landing/FeaturesSection.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZap, FiLock, FiFilter } from 'react-icons/fi'; // Using more modern icons
import styles from './FeaturesSection.module.css';

// Feature data, including a new 'visual' component for each
const features = [
  {
    icon: <FiZap size={22} />,
    title: "AI Summaries & Actions",
    description: "Instantly understand long emails and identify key tasks with AI-powered insights.",
    visual: () => (
      <div className={styles.visualContent}>
        <div className={styles.emailMockup}>
          <div className={styles.emailHeader}>Long Project Update Email</div>
          <div className={styles.emailBody}>
            <div className={styles.line}></div><div className={styles.line}></div><div className={styles.lineMed}></div><br/>
            <div className={styles.line}></div><div className={styles.lineLong}></div><div className={styles.lineShort}></div>
          </div>
        </div>
        <div className={styles.arrow}>→</div>
        <div className={styles.summaryMockup}>
          <div className={styles.summaryTitle}>AI Summary</div>
          <div className={styles.summaryPoint}>• Key decision needed on budget.</div>
          <div className={styles.summaryPointAction}>• Action: Send feedback by EOD.</div>
        </div>
      </div>
    ),
  },
  {
    icon: <FiLock size={22} />,
    title: "Privacy First",
    description: "Your email content is processed securely on-device and never stored on our servers.",
    visual: () => (
      <div className={`${styles.visualContent} ${styles.privacyVisual}`}>
        <div className={styles.privacyItem}>
          <FiLock size={28} className={styles.privacyIcon} />
          <span>Your Gmail Data</span>
        </div>
        <div className={styles.arrow}>↔</div>
        <div className={styles.privacyItem}>
            <div className={styles.serverBox}>
                <span className={styles.serverText}>Secure Analysis (Never Stored)</span>
            </div>
        </div>
      </div>
    ),
  },
  {
    icon: <FiFilter size={22} />,
    title: "Focus on What Matters",
    description: "Cut through the clutter. Our tool intelligently surfaces what's important, hiding the noise.",
    visual: () => (
       <div className={`${styles.visualContent} ${styles.focusVisual}`}>
        <div className={styles.emailCard}>Newsletter</div>
        <div className={styles.emailCardImportant}>Urgent: Client Feedback</div>
        <div className={styles.emailCard}>Team Lunch</div>
        <div className={styles.emailCard}>Promotional Offer</div>
      </div>
    ),
  },
];

function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState(0);

  const visualVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeInOut' } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: 'easeInOut' } },
  };

  return (
    <section className={styles.features}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>How It Works</h2>
        <p className={styles.sectionSubtitle}>
          Select a feature to see how InboXAI transforms your inbox experience.
        </p>
      </div>

      <div className={styles.container}>
        <div className={styles.tabs}>
          {features.map((feature, index) => (
            <button
              key={index}
              className={`${styles.tab} ${activeFeature === index ? styles.activeTab : ''}`}
              onClick={() => setActiveFeature(index)}
            >
              <div className={styles.tabIcon}>{feature.icon}</div>
              <div className={styles.tabText}>
                <h3 className={styles.tabTitle}>{feature.title}</h3>
                <p className={styles.tabDescription}>{feature.description}</p>
              </div>
              {activeFeature === index && (
                <motion.div className={styles.activeTabIndicator} layoutId="activeTabIndicator" />
              )}
            </button>
          ))}
        </div>

        <div className={styles.visualPanel}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature}
              variants={visualVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {features[activeFeature].visual()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;