// src/App.jsx
// --- DEFINITIVE ROUTING FIX ---

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import Layouts
import PublicLayout from './layouts/PublicLayout'; 
import DashboardLayout from './layouts/Layout'; 

// Import Page components
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import AuthChecker from './components/AuthChecker';

function App() {
  return (
    <Router>
      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      <Routes>
        {/* --- PUBLIC ROUTES (No Change Here) --- */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* --- PROTECTED ROUTES (This is the corrected structure) --- */}
        <Route 
          path="/dashboard" 
          element={<AuthChecker><DashboardLayout /></AuthChecker>}
        >
           {/* The "index" route is what renders at the parent path ("/dashboard") */}
           <Route index element={<DashboardPage />} />
           {/* The "settings" route now correctly renders at "/dashboard/settings" */}
           <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* --- CATCH-ALL 404 --- */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;