// src/pages/LandingPage.jsx
import React from 'react';
// REMOVE THESE TWO IMPORTS:
// import Navbar from '../components/landing/Navbar';
// import Footer from '../components/landing/Footer';

// Import Section components
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import CallToActionSection from '../components/landing/CallToActionSection';
import styles from './LandingPage.module.css';

function LandingPage() {
  // THE RETURN BLOCK SHOULD NOW BE CLEANER:
  return (
    <div className={styles.landingPage}>
      {/* Navbar is now handled by PublicLayout */}
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <CallToActionSection />
      {/* Footer is now handled by PublicLayout */}
    </div>
  );
}

export default LandingPage;