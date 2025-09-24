/**
 * User preference service for handling user preferences
 */
import { UserPreference } from '../models/index.js';

/**
 * Get or create user preferences
 * @param {string} userId - MongoDB User ID
 * @returns {Object} - User preferences
 */
export async function getUserPreferences(userId) {
  let preferences = await UserPreference.findOne({ userId });
  
  // Create default preferences if not found
  if (!preferences) {
    preferences = new UserPreference({ userId });
    await preferences.save();
  }
  
  return preferences;
}

/**
 * Update user preferences
 * @param {string} userId - MongoDB User ID
 * @param {Object} updates - Fields to update
 * @returns {Object} - Updated preferences
 */
export async function updateUserPreferences(userId, updates) {
  // Get existing preferences
  const preferences = await getUserPreferences(userId);
  
  // Update fields
  Object.keys(updates).forEach(key => {
    // Skip userId field
    if (key === 'userId') return;
    
    // Handle nested fields like notifications.email
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      if (preferences[parent]) {
        preferences[parent][child] = updates[key];
      }
    } else {
      preferences[key] = updates[key];
    }
  });
  
  // Save changes
  await preferences.save();
  
  return preferences;
}

/**
 * Update user language preference
 * @param {string} userId - MongoDB User ID
 * @param {string} language - Preferred language
 * @returns {Object} - Updated preferences
 */
export async function updateUserLanguage(userId, language) {
  return await updateUserPreferences(userId, { language });
}

/**
 * Update user theme preference
 * @param {string} userId - MongoDB User ID
 * @param {string} theme - Preferred theme
 * @returns {Object} - Updated preferences
 */
export async function updateUserTheme(userId, theme) {
  return await updateUserPreferences(userId, { theme });
}

/**
 * Get user's preferred language
 * @param {string} userId - MongoDB User ID
 * @returns {string} - Preferred language
 */
export async function getUserLanguage(userId) {
  const preferences = await getUserPreferences(userId);
  return preferences.language;
}

/**
 * Reset user preferences to defaults
 * @param {string} userId - MongoDB User ID
 * @returns {Object} - Reset preferences
 */
export async function resetUserPreferences(userId) {
  // Delete existing preferences
  await UserPreference.deleteOne({ userId });
  
  // Create new default preferences
  const preferences = new UserPreference({ userId });
  await preferences.save();
  
  return preferences;
}