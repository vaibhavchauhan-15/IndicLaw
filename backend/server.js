import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import mongoose from 'mongoose';
import chatRoute from './routes/chat.js';
import chatDBRoute from './routes/chatDB.js';
import authRoute from './routes/auth.js';
import documentRoute from './routes/documents.js';
import { requestLogger, errorHandler } from './middleware/logger.js';
import config from './config/index.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
mongoose.connect(config.mongodb.uri)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
  });

// Validate essential configuration
if (!config.ollama.host) {
  console.error("\x1b[31m%s\x1b[0m", "ERROR: Ollama host is missing. Please set OLLAMA_HOST in .env file");
  console.error("The application will start, but AI requests will fail.");
}

const app = express();

// Middlewares
app.use(requestLogger); // Log all requests

app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));
app.use(express.json());

// Root health check endpoint 
app.get('/health', (req, res) => {
  // Check Ollama configuration
  const ollamaHost = config.ollama?.host;
  const ollamaConfigured = !!ollamaHost;
  
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    apiKeyPresent: ollamaConfigured, // Using the same field for compatibility with frontend
    apiKeyValid: ollamaConfigured,   // Using the same field for compatibility with frontend
    ollamaConfigured: ollamaConfigured,
    ollamaHost: ollamaConfigured ? ollamaHost : null
  });
});

// API routes
app.use('/api', chatRoute);
app.use('/api/db', chatDBRoute); // MongoDB-based chat routes
app.use('/api/auth', authRoute);
app.use('/api/documents', documentRoute);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Add error handling middleware last
app.use(errorHandler);

// Start the server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`Health check at http://localhost:${PORT}/health`);
  
  // Display Ollama status
  if (!config.ollama.host) {
    console.error("\x1b[31m%s\x1b[0m", "⚠️ WARNING: No valid Ollama host configuration found!");
    console.error("\x1b[33m%s\x1b[0m", "AI functionality will not work until you update the .env file with a valid Ollama host.");
    console.log("\x1b[36m%s\x1b[0m", "Make sure Ollama is installed and running. Default host is http://localhost:11434");
    console.log("\x1b[36m%s\x1b[0m", "Then update your .env file with: OLLAMA_HOST=http://localhost:11434");
  } else {
    console.log("\x1b[32m%s\x1b[0m", "✅ Ollama configuration found!");
    console.log("\x1b[36m%s\x1b[0m", `Using Ollama at: ${config.ollama.host}`);
    console.log("\x1b[36m%s\x1b[0m", `Default model: ${config.ollama.defaultModel}`);
  }
});
