import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import chatRoute from './routes/chat.js';
import { requestLogger, errorHandler } from './middleware/logger.js';
import config from './config/index.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate essential configuration
if (!config.openRouter.apiKey) {
  console.error("\x1b[31m%s\x1b[0m", "ERROR: OpenRouter API key is missing. Please set OPENROUTER_API_KEY in .env file");
  console.error("The application will start, but AI requests will fail.");
} else if (!config.openRouter.apiKey.startsWith('sk-or-')) {
  console.error("\x1b[33m%s\x1b[0m", "WARNING: OpenRouter API key format appears invalid. Should start with 'sk-or-'");
}

const app = express();

// Middlewares
app.use(requestLogger); // Log all requests

app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));
app.use(express.json());

// API routes
app.use('/api', chatRoute);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

// Add error handling middleware last
app.use(errorHandler);

// Start the server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`Health check at http://localhost:${PORT}/health`);
  
  // Display API key status
  if (!config.openRouter.apiKey || config.openRouter.apiKey === 'your_new_api_key_here') {
    console.error("\x1b[31m%s\x1b[0m", "⚠️ WARNING: No valid OpenRouter API key found!");
    console.error("\x1b[33m%s\x1b[0m", "AI functionality will not work until you update the .env file with a valid API key.");
    console.log("\x1b[36m%s\x1b[0m", "Visit https://openrouter.ai to create an account and generate an API key.");
    console.log("\x1b[36m%s\x1b[0m", "Then update your .env file with: OPENROUTER_API_KEY=your_actual_api_key");
  }
});
