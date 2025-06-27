/**
 * API client configuration
 */

import { API_CONFIG } from './config';

// Get the API base URL from configuration
const API_BASE_URL = API_CONFIG.baseUrl;

/**
 * Check the API server health and configuration status
 * @returns Promise with health status information
 */
export async function checkApiHealth(): Promise<{
  status: string;
  apiKeyValid: boolean;
  apiKeyPresent: boolean;
  environment: string;
  timestamp: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`API health check failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error checking API health:', error);
    return {
      status: 'error',
      apiKeyValid: false,
      apiKeyPresent: false,
      environment: 'unknown',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send a chat message to the API
 * @param message The message text to send
 * @param conversationId Optional conversation ID
 * @param model Optional AI model to use
 * @returns Promise with the API response
 */
export async function sendChatMessage(
  message: string,
  conversationId?: string,
  model?: string
): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversationId,
        model,
      }),
    });

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
}

/**
 * Send a chat message with an image to the API
 * @param message The message text to send
 * @param imageUrl The URL of the image to analyze
 * @param conversationId Optional conversation ID
 * @param model Optional AI model to use (preferably models that support vision)
 * @returns Promise with the API response
 */
export async function sendChatWithImage(
  message: string,
  imageUrl: string,
  conversationId?: string,
  model: string = 'google/gemini-2.5-pro-exp-03-25' // Default to Gemini Pro which has good vision capabilities
): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        imageUrl,
        conversationId,
        model,
      }),
    });

    if (!response.ok) {
      throw new Error(`Chat with image API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending chat with image:', error);
    throw error;
  }
}

/**
 * Upload a file to be processed with the chat
 * @param file The file to upload
 * @param message Optional message to send with the file
 * @param conversationId Optional conversation ID
 * @returns Promise with the API response
 */
export async function uploadFileWithChat(
  file: File,
  message?: string,
  conversationId?: string
): Promise<any> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    if (message) {
      formData.append('message', message);
    }
    
    if (conversationId) {
      formData.append('conversationId', conversationId);
    }

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`File upload API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading file with chat:', error);
    throw error;
  }
}
