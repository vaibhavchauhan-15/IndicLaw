import fetch from 'node-fetch';
import config from '../config/index.js';

/**
 * Available AI models for the application
 */
export const AI_MODELS = {
  GEMMA: 'gemma3:4b',
  MISTRAL: 'mistral:7b',
  INDIAN_LAW: 'kartikm7/indian-lawen2-1.5b'
};

/**
 * Get model-specific settings (context window, token limits, etc.)
 * 
 * @param {string} model - The model identifier
 * @returns {Object} - Model settings object
 */
export function getModelSettings(model) {
  // Default settings
  const defaults = {
    contextWindow: 4096,
    maxTokensDefault: 1024,
    maxTokensLimit: 2048,
    temperature: 0.7
  };
  
  // Model-specific settings
  const settings = {
    [AI_MODELS.GEMMA]: {
      contextWindow: 8192,
      maxTokensDefault: 2048,
      maxTokensLimit: 4096,
      temperature: 0.7
    },
    [AI_MODELS.MISTRAL]: {
      contextWindow: 8192,
      maxTokensDefault: 2048, 
      maxTokensLimit: 4096,
      temperature: 0.7
    },
    [AI_MODELS.INDIAN_LAW]: {
      contextWindow: 4096,
      maxTokensDefault: 1024,
      maxTokensLimit: 2048,
      temperature: 0.7
    }
  };
  
  return settings[model] || defaults;
}

/**
 * Calculate the maximum tokens to generate based on model and input length
 * 
 * @param {string} model - The model identifier
 * @param {Array} messages - Array of message objects
 * @returns {number} - Maximum tokens to generate
 */
export function calculateMaxTokens(model, messages) {
  const settings = getModelSettings(model);
  
  // Handle if messages is not an array
  if (!Array.isArray(messages)) {
    console.error('Messages is not an array in calculateMaxTokens:', messages);
    return settings.maxTokensDefault || 1024; // Return a default value
  }
  
  try {
    // Rough approximation of input tokens based on characters
    // A more accurate token counting would require a tokenizer
    const inputLength = messages.reduce((total, msg) => {
      return total + ((msg && msg.content) ? msg.content.length : 0);
    }, 0);
    const estimatedInputTokens = Math.ceil(inputLength / 4); // Rough estimate: 4 chars ≈ 1 token
    
    // Calculate available tokens
    const availableTokens = Math.max(0, settings.contextWindow - estimatedInputTokens);
    
    // Use default if enough tokens available, otherwise cap at available tokens
    return Math.min(settings.maxTokensDefault, availableTokens, settings.maxTokensLimit);
  } catch (error) {
    console.error('Error calculating max tokens:', error);
    return settings.maxTokensDefault || 1024; // Return a default value
  }
}

/**
 * Create a chat completion with Ollama
 * 
 * @param {Object} params - Parameters for completion
 * @param {string} params.model - The model to use
 * @param {Array} params.messages - Array of message objects
 * @param {number} params.max_tokens - Maximum tokens to generate
 * @param {number} params.temperature - Temperature for generation
 * @returns {Promise<Object>} - Promise that resolves to the completion response
 */
export async function createChatCompletion(params) {
  const { model, messages, max_tokens, temperature } = params;
  const ollamaHost = config.ollama?.host || 'http://localhost:11434';
  
  // Extract just the model name if it has a provider prefix
  const modelName = model.includes('/') ? model.split('/')[1] : model;
  
  // Convert the message array to a prompt
  let prompt = "";
  
  // Process the messages into a prompt format Ollama can understand
  // Skip system messages as they're handled differently in different models
  const userMessages = messages.filter(msg => msg.role !== 'system');
  
  // Extract system messages separately and prepend to the prompt
  const systemMessages = messages.filter(msg => msg.role === 'system');
  if (systemMessages.length > 0) {
    prompt += "Instructions: " + systemMessages.map(msg => msg.content).join("\n") + "\n\n";
  }
  
  // Add user/assistant conversation
  let lastRole = null;
  for (const msg of userMessages) {
    if (msg.role === 'user') {
      prompt += (lastRole === 'user' ? "\n" : "") + "User: " + msg.content + "\n";
    } else if (msg.role === 'assistant') {
      prompt += (lastRole === 'assistant' ? "\n" : "") + "Assistant: " + msg.content + "\n";
    }
    lastRole = msg.role;
  }
  
  // Add the final prompt for the assistant's response
  if (lastRole !== 'user') {
    prompt += "\nUser: " + userMessages[userMessages.length - 1].content + "\n";
  }
  prompt += "Assistant: ";
  
  console.log("Sending prompt to Ollama:", prompt.substring(0, 100) + "...");
  
  try {
    // Call Ollama's API using the generate endpoint
    const response = await fetch(`${ollamaHost}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        prompt: prompt,
        options: {
          num_predict: max_tokens,
          temperature: temperature,
          top_p: 0.9,
        },
        stream: false
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    
    return {
      model: model,
      object: 'chat.completion',
      choices: [
        {
          message: {
            role: 'assistant',
            content: data.response
          }
        }
      ]
    };
  } catch (error) {
    console.error('Ollama error:', error);
    throw error;
  }
}

export default {
  AI_MODELS,
  getModelSettings,
  calculateMaxTokens,
  createChatCompletion
};
