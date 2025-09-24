/**
 * Chat history management utility
 * Provides functions for managing conversation history in MongoDB
 */
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { ChatSession, ChatMessage } from '../models/index.js';

// Maximum number of messages to fetch per conversation (excluding system message)
const MAX_HISTORY_LENGTH = 50;

// System message that sets the personality and capabilities of the AI
const SYSTEM_MESSAGE = {
  role: 'system',
  content: `You are a helpful, friendly, and knowledgeable AI assistant specializing in Indian legal matters. Your name is IndicLaw AI.

Instructions:
- Answer questions accurately and completely about Indian law, citing sources when applicable
- Be conversational and friendly, but remain professional
- If asked about something you don't know, admit it rather than making up information
- When responding to legal questions, provide references to relevant laws, cases, or statutes when possible
- Be concise in your answers, but provide enough detail to be helpful
- Stay updated with Indian legal information
- For complex legal questions, break down your answer into easy-to-understand parts
- Avoid providing definitive legal advice that would constitute practicing law
- Always clarify that users should consult with a qualified attorney for specific legal matters

Remember to keep track of the conversation context and reference earlier parts of the conversation when relevant.`
};

/**
 * Create a new chat session
 * @param {string} userId - MongoDB User ID 
 * @param {string} title - Title for the chat session
 * @returns {Object} - Created session data
 */
export async function createChatSession(userId, title = 'New Conversation') {
  const sessionId = uuidv4();
  
  const session = new ChatSession({
    userId,
    sessionId,
    title,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  await session.save();
  
  // Create system message
  await new ChatMessage({
    sessionId,
    role: 'system',
    content: SYSTEM_MESSAGE.content,
    timestamp: new Date()
  }).save();
  
  return session;
}

/**
 * Add a message to a conversation history
 * @param {string} sessionId - Unique identifier for the conversation
 * @param {Object} message - Message object with role and content
 * @param {string|null} userId - MongoDB User ID (if authenticated)
 * @returns {Object} - Created message
 */
export async function addMessageToHistory(sessionId, message, userId = null) {
  // Check if session exists, create if not
  let session = await ChatSession.findOne({ sessionId });
  if (!session) {
    // Use provided userId or create a guest user ID
    const userIdToUse = userId || new mongoose.Types.ObjectId('000000000000000000000000');
    
    // Create a new session with this ID
    session = new ChatSession({
      sessionId,
      userId: userIdToUse, // Use the provided or guest user ID
      title: 'New Conversation',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await session.save();
    
    // If this is the first message and it's not a system message, add system message first
    if (message.role !== 'system') {
      await new ChatMessage({
        sessionId,
        role: 'system',
        content: SYSTEM_MESSAGE.content,
        timestamp: new Date()
      }).save();
    }
  }
  
  // Create message record
  const chatMessage = new ChatMessage({
    sessionId,
    role: message.role,
    content: message.content,
    timestamp: new Date(),
    metadata: message.metadata || {}
  });
  
  await chatMessage.save();
  
  // Update session timestamp
  await ChatSession.updateOne(
    { sessionId },
    { updatedAt: new Date() }
  );
  
  return chatMessage;
}

/**
 * Get the conversation history for a session
 * @param {string} sessionId - Unique identifier for the conversation
 * @param {boolean} includeSystem - Whether to include the system message
 * @returns {Array} - Array of message objects
 */
export async function getConversationHistory(sessionId, includeSystem = false) {
  // Query for role condition based on includeSystem parameter
  const roleCondition = includeSystem ? 
    { role: { $in: ['user', 'assistant', 'system'] } } : 
    { role: { $in: ['user', 'assistant'] } };
  
  // Find all messages for the session
  const messages = await ChatMessage.find({
    sessionId,
    ...roleCondition
  })
  .sort({ timestamp: 1 })
  .limit(MAX_HISTORY_LENGTH)
  .lean();
  
  return messages;
}

/**
 * Get the formatted conversation messages for sending to the API
 * @param {string} sessionId - Unique identifier for the conversation
 * @returns {Array} - Array of message objects ready for the API
 */
export async function getFormattedConversationMessages(sessionId) {
  const messages = await getConversationHistory(sessionId, true);
  
  // If no system message found, add the default one
  if (!messages.some(msg => msg.role === 'system')) {
    messages.unshift({
      role: 'system',
      content: SYSTEM_MESSAGE.content
    });
  }
  
  // Format messages for API (pick only what's needed)
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
}

/**
 * Clear the conversation history for a session
 * @param {string} sessionId - Unique identifier for the conversation
 */
export async function clearConversationHistory(sessionId) {
  // Keep the session but delete all messages except system
  await ChatMessage.deleteMany({
    sessionId,
    role: { $ne: 'system' }
  });
  
  // Update session timestamp
  await ChatSession.updateOne(
    { sessionId },
    { updatedAt: new Date() }
  );
}

/**
 * Get all active conversation sessions for a user
 * @param {string} userId - MongoDB User ID
 * @returns {Array} - Array of session objects
 */
export async function getUserSessions(userId) {
  return await ChatSession.find({ 
    userId,
    isActive: true
  })
  .sort({ updatedAt: -1 })
  .lean();
}

/**
 * Get session details by sessionId
 * @param {string} sessionId - Unique session identifier 
 * @returns {Object} - Session details
 */
export async function getSessionById(sessionId) {
  return await ChatSession.findOne({ sessionId }).lean();
}

/**
 * Delete a chat session
 * @param {string} sessionId - Unique session identifier
 */
export async function deleteSession(sessionId) {
  // Mark session as inactive instead of deleting
  await ChatSession.updateOne(
    { sessionId },
    { 
      isActive: false,
      updatedAt: new Date() 
    }
  );
}

/**
 * Rename a chat session
 * @param {string} sessionId - Unique session identifier
 * @param {string} newTitle - New title for the session
 */
export async function renameSession(sessionId, newTitle) {
  await ChatSession.updateOne(
    { sessionId },
    { 
      title: newTitle,
      updatedAt: new Date() 
    }
  );
}

/**
 * Get the system message used for all conversations
 * @returns {Object} - System message object
 */
export function getSystemMessage() {
  return SYSTEM_MESSAGE;
}

/**
 * Get total number of conversations stored for a user
 * @param {string} userId - MongoDB User ID
 * @returns {number} - Number of active conversations
 */
export async function getConversationCount(userId) {
  return await ChatSession.countDocuments({ userId, isActive: true });
}