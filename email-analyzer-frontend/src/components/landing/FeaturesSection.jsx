// src/components/landing/FeaturesSection.jsx
import React from 'react';
import styles from './FeaturesSection.module.css';
// Import icons if desired
import { FaMagic, FaLock, FaTasks } from 'react-icons/fa';

function FeaturesSection() {
  // Define 3 key features
  const features = [
    {
      icon: <FaMagic size={24} />, // Example Icon
      title: "AI Summaries & Actions",
      description: "Instantly understand long emails and identify key tasks with AI-powered insights.",
    },
    {
      icon: <FaLock size={24} />,
      title: "Privacy First",
      description: "Your email content is processed securely and never stored. We prioritize your data privacy.",
    },
    {
      icon: <FaTasks size={24} />,
      title: "Focus on What Matters",
      description: "Cut through the clutter. Our tool helps you manage information overload effectively.",
    },
  ];

  return (
    <section className={styles.features}>
      {/* Optional Title */}
      {/* <h2 className={styles.sectionTitle}>Unlock Email Productivity</h2> */}
      <div className={styles.grid}>
        {features.map((feature, index) => (
          <div key={index} className={styles.featureCard}>
            <div className={styles.iconWrapper}>{feature.icon}</div>
            <h3 className={styles.featureTitle}>{feature.title}</h3>
            <p className={styles.featureDescription}>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FeaturesSection;