import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- CORRECTED IMPORT PATHS ---
// We are now importing from the 'layouts' folder we created.
import PublicLayout from './layouts/PublicLayout'; 
import DashboardLayout from './layouts/Layout'; 

// Import Page components (These paths should be correct)
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
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
        {/* --- PUBLIC ROUTES (using PublicLayout) --- */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* --- PROTECTED ROUTES (using DashboardLayout) --- */}
        <Route element={<AuthChecker><DashboardLayout /></AuthChecker>}>
           <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        {/* --- CATCH-ALL 404 --- */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;