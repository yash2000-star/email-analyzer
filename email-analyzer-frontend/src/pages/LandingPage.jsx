// src/pages/LandingPage.jsx
import React from 'react';
import Navbar from '../components/landing/Navbar'; // Import Navbar
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import GetStartedBanner from '../components/landing/GetStartedBanner';
import Footer from '../components/landing/Footer';

// styles import removed or kept depending on if page needs specific styles

function LandingPage() {
  return (
    // Use a React fragment or a div if page-specific styling is needed
    <>
      <Navbar /> {/* Add Navbar at the top */}
      <HeroSection />
      <FeaturesSection />
      <GetStartedBanner />
      <Footer />
    </>
  );
}

export default LandingPage;