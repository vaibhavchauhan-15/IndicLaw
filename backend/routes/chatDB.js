/**
 * Chat routes for handling conversations with AI (MongoDB version)
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
  createChatSession,
  addMessageToHistory, 
  getConversationHistory, 
  clearConversationHistory, 
  getFormattedConversationMessages,
  getUserSessions,
  getSessionById,
  deleteSession,
  renameSession
} from '../utils/chatHistoryDB.js';
import { getUserPreferences } from '../services/userPreferenceService.js';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth.js';
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
    apiKeyPresent: ollamaConfigured,
    apiKeyValid: ollamaConfigured,
    ollamaConfigured: ollamaConfigured,
    ollamaHost: ollamaConfigured ? ollamaHost : null
  });
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `file-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];
    
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('File type not allowed. Only PDF, DOCX, and images are supported.'), false);
    }
    
    cb(null, true);
  }
});

// Get available models
router.get('/models', async (req, res) => {
  try {
    if (!config.ollama.host) {
      return res.status(503).json({
        success: false,
        message: 'Ollama host not configured',
        models: []
      });
    }
    
    const models = await ollama.listModels();
    
    // Filter to only include supported models and sort alphabetically
    const supportedModels = models.models
      .filter(model => AI_MODELS.includes(model.name))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    res.json({
      success: true,
      models: supportedModels.map(model => ({
        id: model.name,
        name: model.name,
        ...getModelSettings(model.name)
      }))
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      models: []
    });
  }
});

// Get all chat sessions for the authenticated user
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await getUserSessions(req.user.id);
    
    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions: sessions.map(session => ({
        id: session.sessionId,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chat sessions',
      error: error.message
    });
  }
});

// Create a new chat session
router.post('/sessions', authenticateToken, async (req, res) => {
  try {
    const { title } = req.body;
    const session = await createChatSession(req.user.id, title);
    
    res.status(201).json({
      success: true,
      message: 'Chat session created successfully',
      session: {
        id: session.sessionId,
        title: session.title,
        createdAt: session.createdAt
      }
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat session',
      error: error.message
    });
  }
});

// Get a specific chat session with messages
router.get('/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const session = await getSessionById(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }
    
    // Check if user owns the session
    if (session.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this chat session'
      });
    }
    
    // Get messages
    const messages = await getConversationHistory(req.params.sessionId, false);
    
    res.status(200).json({
      success: true,
      session: {
        id: session.sessionId,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      },
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }))
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chat session',
      error: error.message
    });
  }
});

// Rename a chat session
router.patch('/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }
    
    const session = await getSessionById(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }
    
    // Check if user owns the session
    if (session.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this chat session'
      });
    }
    
    await renameSession(req.params.sessionId, title);
    
    res.status(200).json({
      success: true,
      message: 'Chat session renamed successfully'
    });
  } catch (error) {
    console.error('Rename session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rename chat session',
      error: error.message
    });
  }
});

// Delete a chat session
router.delete('/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const session = await getSessionById(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }
    
    // Check if user owns the session
    if (session.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this chat session'
      });
    }
    
    await deleteSession(req.params.sessionId);
    
    res.status(200).json({
      success: true,
      message: 'Chat session deleted successfully'
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete chat session',
      error: error.message
    });
  }
});

// Clear chat history for a session
router.delete('/sessions/:sessionId/messages', authenticateToken, async (req, res) => {
  try {
    const session = await getSessionById(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }
    
    // Check if user owns the session
    if (session.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to clear messages for this chat session'
      });
    }
    
    await clearConversationHistory(req.params.sessionId);
    
    res.status(200).json({
      success: true,
      message: 'Chat history cleared successfully'
    });
  } catch (error) {
    console.error('Clear chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear chat history',
      error: error.message
    });
  }
});

// Chat completion endpoint (non-streaming)
router.post('/chat', optionalAuthenticateToken, async (req, res) => {
  try {
    // Extract request data
    const { message, sessionId = uuidv4(), model = config.ollama.defaultModel } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }
    
    // Initialize chat session if authenticated user
    let session = null;
    if (req.user) {
      session = await getSessionById(sessionId);
      
      if (!session) {
        // Create new session if it doesn't exist
        session = await createChatSession(req.user.id, 'New Conversation');
      }
    }
    
    // Get user message
    const userMessage = {
      role: 'user',
      content: message
    };
    
    // Save user message to history
    if (req.user) {
      await addMessageToHistory(session.sessionId, userMessage);
    }
    
    // Get conversation history
    const messages = req.user ? 
      await getFormattedConversationMessages(session.sessionId) : 
      [
        {
          role: 'system',
          content: 'You are a helpful assistant specializing in Indian law. Answer questions accurately and cite sources when possible.'
        },
        userMessage
      ];
    
    // Get model settings
    const modelSettings = getModelSettings(model);
    
    // Generate AI response
    const response = await createChatCompletion({
      model,
      messages,
      temperature: modelSettings.temperature,
      max_tokens: modelSettings.maxTokens
    });
    
    const aiMessage = {
      role: 'assistant',
      content: response.message.content
    };
    
    // Save AI response to history
    if (req.user) {
      await addMessageToHistory(session.sessionId, aiMessage);
    }
    
    // Format response for client
    const formattedResponse = responseFormatter.formatResponse(aiMessage.content);
    
    res.json({
      success: true,
      message: formattedResponse,
      sessionId: req.user ? session.sessionId : sessionId,
      modelUsed: model
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Streaming chat completion endpoint
router.post('/chat/stream', optionalAuthenticateToken, async (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  try {
    // Extract request data
    const { message, sessionId = uuidv4(), model = config.ollama.defaultModel } = req.body;
    
    if (!message) {
      res.write(`data: ${JSON.stringify({
        success: false,
        message: 'Message is required',
        done: true
      })}\n\n`);
      return res.end();
    }
    
    // Initialize chat session if authenticated user
    let session = null;
    if (req.user) {
      session = await getSessionById(sessionId);
      
      if (!session) {
        // Create new session if it doesn't exist
        session = await createChatSession(req.user.id, 'New Conversation');
      }
    }
    
    // Get user message
    const userMessage = {
      role: 'user',
      content: message
    };
    
    // Save user message to history
    if (req.user) {
      await addMessageToHistory(session.sessionId, userMessage);
    }
    
    // Get conversation history
    const messages = req.user ? 
      await getFormattedConversationMessages(session.sessionId) : 
      [
        {
          role: 'system',
          content: 'You are a helpful assistant specializing in Indian law. Answer questions accurately and cite sources when possible.'
        },
        userMessage
      ];
    
    // Get model settings
    const modelSettings = getModelSettings(model);
    
    // Stream AI response
    let fullResponse = '';
    
    await createStreamingCompletion({
      model,
      messages,
      temperature: modelSettings.temperature,
      max_tokens: modelSettings.maxTokens,
      onChunk: (chunk) => {
        if (chunk.done) {
          // Send final chunk
          res.write(`data: ${JSON.stringify({
            content: chunk.content,
            done: true,
            sessionId: req.user ? session.sessionId : sessionId,
            modelUsed: model
          })}\n\n`);
        } else {
          // Send intermediate chunk
          res.write(`data: ${JSON.stringify({
            content: chunk.content,
            done: false
          })}\n\n`);
        }
        
        // Append to full response
        fullResponse += chunk.content || '';
      }
    });
    
    // Save AI response to history
    if (req.user) {
      await addMessageToHistory(session.sessionId, {
        role: 'assistant',
        content: fullResponse
      });
    }
    
    res.end();
  } catch (error) {
    console.error('Chat stream error:', error);
    res.write(`data: ${JSON.stringify({
      success: false,
      message: error.message,
      done: true
    })}\n\n`);
    res.end();
  }
});

export default router;