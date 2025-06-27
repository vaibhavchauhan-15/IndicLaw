import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define path to .env file
const envPath = path.resolve(__dirname, '../../.env');

// Check if .env file exists
const envFileExists = fs.existsSync(envPath);
if (!envFileExists) {
  console.error("\x1b[31m%s\x1b[0m", `ERROR: .env file not found at ${envPath}`);
}

// Load environment variables from .env file
try {
  const result = dotenv.config({ path: envPath });
  
  if (result.error) {
    console.error("\x1b[31m%s\x1b[0m", "Failed to load .env file:", result.error.message);
  }
} catch (error) {
  console.error("\x1b[31m%s\x1b[0m", "Error loading .env file:", error.message);
}

/**
 * Configuration object with all environment variables
 */
const config = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // OpenRouter API configuration
  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    refererUrl: process.env.REFERER_URL || 'http://localhost:3000',
    siteTitle: process.env.SITE_TITLE || 'AI Chatbot',
  },
  
  // Frontend URL for CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Upload settings
  uploads: {
    path: path.resolve(__dirname, '../uploads'),
    maxFileSize: (process.env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024, // Convert MB to Bytes
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,txt,jpg,png').split(',')
  }
};

export default config;
