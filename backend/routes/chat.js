/**
 * Chat routes for handling conversations with AI
 */
import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import openai, { AI_MODELS, getModelSettings, calculateMaxTokens } from '../services/openaiClient.js';
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

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, config.uploads.path);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: config.uploads.maxFileSize },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

/**
 * Process a chat message with optional file attachment
 * POST /api/chat
 */
router.post('/chat', (req, res, next) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        console.error("File too large:", err);
        return res.status(413).json({ 
          error: "File too large", 
          reply: `File size exceeds the maximum allowed size of ${Math.round(config.uploads.maxFileSize / (1024 * 1024))} MB.`,
          sessionId: req.body.sessionId || uuidv4()
        });
      }
      // Handle other multer errors
      console.error("File upload error:", err);
      return res.status(400).json({
        error: "File upload error",
        reply: "There was an error uploading your file. Please try again.",
        sessionId: req.body.sessionId || uuidv4()
      });
    }
    
    // No errors, proceed with the route handler
    try {
      console.log("Request received:", req.body);
      let userMessage = req.body.message || '';
      const sessionId = req.body.sessionId || uuidv4(); // Use provided session ID or generate a new one
      const file = req.file;

      if (file) {
        console.log("File received:", file.originalname, file.mimetype);
        const type = file.mimetype;
        try {
          if (isSupportedImageFormat(type)) {
            const text = await extractTextFromImage(file.path);
            userMessage += `\n\nExtracted from image: ${text}`;
          } else if (type === 'application/pdf') {
            const text = await extractTextFromPDF(file.path);
            userMessage += `\n\nExtracted from PDF: ${text}`;
          } else if (
            type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ) {
            const text = await extractTextFromDocx(file.path);
            userMessage += `\n\nExtracted from Word File: ${text}`;
          }
        } catch (fileErr) {
          console.error("File processing error:", fileErr);
          // Continue with just the text message if file processing fails
        }
      }

      if (!userMessage.trim()) {
        return res.status(400).json({ 
          error: "No message provided", 
          reply: "Please provide a message to chat with the AI.",
          sessionId: sessionId 
        });
      }

      console.log(`Processing user message for session: ${sessionId}`);
      
      // Create user message object
      const userMessageObj = { role: 'user', content: userMessage };
      
      // First, add the user message to history (before API call)
      addMessageToHistory(sessionId, userMessageObj);
      
      // Now get properly formatted messages for the API call including system message
      let messages = getFormattedConversationMessages(sessionId);
      
      // Log the message count being sent to AI
      console.log(`Sending ${messages.length} messages to AI (including system message)`);
      // Log first few characters of each message for debugging
      if (Array.isArray(messages)) {
        messages.forEach((msg, i) => {
          if (msg && msg.role && typeof msg.content === 'string') {
            console.log(`Message ${i} (${msg.role}): ${msg.content.substring(0, 50)}...`);
          } else {
            console.warn(`Message ${i} has invalid format:`, msg);
          }
        });
      } else {
        console.error('Messages is not an array:', messages);
        // Create a valid messages array with just the user message as fallback
        messages = [ // Using direct assignment since messages is now let instead of const
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: userMessage }
        ];
      }

      console.log(`Sending message to OpenAI (Session: ${sessionId}):`, userMessage.slice(0, 100) + "...");
      console.log(`Conversation history length: ${messages.length - 1} messages`); // Subtract 1 to exclude system message
      
      // Check if API key is available
      if (!config.openRouter.apiKey) {
        console.error("Missing API key");
        return res.status(500).json({ 
          error: "Missing API configuration", 
          reply: "Server configuration error: API key is missing.",
          sessionId: sessionId 
        });
      }

      // Define model fallback sequence from most capable to least capable
      // Use environment variables if available, otherwise use hardcoded defaults
      const defaultModel = process.env.DEFAULT_MODEL || AI_MODELS.GPT4O;
      const fallbackModel = process.env.FALLBACK_MODEL || AI_MODELS.CLAUDE3HAIKU;
      const backupModel = process.env.BACKUP_MODEL || AI_MODELS.MISTRAL;
      
      const modelFallbackSequence = [
        defaultModel,      // First try default model (GPT-4o)
        fallbackModel,     // Then fallback model (Claude 3 Haiku)
        AI_MODELS.GPT35TURBO, // Then GPT-3.5 Turbo
        backupModel,       // Then backup model (Mistral)
        AI_MODELS.GEMMA,   // Then Gemma (lower cost)
        AI_MODELS.LLAMA3   // Finally Llama 3 (lower cost)
      ];
      
      let modelIndex = 0;
      let modelToUse = modelFallbackSequence[modelIndex];
      let completion;
      
      // Set a timeout for the API call - 45 seconds (balanced timeout)
      const apiTimeout = 45000;
      
      // Set maximum retry attempts per model
      const maxRetries = 1;
      let retryCount = 0;
      
      while (retryCount <= maxRetries) {
        try {
          console.log(`Attempting to use ${modelToUse} model... (Attempt ${retryCount + 1}/${maxRetries + 1})`);
          
          // Create a promise that resolves with the API response or rejects after timeout
          // Prepare messages with formatting instructions
          const formattingInstructions = responseFormatter.getFormattingInstructions();
          
          // Get all system messages except the last one
          const systemMessages = messages.filter(msg => msg.role === 'system');
          const userMessages = messages.filter(msg => msg.role !== 'system');
          
          // Enhance the system messages with formatting instructions
          const enhancedSystemMessages = [
            ...systemMessages,
            {
              role: 'system',
              content: formattingInstructions
            }
          ];
          
          // Combine systems messages with user messages
          const enhancedMessages = [...enhancedSystemMessages, ...userMessages];
          
          // Get model-specific settings
          const modelSettings = getModelSettings(modelToUse);
          
          // Dynamically calculate the appropriate max_tokens value based on message length
          const dynamicMaxTokens = calculateMaxTokens(enhancedMessages, modelSettings.maxTokens);
          console.log(`Calculated dynamic max_tokens: ${dynamicMaxTokens} for regular chat request`);
          
          const apiPromise = Promise.race([
            openai.chat.completions.create({
              model: modelToUse,
              messages: enhancedMessages,
              max_tokens: dynamicMaxTokens,
              temperature: modelSettings.temperature,
              presence_penalty: modelSettings.presencePenalty,
              frequency_penalty: modelSettings.frequencyPenalty,
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error("API request timed out")), apiTimeout)
            )
          ]);
          
          completion = await apiPromise;
          
          console.log(`Successfully received response from ${modelToUse}`);
          // If we get here, the request was successful
          break;
        } catch (modelError) {
          console.error(`Error with ${modelToUse} (Attempt ${retryCount + 1}/${maxRetries + 1}):`, modelError.message);
          
          // If this is a timeout error and we haven't exceeded max retries, try again with same model
          if (modelError.message === "API request timed out" && retryCount < maxRetries) {
            console.log(`Retrying with ${modelToUse} after timeout...`);
            retryCount++;
            continue;
          }
          
          // If this is our last retry or a different error, try switching models
          if (retryCount >= maxRetries || modelError.status === 402 || modelError.status === 404 || modelError.status >= 500) {
            retryCount = 0; // Reset retry count when switching models
            modelIndex++; // Move to next model in the fallback sequence
            
            // If we've already tried all models, throw the error
            if (modelIndex >= modelFallbackSequence.length) {
              console.error(`All models failed after retries`);
              throw modelError;
            }
            
            // Switch to the next model
            modelToUse = modelFallbackSequence[modelIndex];
            console.log(`Switching to next model: ${modelToUse}`);
            
            // Log specific messages based on error type
            if (modelError.status === 402) {
              console.log(`Credit error detected! Falling back to ${modelToUse} to save credits.`);
            } else if (modelError.status === 404) {
              console.log(`Model not found error. Trying ${modelToUse} instead.`);
            } else {
              console.log(`Error with previous model. Falling back to ${modelToUse}.`);
            }
            
            // Reset retry count for the new model - already done above
            continue;
          }
          
          // If we get here, it's a non-recoverable error
          console.error(`Critical error with model, not retrying:`, modelError);
          throw modelError;
        }
      }

      // Safely extract the AI's reply
      let aiReply = '';
      
      if (completion && 
          completion.choices && 
          completion.choices[0] && 
          completion.choices[0].message && 
          completion.choices[0].message.content) {
        // Get the raw response content
        let rawReply = completion.choices[0].message.content.trim();
        
        // Enhance the response formatting
        aiReply = responseFormatter.enhanceResponse(rawReply);
        
        console.log(`Response received (${aiReply.length} chars): "${aiReply.substring(0, 50)}..."`);
      } else {
        console.error("Unexpected response format:", JSON.stringify(completion));
        aiReply = "I apologize, but I couldn't generate a proper response. Please try again.";
      }
      
      // Add AI's reply to conversation history
      addMessageToHistory(sessionId, { role: 'assistant', content: aiReply });
      
      // Get history length excluding system message
      const historyLength = getConversationHistory(sessionId).length;
      
      // Send response to client
      res.json({ 
        reply: aiReply,
        sessionId: sessionId,
        historyLength: historyLength,
        model: modelToUse
      });
          // Clean up the file after processing
    if (file && file.path) {
      try {
        const fileStillExists = await fileExists(file.path);
        if (fileStillExists) {
          fs.unlinkSync(file.path);
          console.log(`Cleaned up file: ${file.path}`);
        }
      } catch (cleanupError) {
        console.error("Error cleaning up file:", cleanupError);
        // Continue execution, file cleanup is not critical
      }
    }
    } catch (err) {
      console.error("API Error:", err);
      
      // Get the sessionId from the request or use a fallback
      const errorSessionId = req.body.sessionId || 'error-session';
      
      // Include the session ID in all error responses
      const errorResponseBase = {
        sessionId: errorSessionId
      };
      
      // Handle specific OpenRouter credit errors
      if (err.status === 402) {
        console.log("OpenRouter credit error details:", err.message);
        
        // Check if the error contains specific information about tokens
        const tokenLimitMessage = err.message && err.message.includes("tokens") 
          ? "Try sending a shorter message or using a different model."
          : "";
        
        return res.status(402).json({
          ...errorResponseBase,
          error: "API credit limit exceeded",
          reply: `Sorry, the AI service has reached its usage limit. ${tokenLimitMessage} Please try again later or contact the administrator.`
        });
      }
      
      // Handle rate limiting errors
      if (err.status === 429) {
        return res.status(429).json({
          ...errorResponseBase,
          error: "Rate limit exceeded",
          reply: "Sorry, we're receiving too many requests right now. Please wait a moment and try again."
        });
      }
      
      // If the error has a specific message from OpenRouter
      if (err.error && err.error.message) {
        return res.status(err.status || 500).json({
          ...errorResponseBase,
          error: err.error.message,
          reply: "The AI service returned an error: " + err.error.message
        });
      }
      
      // Handle network errors
      if (err.message === "API request timed out" || 
          err.message.includes("ECONNREFUSED") || 
          err.message.includes("network") ||
          err.code === 'ENOTFOUND') {
        console.error("Network error details:", err);
        return res.status(503).json({
          ...errorResponseBase,
          error: "Connection error",
          reply: "Sorry, I couldn't connect to the AI service. Please try again in a moment. If the problem persists, please try a shorter message or try again later."
        });
      }
      
      // Try to extract more error details
      let errorDetails = '';
      if (err.response?.data) {
        try {
          errorDetails = JSON.stringify(err.response.data);
        } catch (_) {
          errorDetails = 'Unable to stringify error data';
        }
      }
      
      console.error("Error details:", errorDetails || 'No additional details');
      
      // General error handling
      res.status(500).json({
        ...errorResponseBase,
        error: err.message || "Unknown error",
        reply: "Sorry, I encountered an error processing your request. Please try again with a simpler question."
      });
    }
  });
});

/**
 * Process a chat message with streaming response
 * POST /api/chat/stream
 */
router.post('/chat/stream', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        console.error("File too large in stream endpoint:", err);
        return res.status(413).json({ 
          error: "File too large", 
          reply: `File size exceeds the maximum allowed size of ${Math.round(config.uploads.maxFileSize / (1024 * 1024))} MB.`,
          sessionId: req.body.sessionId || uuidv4()
        });
      }
      // Handle other multer errors
      console.error("File upload error in stream endpoint:", err);
      return res.status(400).json({
        error: "File upload error",
        reply: "There was an error uploading your file. Please try again.",
        sessionId: req.body.sessionId || uuidv4()
      });
    }
    
  try {
    console.log("Stream request received:", req.body);
    let userMessage = req.body.message || '';
    const sessionId = req.body.sessionId || uuidv4(); // Use provided session ID or generate a new one
    const file = req.file;

    if (file) {
      console.log("File received:", file.originalname, file.mimetype);
      const type = file.mimetype;
      try {
        if (isSupportedImageFormat(type)) {
          const text = await extractTextFromImage(file.path);
          userMessage += `\n\nExtracted from image: ${text}`;
        } else if (type === 'application/pdf') {
          const text = await extractTextFromPDF(file.path);
          userMessage += `\n\nExtracted from PDF: ${text}`;
        } else if (
          type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
          const text = await extractTextFromDocx(file.path);
          userMessage += `\n\nExtracted from Word File: ${text}`;
        }
      } catch (fileErr) {
        console.error("File processing error:", fileErr);
        // Continue with just the text message if file processing fails
      }
    }

    if (!userMessage.trim()) {
      return res.status(400).json({ 
        error: "No message provided", 
        reply: "Please provide a message to chat with the AI.",
        sessionId: sessionId 
      });
    }

    console.log(`Processing user message for stream session: ${sessionId}`);
    
    // Create user message object
    const userMessageObj = { role: 'user', content: userMessage };
    
    // First, add the user message to history (before API call)
    addMessageToHistory(sessionId, userMessageObj);
    
    // Now get properly formatted messages for the API call including system message
    let messages = getFormattedConversationMessages(sessionId);
    
    // Declare enhancedMessages at a higher scope so it's available in catch blocks
    let enhancedMessages;
    
    // Check if API key is available
    if (!config.openRouter.apiKey) {
      console.error("Missing API key");
      return res.status(500).json({ 
        error: "Missing API configuration", 
        reply: "Server configuration error: API key is missing.",
        sessionId: sessionId 
      });
    }

    // Set up Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Define model fallback sequence for streaming, similar to regular chat endpoint
    const defaultStreamModel = process.env.DEFAULT_STREAM_MODEL || AI_MODELS.GPT4O;
    const fallbackStreamModel = process.env.FALLBACK_STREAM_MODEL || AI_MODELS.CLAUDE3HAIKU;
    
    const streamModelFallbackSequence = [
      defaultStreamModel,        // First try default model (GPT-4o)
      fallbackStreamModel,       // Then fallback model (Claude 3 Haiku)
      AI_MODELS.GPT35TURBO       // Finally GPT-3.5 Turbo as most reliable
    ];
    
    let modelIndex = 0;
    let modelToUse = streamModelFallbackSequence[modelIndex];
    let aiReply = '';
    let lineBuffer = '';
    let retryCount = 0;
    const maxStreamRetries = 1;
    
    // Set a timeout for the API call - 60 seconds
    const apiTimeout = 60000;
    let streamTimeout = setTimeout(() => { // Changed from const to let so it's accessible in the catch block
      console.error("Stream request timed out");
      res.write(`data: ${JSON.stringify({ 
        error: "API request timed out",
        done: true 
      })}\n\n`);
      res.end();
    }, apiTimeout);
    
    try {
      console.log(`Attempting to stream from ${modelToUse} model...`);
      
      // Dynamically calculate the appropriate max_tokens value based on message length
      const dynamicMaxTokens = calculateMaxTokens(messages, 800);
      console.log(`Calculated dynamic max_tokens: ${dynamicMaxTokens} for stream request`);
      
      // Add response formatting instructions to messages for consistent output
      const formattingInstructions = responseFormatter.getFormattingInstructions();
      
      // Get all system messages except the last one
      const systemMessages = messages.filter(msg => msg.role === 'system');
      const userMessages = messages.filter(msg => msg.role !== 'system');
      
      // Enhance the system messages with formatting instructions
      const enhancedSystemMessages = [
        ...systemMessages,
        {
          role: 'system',
          content: formattingInstructions
        }
      ];
      
      // Combine systems messages with user messages
      enhancedMessages = [...enhancedSystemMessages, ...userMessages];
      
      // Get model-specific settings
      const modelSettings = getModelSettings(modelToUse);
      
      const stream = await openai.chat.completions.create({
        model: modelToUse,
        messages: enhancedMessages,
        max_tokens: dynamicMaxTokens,
        temperature: modelSettings.temperature || 0.7,
        presence_penalty: modelSettings.presencePenalty || 0.3,
        frequency_penalty: modelSettings.frequencyPenalty || 0.3,
        stream: true,
      });
      
      // Clear the timeout as we got a response
      clearTimeout(streamTimeout);

      // Send events for each chunk - optimized for word-by-word streaming
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          aiReply += content;
          
          // Send each chunk immediately for smoother word-by-word streaming
          res.write(`data: ${JSON.stringify({ content: content })}\n\n`);
        }
      }
      
      // No need to handle remaining buffer since we're sending each chunk immediately
      // Signal completion
      
      // Add the complete AI message to history once streaming is complete
      addMessageToHistory(sessionId, { role: 'assistant', content: aiReply });

      // Send end event
      res.write(`data: ${JSON.stringify({ done: true, sessionId, model: modelToUse })}\n\n`);
      res.end();
      
    } catch (streamError) {
      console.error(`Streaming error with ${modelToUse}:`, streamError.message);
      // Clear the timeout to prevent double-sending errors
      clearTimeout(streamTimeout);
      
      // Try next model in fallback sequence
      modelIndex++;
      retryCount = 0;
      
      // If we still have models to try in the sequence
      if (modelIndex < streamModelFallbackSequence.length) {
        modelToUse = streamModelFallbackSequence[modelIndex];
        console.log(`Stream error occurred. Trying next model in sequence: ${modelToUse}`);
        
        // Specific log message based on error type
        if (streamError.status === 402) {
          console.log(`Credit error detected! Falling back to ${modelToUse} to save credits.`);
        } else if (streamError.status === 404) {
          console.log(`Model not found error. Trying ${modelToUse} instead.`);
        } else {
          console.log(`Error with previous model. Falling back to ${modelToUse}.`);
        }
        
        try {
          // Set model-specific settings for the fallback model
          const modelSettings = getModelSettings(modelToUse);
          // Use a more conservative token limit for fallbacks to ensure reliability
          const fallbackMaxTokens = Math.min(500, modelSettings.maxTokens || 500);
          
          console.log(`Attempting fallback to ${modelToUse} with max_tokens=${fallbackMaxTokens}...`);
          
          // Use the enhanced messages with formatting instructions
          const fallbackStream = await openai.chat.completions.create({
            model: modelToUse,
            messages: enhancedMessages, // Use enhanced messages with formatting instructions
            max_tokens: fallbackMaxTokens,
            temperature: modelSettings.temperature || 0.7,
            presence_penalty: modelSettings.presencePenalty || 0.3,
            frequency_penalty: modelSettings.frequencyPenalty || 0.3,
            stream: true,
          });
          
          aiReply = '';
          // Process the fallback stream
          for await (const chunk of fallbackStream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              aiReply += content;
              res.write(`data: ${JSON.stringify({ content: content })}\n\n`);
            }
          }
          
          // Add to history and end the stream
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
          console.error(`Fallback to ${modelToUse} also failed:`, fallbackError.message);
          // Continue to try next model if available
          if (modelIndex + 1 < streamModelFallbackSequence.length) {
            modelIndex++;
            modelToUse = streamModelFallbackSequence[modelIndex];
            // Try one final model (usually GPT-3.5 Turbo) as last resort
            try {
              console.log(`Trying final fallback model ${modelToUse}...`);
              const lastResortMaxTokens = 400; // Very conservative for last resort
              
              // Create a simplified set of messages for the last resort attempt
              const simplifiedMessages = [
                { role: 'system', content: 'You are a helpful assistant.' },
                ...messages.filter(msg => msg.role === 'user')
              ];
              
              const lastResortStream = await openai.chat.completions.create({
                model: modelToUse,
                messages: simplifiedMessages, // Use simplified messages for better compatibility
                max_tokens: lastResortMaxTokens,
                temperature: 0.5,
                stream: true,
              });
              
              aiReply = '';
              // Process the last resort stream
              for await (const chunk of lastResortStream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                  aiReply += content;
                  res.write(`data: ${JSON.stringify({ content: content })}\n\n`);
                }
              }
              
              // Add to history and end the stream
              addMessageToHistory(sessionId, { role: 'assistant', content: aiReply });
              res.write(`data: ${JSON.stringify({ 
                done: true, 
                sessionId, 
                model: modelToUse,
                note: "Emergency fallback model used"
              })}\n\n`);
              res.end();
              return;
            } catch (finalError) {
              console.error("All fallback models failed:", finalError.message);
            }
          }
        }
      }
      
      // If we get here, all fallbacks failed
      let errorMessage = "All available AI models failed to respond. Please try again with a shorter message.";
      let errorType = streamError.status === 402 ? "credit_error" : "general_error";
      
      // Create a simple AI response instead of showing a technical error
      const fallbackResponse = "I'm sorry, I couldn't process your request at this moment. Please try again or consider asking a shorter or different question.";
      
      // Add a basic error response to history
      addMessageToHistory(sessionId, { role: 'assistant', content: fallbackResponse });
      
      // Send the fallback content as a normal response chunk
      res.write(`data: ${JSON.stringify({ content: fallbackResponse })}\n\n`);
      
      // Then send the completion signal
      res.write(`data: ${JSON.stringify({ 
        done: true,
        errorType: errorType,
        note: "Used static fallback response"
      })}\n\n`);
      res.end();
    }

    // Clean up the file after processing
    if (file && file.path) {
      try {
        const fileStillExists = await fileExists(file.path);
        if (fileStillExists) {
          fs.unlinkSync(file.path);
          console.log(`Cleaned up file: ${file.path}`);
        }
      } catch (cleanupError) {
        console.error("Error cleaning up file:", cleanupError);
        // Continue execution, file cleanup is not critical
      }
    }
    
  } catch (err) {
    console.error("API Error:", err);
    
    // Clear the timeout if it exists
    if (typeof streamTimeout !== 'undefined') {
      clearTimeout(streamTimeout);
    }
    
    // Provide a more user-friendly error message
    let userErrorMessage = "Something went wrong. Please try again.";
    
    if (err.message === "API request timed out") {
      userErrorMessage = "The AI is taking too long to respond. Please try a shorter message.";
    } else if (err.status === 429) {
      userErrorMessage = "Too many requests. Please wait a moment and try again.";
    } else if (err.status === 402) {
      userErrorMessage = "The AI service has reached its usage limit. Please try again later.";
    }
    
    res.write(`data: ${JSON.stringify({ 
      error: err.message || "Unknown error",
      userMessage: userErrorMessage,
      done: true
    })}\n\n`);
    res.end();
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

export default router;
