/**
 * Chat history management utility
 * Provides functions for managing conversation history in memory
 * In a production app, you'd want to use a database like MongoDB or Redis
 */

// Map to store chat history by session ID
const chatHistories = new Map();

// Maximum number of messages to keep per conversation (excluding system message)
const MAX_HISTORY_LENGTH = 20;

// System message that sets the personality and capabilities of the AI
const SYSTEM_MESSAGE = {
  role: 'system',
  content: `You are a helpful, friendly, and knowledgeable AI assistant. Your name is AI Assistant.

Instructions:
- Answer questions accurately and completely, citing sources when applicable
- Be conversational and friendly, but remain professional
- If asked about something you don't know, admit it rather than making up information
- When responding to code questions, provide working examples when possible
- Be concise in your answers, but provide enough detail to be helpful
- Stay updated with information as of 2024
- For complex questions, break down your answer into easy-to-understand parts

Remember to keep track of the conversation context and reference earlier parts of the conversation when relevant.`
};

/**
 * Add a message to a conversation history
 * @param {string} sessionId - Unique identifier for the conversation
 * @param {Object} message - Message object with role and content
 */
export function addMessageToHistory(sessionId, message) {
  if (!chatHistories.has(sessionId)) {
    chatHistories.set(sessionId, []);
  }
  
  const history = chatHistories.get(sessionId);
  history.push(message);
  
  // Trim history if it exceeds maximum length
  if (history.length > MAX_HISTORY_LENGTH) {
    history.shift(); // Remove oldest message
  }
}

/**
 * Get the conversation history for a session
 * @param {string} sessionId - Unique identifier for the conversation
 * @param {boolean} includeSystem - Whether to include the system message
 * @returns {Array} - Array of message objects
 */
export function getConversationHistory(sessionId, includeSystem = false) {
  const history = chatHistories.has(sessionId) ? [...chatHistories.get(sessionId)] : [];
  
  // Return history with system message if requested
  return includeSystem ? [SYSTEM_MESSAGE, ...history] : history;
}

/**
 * Get the formatted conversation messages for sending to the API
 * @param {string} sessionId - Unique identifier for the conversation
 * @returns {Array} - Array of message objects ready for the API
 */
export function getFormattedConversationMessages(sessionId) {
  return [SYSTEM_MESSAGE, ...getConversationHistory(sessionId)];
}

/**
 * Clear the conversation history for a session
 * @param {string} sessionId - Unique identifier for the conversation
 */
export function clearConversationHistory(sessionId) {
  chatHistories.delete(sessionId);
}

/**
 * Get all active conversation session IDs
 * @returns {Array} - Array of session IDs
 */
export function getAllSessionIds() {
  return [...chatHistories.keys()];
}

/**
 * Get the system message used for all conversations
 * @returns {Object} - System message object
 */
export function getSystemMessage() {
  return SYSTEM_MESSAGE;
}

/**
 * Get total number of conversations stored
 * @returns {number} - Number of active conversations
 */
export function getConversationCount() {
  return chatHistories.size;
}
