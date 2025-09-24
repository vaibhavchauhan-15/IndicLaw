/**
 * Chat history migration utility
 * Helps migrate in-memory chat histories to MongoDB
 */
import { v4 as uuidv4 } from 'uuid';
import { 
  getAllSessionIds,
  getConversationHistory as getInMemoryConversationHistory 
} from './chatHistory.js';
import { 
  createChatSession,
  addMessageToHistory 
} from './chatHistoryDB.js';

/**
 * Migrate all in-memory chat histories to the database
 * @param {string} userId - MongoDB User ID to associate with these sessions
 * @returns {Object} - Migration results
 */
export async function migrateAllChatHistories(userId) {
  const sessionIds = getAllSessionIds();
  const results = {
    total: sessionIds.length,
    migrated: 0,
    failed: 0,
    details: []
  };
  
  for (const oldSessionId of sessionIds) {
    try {
      // Create a new session in the database
      const session = await createChatSession(
        userId, 
        `Migrated Conversation ${new Date().toLocaleString()}`
      );
      
      // Get all messages from memory
      const messages = getInMemoryConversationHistory(oldSessionId, false);
      
      // Add each message to the database
      for (const message of messages) {
        await addMessageToHistory(session.sessionId, message);
      }
      
      results.migrated++;
      results.details.push({
        oldSessionId,
        newSessionId: session.sessionId,
        messageCount: messages.length,
        status: 'success'
      });
    } catch (error) {
      results.failed++;
      results.details.push({
        oldSessionId,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Migrate a specific in-memory chat history to the database
 * @param {string} oldSessionId - In-memory session ID to migrate
 * @param {string} userId - MongoDB User ID to associate with this session
 * @param {string} title - Optional title for the new session
 * @returns {Object} - Migration result
 */
export async function migrateChatHistory(oldSessionId, userId, title) {
  try {
    // Create a new session in the database
    const session = await createChatSession(
      userId, 
      title || `Migrated Conversation ${new Date().toLocaleString()}`
    );
    
    // Get all messages from memory
    const messages = getInMemoryConversationHistory(oldSessionId, false);
    
    // Add each message to the database
    for (const message of messages) {
      await addMessageToHistory(session.sessionId, message);
    }
    
    return {
      status: 'success',
      oldSessionId,
      newSessionId: session.sessionId,
      messageCount: messages.length
    };
  } catch (error) {
    return {
      status: 'failed',
      oldSessionId,
      error: error.message
    };
  }
}