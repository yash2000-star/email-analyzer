import axios from 'axios';

// Create an instance of axios with default configuration
const api = axios.create({
  // Your backend's base URL. The proxy in vite.config.js will handle this.
  baseURL: '/api',
  withCredentials: true, // This is crucial for sending cookies (for authentication)
});

// Add a response interceptor to handle authentication errors globally
api.interceptors.response.use(
  (response) => response, // If the response is successful, just return it
  (error) => {
    // If the error is a 401 Unauthorized, it means the session has expired
    if (error.response && error.response.status === 401) {
      // Reload the page. The backend will redirect to the login page.
      // This is a simple but effective way to handle session expiry.
      window.location.href = '/login';
    }
    // For all other errors, just pass them along
    return Promise.reject(error);
  }
);

export default api;