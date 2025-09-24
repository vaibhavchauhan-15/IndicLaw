/**
 * Models index file
 * Exports all database models from a central location
 */

import User from './user.js';
import ChatSession from './chatSession.js';
import ChatMessage from './chatMessage.js';
import Document from './document.js';
import UserPreference from './userPreference.js';

export {
  User,
  ChatSession,
  ChatMessage,
  Document,
  UserPreference
};

export default {
  User,
  ChatSession,
  ChatMessage,
  Document,
  UserPreference
};