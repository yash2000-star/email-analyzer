import React from 'react';
import { Outlet } from 'react-router-dom';

// --- THESE ARE THE CORRECTED PATHS ---
// We added '../' to go up one folder from 'layouts' to 'src'
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

function PublicLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default PublicLayout;