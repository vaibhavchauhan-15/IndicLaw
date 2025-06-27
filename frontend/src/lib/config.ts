/**
 * Configuration file for the application that centralizes
 * important settings and allows for environment-based configuration.
 */

// API configuration
export const API_CONFIG = {
  // Base URL for API calls
  // In development: Uses localhost with the backend port (5000)
  // In production: Would use the deployed API URL
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
};

// Firebase configuration is handled in firebase.ts

// App-wide configuration
export const APP_CONFIG = {
  appName: 'IndicLaw AI',
  // Add other app-wide settings here
};
