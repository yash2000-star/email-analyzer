// src/pages/LoginPage.jsx
import React from 'react';

function LoginPage() {

  // Redirects to backend Google OAuth endpoint
  const handleLogin = () => {
    // Use relative path due to Vite proxy
    window.location.href = '/auth/google';
  };

  return (
    <div>
      <h2>Login Required</h2>
      <p>Please log in with your Google Account to continue.</p>
      <button onClick={handleLogin}>Login with Google</button>
      {/* Note: After Google login, the backend redirects.
          If successful, it might redirect back to a frontend route
          (e.g., /dashboard). We configured /auth/google/success in the backend
          to show a message for now, but ideally, it redirects to the frontend dashboard.
          Let's adjust the backend redirect later. */}
    </div>
  );
}

export default LoginPage;