/**
 * Chat routes for handling conversations with AI
 */
import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import ollama, { AI_MODELS, getModelSettings, calculateMaxTokens, createChatCompletion } from '../services/ollamaClient.js';
import { createStreamingCompletion } from '../services/ollamaStreamClient.js';
import { extractTextFromImage, isSupportedImageFormat } from '../utils/imageProcessor.js';
import { extractTextFromPDF, extractTextFromDocx, fileExists } from '../utils/fileProcessor.js';
import { 
  addMessageToHistory, 
  getConversationHistory, 
  clearConversationHistory, 
  getFormattedConversationMessages 
} from '../utils/chatHistory.js';
import responseFormatter from '../utils/responseFormatter.js';
import config from '../config/index.js';

const router = express.Router();

// Health check endpoint for API route
router.get('/health', (req, res) => {
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

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.uploads.path),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: config.uploads.maxFileSize },
  fileFilter: (req, file, cb) => cb(null, true)
});

/**
 * Helper function to process uploaded files (images, PDFs, DOCX)
 * @param {Object} file - The uploaded file object
 * @returns {Promise<string>} - Extracted text from the file
 */
async function processUploadedFile(file) {
  if (!file) return '';
  
  console.log("File received:", file.originalname, file.mimetype);
  const type = file.mimetype;
  try {
    if (isSupportedImageFormat(type)) {
      return `\n\nExtracted from image: ${await extractTextFromImage(file.path)}`;
    } else if (type === 'application/pdf') {
      return `\n\nExtracted from PDF: ${await extractTextFromPDF(file.path)}`;
    } else if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return `\n\nExtracted from Word File: ${await extractTextFromDocx(file.path)}`;
    }
  } catch (fileErr) {
    console.error("File processing error:", fileErr);
  }
  return '';
}

/**
 * Clean up uploaded file after processing
 * @param {Object} file - The uploaded file object
 */
async function cleanUpFile(file) {
  if (file && file.path) {
    try {
      const fileStillExists = await fileExists(file.path);
      if (fileStillExists) {
        fs.unlinkSync(file.path);
        console.log(`Cleaned up file: ${file.path}`);
      }
    } catch (cleanupError) {
      console.error("Error cleaning up file:", cleanupError);
    }
  }
}

/**
 * Handle file upload errors
 * @param {Object} err - Error object
 * @param {Object} res - Express response object
 * @param {string} sessionId - Session ID
 * @returns {Object} - Response object if error, null otherwise
 */
function handleUploadError(err, res, sessionId) {
  if (!err) return null;
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    console.error("File too large:", err);
    return res.status(413).json({ 
      error: "File too large", 
      reply: `File size exceeds the maximum allowed size of ${Math.round(config.uploads.maxFileSize / (1024 * 1024))} MB.`,
      sessionId
    });
  }
  
  console.error("File upload error:", err);
  return res.status(400).json({
    error: "File upload error",
    reply: "There was an error uploading your file. Please try again.",
    sessionId
  });
}

/**
 * Prepare messages with formatting instructions
 * @param {Array} messages - Original messages array
 * @returns {Array} - Enhanced messages with formatting instructions
 */
function prepareEnhancedMessages(messages) {
  const formattingInstructions = responseFormatter.getFormattingInstructions();
  const systemMessages = messages.filter(msg => msg.role === 'system');
  const userMessages = messages.filter(msg => msg.role !== 'system');
  
  const enhancedSystemMessages = [
    ...systemMessages,
    { role: 'system', content: formattingInstructions }
  ];
  
  return [...enhancedSystemMessages, ...userMessages];
}

/**
 * Helper function to handle API errors
 * @param {Error} err - Error object
 * @param {Object} res - Express response object
 * @param {string} sessionId - Session ID
 * @returns {boolean} - True if error was handled, false otherwise
 */
function handleApiError(err, res, sessionId) {
  const errorResponseBase = { sessionId };
  
  // Handle credit errors
  if (err.status === 402) {
    console.log("OpenRouter credit error details:", err.message);
    const tokenLimitMessage = err.message?.includes("tokens") 
      ? "Try sending a shorter message or using a different model."
      : "";
    
    res.status(402).json({
      ...errorResponseBase,
      error: "API credit limit exceeded",
      reply: `Sorry, the AI service has reached its usage limit. ${tokenLimitMessage} Please try again later or contact the administrator.`
    });
    return true;
  }
  
  // Handle rate limiting
  if (err.status === 429) {
    res.status(429).json({
      ...errorResponseBase,
      error: "Rate limit exceeded",
      reply: "Sorry, we're receiving too many requests right now. Please wait a moment and try again."
    });
    return true;
  }
  
  // Handle specific error messages from OpenRouter
  if (err.error?.message) {
    res.status(err.status || 500).json({
      ...errorResponseBase,
      error: err.error.message,
      reply: "The AI service returned an error: " + err.error.message
    });
    return true;
  }
  
  // Handle network errors
  if (err.message === "API request timed out" || 
      err.message?.includes("ECONNREFUSED") || 
      err.message?.includes("network") ||
      err.code === 'ENOTFOUND') {
    console.error("Network error details:", err);
    res.status(503).json({
      ...errorResponseBase,
      error: "Connection error",
      reply: "Sorry, I couldn't connect to the AI service. Please try again in a moment."
    });
    return true;
  }
  
  return false;
}

/**
 * Process a chat message with optional file attachment
 * POST /api/chat
 */
router.post('/chat', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    const sessionId = req.body.sessionId || uuidv4();
    
    if (handleUploadError(err, res, sessionId)) return;
    
    try {
      console.log("Request received:", req.body);
      let userMessage = req.body.message || '';
      const file = req.file;

      // Process uploaded file if present
      if (file) {
        userMessage += await processUploadedFile(file);
      }

      if (!userMessage.trim()) {
        return res.status(400).json({ 
          error: "No message provided", 
          reply: "Please provide a message to chat with the AI.",
          sessionId 
        });
      }

      console.log(`Processing user message for session: ${sessionId}`);
      
      // Add user message to history and get formatted conversation
      addMessageToHistory(sessionId, { role: 'user', content: userMessage });
      let messages = getFormattedConversationMessages(sessionId);
      
      // Validate messages format
      if (!Array.isArray(messages)) {
        console.error('Messages is not an array:', messages);
        messages = [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: userMessage }
        ];
      }
      
      // Check if API key is available (for OpenRouter) or Ollama host is configured
      if (!config.ollama.host) {
        console.error("Missing Ollama configuration");
        return res.status(500).json({ 
          error: "Missing Ollama configuration", 
          reply: "Server configuration error: Ollama host is missing.",
          sessionId 
        });
      }

      // Define model fallback sequence
      const modelFallbackSequence = [
        process.env.DEFAULT_MODEL || AI_MODELS.LLAMA3,
        process.env.FALLBACK_MODEL || AI_MODELS.MIXTRAL,
        AI_MODELS.MISTRAL,
        process.env.BACKUP_MODEL || AI_MODELS.GEMMA,
        AI_MODELS.ORCA_MINI
      ];
      
      let modelIndex = 0;
      let modelToUse = modelFallbackSequence[modelIndex];
      let completion;
      const apiTimeout = 45000;
      const maxRetries = 1;
      let retryCount = 0;
      
      // Prepare enhanced messages
      const enhancedMessages = prepareEnhancedMessages(messages);
      
      // Try models with fallback logic
      while (retryCount <= maxRetries) {
        try {
          console.log(`Attempting to use ${modelToUse} model... (Attempt ${retryCount + 1}/${maxRetries + 1})`);
          
          // Get model settings and calculate appropriate token limit
          const modelSettings = getModelSettings(modelToUse);
          const dynamicMaxTokens = calculateMaxTokens(enhancedMessages, modelSettings.maxTokens);
          
          console.log(`Calculated dynamic max_tokens: ${dynamicMaxTokens} for chat request`);
          
          // Create API call with timeout
          const apiPromise = Promise.race([
            createChatCompletion({
              model: modelToUse,
              messages: enhancedMessages,
              max_tokens: dynamicMaxTokens,
              temperature: modelSettings.temperature
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error("API request timed out")), apiTimeout)
            )
          ]);
          
          completion = await apiPromise;
          console.log(`Successfully received response from ${modelToUse}`);
          break;
        } catch (modelError) {
          console.error(`Error with ${modelToUse} (Attempt ${retryCount + 1}/${maxRetries + 1}):`, modelError.message);
          
          // Retry same model on timeout
          if (modelError.message === "API request timed out" && retryCount < maxRetries) {
            retryCount++;
            continue;
          }
          
          // Try next model on other errors
          if (retryCount >= maxRetries || modelError.status === 402 || modelError.status === 404 || modelError.status >= 500) {
            retryCount = 0;
            modelIndex++;
            
            if (modelIndex >= modelFallbackSequence.length) {
              console.error(`All models failed after retries`);
              throw modelError;
            }
            
            modelToUse = modelFallbackSequence[modelIndex];
            console.log(`Switching to next model: ${modelToUse}`);
            continue;
          }
          
          console.error(`Critical error with model:`, modelError);
          throw modelError;
        }
      }

      // Extract and process AI's reply
      let aiReply = '';
      
      if (completion?.choices?.[0]?.message?.content) {
        aiReply = responseFormatter.enhanceResponse(completion.choices[0].message.content.trim());
        console.log(`Response received (${aiReply.length} chars): "${aiReply.substring(0, 50)}..."`);
      } else {
        console.error("Unexpected response format:", JSON.stringify(completion));
        aiReply = "I apologize, but I couldn't generate a proper response. Please try again.";
      }
      
      // Add AI's reply to history
      addMessageToHistory(sessionId, { role: 'assistant', content: aiReply });
      
      // Send response to client
      res.json({ 
        reply: aiReply,
        sessionId,
        historyLength: getConversationHistory(sessionId).length,
        model: modelToUse
      });
      
      // Clean up file asynchronously
      if (file) cleanUpFile(file);
      
    } catch (err) {
      console.error("API Error:", err);
      
      // Handle specific API errors
      if (!handleApiError(err, res, sessionId || 'error-session')) {
        // General error handling for unhandled errors
        let errorDetails = '';
        try {
          errorDetails = err.response?.data ? JSON.stringify(err.response.data) : '';
        } catch (_) {
          errorDetails = 'Unable to stringify error data';
        }
        
        console.error("Error details:", errorDetails || 'No additional details');
        
        res.status(500).json({
          sessionId: sessionId || 'error-session',
          error: err.message || "Unknown error",
          reply: "Sorry, I encountered an error processing your request. Please try again with a simpler question."
        });
      }
      
      // Clean up file even on error
      if (req.file) cleanUpFile(req.file);
    }
  });
});

/**
 * Process a chat message with streaming response
 * POST /api/chat/stream
 */
router.post('/chat/stream', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    const sessionId = req.body.sessionId || uuidv4();
    
    // Handle file upload errors
    if (handleUploadError(err, res, sessionId)) return;
    
    // Set up Server-Sent Events headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    
    // Set a timeout for the API call
    const apiTimeout = 60000;
    let streamTimeout = setTimeout(() => {
      console.error("Stream request timed out");
      res.write(`data: ${JSON.stringify({ 
        error: "API request timed out",
        done: true 
      })}\n\n`);
      res.end();
    }, apiTimeout);
    
    try {
      console.log("Stream request received:", req.body);
      let userMessage = req.body.message || '';
      const file = req.file;

      // Process the uploaded file
      if (file) {
        userMessage += await processUploadedFile(file);
      }

      if (!userMessage.trim()) {
        clearTimeout(streamTimeout);
        return res.status(400).json({ 
          error: "No message provided", 
          reply: "Please provide a message to chat with the AI.",
          sessionId
        });
      }

      console.log(`Processing user message for stream session: ${sessionId}`);
      
      // Add user message to history
      addMessageToHistory(sessionId, { role: 'user', content: userMessage });
      
      // Get formatted conversation
      let messages = getFormattedConversationMessages(sessionId);
      
      // Check if Ollama is configured
      if (!config.ollama?.host) {
        clearTimeout(streamTimeout);
        console.error("Missing Ollama configuration");
        return res.status(500).json({ 
          error: "Missing Ollama configuration", 
          reply: "Server configuration error: Ollama is not configured.",
          sessionId
        });
      }

      // Define model fallback sequence for Ollama
      const streamModelFallbackSequence = [
        config.ollama.defaultModel || 'gemma3:4b',  // Using configured default model as primary
        'mistral:7b',  // mistral as fallback
        'kartikm7/indian-lawen2-1.5b'  // indian law model as last resort
      ];
      
      let modelIndex = 0;
      let modelToUse = streamModelFallbackSequence[modelIndex];
      let aiReply = '';
      
      // Prepare enhanced messages
      const enhancedMessages = prepareEnhancedMessages(messages);
      
      // First attempt with primary model
      try {
        console.log(`Attempting to stream from ${modelToUse} model...`);
        
        // Calculate appropriate token limit
        const modelSettings = getModelSettings(modelToUse);
        const dynamicMaxTokens = calculateMaxTokens(modelToUse, enhancedMessages);
        
        console.log(`Calculated max_tokens: ${dynamicMaxTokens} for stream`);
        
        // Create the streaming request using Ollama
        // Clear the timeout as we're about to make the request
        clearTimeout(streamTimeout);

        // Use our streaming client instead
        aiReply = await createStreamingCompletion({
          model: modelToUse,
          messages: enhancedMessages,
          max_tokens: dynamicMaxTokens,
          temperature: modelSettings.temperature || 0.7,
        }, res);
        
        // Add to history and send completion
        addMessageToHistory(sessionId, { role: 'assistant', content: aiReply });
        res.write(`data: ${JSON.stringify({ done: true, sessionId, model: modelToUse })}\n\n`);
        res.end();
        
      } catch (streamError) {
        console.error(`Streaming error with ${modelToUse}:`, streamError.message);
        clearTimeout(streamTimeout);
        
        // Try fallback model
        modelIndex++;
        if (modelIndex < streamModelFallbackSequence.length) {
          modelToUse = streamModelFallbackSequence[modelIndex];
          console.log(`Trying fallback model: ${modelToUse}`);
          
          try {
            // More conservative settings for fallback
            const modelSettings = getModelSettings(modelToUse);
            const fallbackMaxTokens = Math.min(500, modelSettings.maxTokens || 500);
            
            // Use our streaming client for fallback model
            aiReply = await createStreamingCompletion({
              model: modelToUse,
              messages: enhancedMessages,
              max_tokens: fallbackMaxTokens,
              temperature: modelSettings.temperature || 0.7,
            }, res);
            
            addMessageToHistory(sessionId, { role: 'assistant', content: aiReply });
            res.write(`data: ${JSON.stringify({ 
              done: true, 
              sessionId, 
              model: modelToUse,
              note: "Fallback model used"
            })}\n\n`);
            res.end();
            return;
          } catch (fallbackError) {
            // Last resort fallback - use a hardcoded model
            const lastFallbackModel = 'orca-mini'; // Using orca-mini as emergency fallback
            console.log(`Trying emergency fallback model ${lastFallbackModel}...`);
            
            try {
              const simplifiedMessages = [
                { role: 'system', content: 'You are a helpful assistant.' },
                ...messages.filter(msg => msg.role === 'user')
              ];
              
              // Use our streaming client for last resort
              aiReply = await createStreamingCompletion({
                model: lastFallbackModel,
                messages: simplifiedMessages,
                max_tokens: 400,
                temperature: 0.5,
              }, res);
              
              addMessageToHistory(sessionId, { role: 'assistant', content: aiReply });
              res.write(`data: ${JSON.stringify({ 
                done: true, 
                sessionId, 
                model: lastFallbackModel,
                note: "Emergency fallback"
              })}\n\n`);
              res.end();
              return;
            } catch (finalError) {
              console.error("All fallbacks failed:", finalError.message);
            }
          }
        }
        
        // All models failed - send static fallback response
        const fallbackResponse = "I'm sorry, I couldn't process your request at this moment. Please try again with a shorter or different question.";
        addMessageToHistory(sessionId, { role: 'assistant', content: fallbackResponse });
        res.write(`data: ${JSON.stringify({ content: fallbackResponse })}\n\n`);
        res.write(`data: ${JSON.stringify({ 
          done: true,
          errorType: streamError.status === 402 ? "credit_error" : "general_error",
          note: "Static fallback"
        })}\n\n`);
        res.end();
      }
      
      // Clean up file regardless of outcome
      if (file) await cleanUpFile(file);
      
    } catch (err) {
      console.error("Stream API Error:", err);
      
      // Clear timeout
      clearTimeout(streamTimeout);
      
      // User-friendly error message
      const userErrorMessage = err.message === "API request timed out" ? "AI response timeout. Try a shorter message." :
                              err.status === 429 ? "Too many requests. Please wait a moment." :
                              err.status === 402 ? "AI service usage limit reached." :
                              "Something went wrong. Please try again.";
      
      res.write(`data: ${JSON.stringify({ 
        error: err.message || "Unknown error",
        userMessage: userErrorMessage,
        done: true
      })}\n\n`);
      res.end();
      
      // Clean up file on error
      if (req.file) await cleanUpFile(req.file);
    }
  });
});

/**
 * Get chat history for a session
 * GET /api/history/:sessionId
 */
router.get('/history/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const history = getConversationHistory(sessionId);
  res.json({ sessionId, history });
});

/**
 * Clear chat history for a session
 * DELETE /api/history/:sessionId
 */
router.delete('/history/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  clearConversationHistory(sessionId);
  res.json({ message: 'Chat history cleared', sessionId });
});

/**
 * API health check and configuration test endpoint
 * GET /api/health
 */
router.get('/health', async (req, res) => {
  try {
    // Check if API key exists and has the correct format
    const apiKeyPresent = !!config.openRouter.apiKey;
    const isValidFormat = apiKeyPresent && config.openRouter.apiKey.startsWith('sk-or-');
    
    if (!apiKeyPresent) {
      console.warn("No API key configured in config.openRouter.apiKey");
    } else if (!isValidFormat) {
      console.warn("API key exists but format may not be correct (should start with 'sk-or-')");
    }
    
    // Return health status
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      apiKeyPresent,
      apiKeyValid: apiKeyPresent,
      openrouterConnected: apiKeyPresent,
      apiError: apiKeyPresent ? null : "API key is missing"
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Health check failed',
      error: error.message
    });
  }
});

export default router;
