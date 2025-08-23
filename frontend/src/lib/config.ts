/**
 * Configuration file for the application that centralizes
 * important settings and allows for environment-based configuration.
 */

// Helper function to format the API URL for cloud deployments (Vercel or Netlify)
const getApiBaseUrl = () => {
  // Get the API URL from environment variables
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // If running in production on Vercel
  if (apiUrl && apiUrl.includes('${VERCEL_URL}')) {
    // Replace the placeholder with the actual Vercel URL
    // In production, this will use the HTTPS protocol automatically
    const vercelUrl = window.location.origin;
    return apiUrl.replace('${VERCEL_URL}', vercelUrl);
  }
  
  // If running in production on Netlify
  if (apiUrl && apiUrl.includes('${NETLIFY_URL}')) {
    // Replace the placeholder with the actual Netlify URL
    const netlifyUrl = window.location.origin;
    return apiUrl.replace('${NETLIFY_URL}', netlifyUrl);
  }
  
  // Default to localhost for development
  return apiUrl || 'http://localhost:5000/api';
};

// API configuration
export const API_CONFIG = {
  // Base URL for API calls
  baseUrl: getApiBaseUrl(),
};

// Firebase configuration is handled in firebase.ts

// App-wide configuration
export const APP_CONFIG = {
  appName: 'IndicLaw AI',
  // Add other app-wide settings here
};
