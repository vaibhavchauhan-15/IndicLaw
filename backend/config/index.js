import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

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
