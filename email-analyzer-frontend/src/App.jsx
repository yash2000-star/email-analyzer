// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify'; // Import only ToastContainer here
import 'react-toastify/dist/ReactToastify.css'; // Import default CSS

// Import Page components etc.
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AuthChecker from './components/AuthChecker';
import Layout from './components/Layout';

function App() {
  return (
    <Router>
       {/* ToastContainer Setup */}
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
            theme="dark" // Matches our app theme
        />
        {/* End ToastContainer */}

      {/* Route Definitions */}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes with Layout */}
        <Route element={<AuthChecker><Layout /></AuthChecker>}>
           <Route path="/dashboard" element={<DashboardPage />} />
           {/* Example: <Route path="/settings" element={<SettingsPage />} /> */}
        </Route>

        {/* Catch-all 404 Route */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;