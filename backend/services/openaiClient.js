import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// List of available models
export const AI_MODELS = {
  GPT4O: 'openai/gpt-4o',
  GPT35TURBO: 'openai/gpt-3.5-turbo', // Use the base model name for better compatibility
  CLAUDE3HAIKU: 'anthropic/claude-3-haiku',
  LLAMA3: 'meta-llama/llama-3-8b-instruct',
  // Fallback models (lower cost)
  MISTRAL: 'mistralai/mistral-7b-instruct-v0.2',
  GEMMA: 'google/gemma-7b-it',
};

/**
 * Get appropriate settings for a specific model
 * @param {string} model - The model identifier
 * @returns {Object} Model-specific settings
 */
export const getModelSettings = (model) => {
  // Get model family
  const isOpenAI = model.startsWith('openai/');
  const isAnthropic = model.startsWith('anthropic/');
  const isMistral = model.startsWith('mistralai/');
  const isLlama = model.startsWith('meta-llama/');
  const isGemma = model.startsWith('google/gemma');
  
  // Default settings
  const settings = {
    maxTokens: 800,
    temperature: 0.7,
    presencePenalty: 0.3,
    frequencyPenalty: 0.3
  };
  
  // Model-specific adjustments
  if (model === AI_MODELS.GPT4O) {
    settings.maxTokens = 700; // Reduced limit for GPT4o to save credits
  } else if (isAnthropic) {
    settings.maxTokens = 700;
    settings.temperature = 0.7;
  } else if (isMistral || isLlama || isGemma) {
    settings.maxTokens = 600; // More conservative for open models
    settings.temperature = 0.7;
  }
  
  return settings;
};

/**
 * Calculate the appropriate max_tokens value based on the input message length
 * This helps prevent errors when credit limits are reached
 * 
 * @param {Array} messages - The array of message objects
 * @param {number} maxLimit - The maximum token limit to consider
 * @returns {number} - The appropriate max_tokens value
 */
export const calculateMaxTokens = (messages, maxLimit = 800) => {
  // Calculate approximate input token count (very rough estimate)
  const messageText = messages.map(msg => msg.content || '').join(' ');
  const estimatedInputTokens = Math.ceil(messageText.length / 4); // ~4 chars per token as rough estimate
  
  // Calculate safe response token count (leave margin for error)
  const safeMaxTokens = Math.max(300, maxLimit - Math.min(estimatedInputTokens, maxLimit - 200));
  
  // Return the calculated value, with 800 as the absolute max
  return Math.min(safeMaxTokens, maxLimit);
};

/**
 * Initialize and configure the OpenAI client
 * @returns {Object} Configured OpenAI client
 */
const initializeOpenAI = () => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const refererUrl = process.env.REFERER_URL || 'http://localhost:5000';
  const siteTitle = process.env.SITE_TITLE || 'AI Chatbot';

  // Log configuration status
  console.log("OpenRouter API Key present:", !!apiKey);
  console.log("Referer URL:", refererUrl);
  console.log("Site Title:", siteTitle);

  // Validate the API key
  if (!apiKey) {
    console.error("⚠️ OpenRouter API key is missing. Make sure to set OPENROUTER_API_KEY in your .env file");
  }

  // Default to 60 seconds timeout, but allow configuration through env variable
  const timeoutMs = parseInt(process.env.API_TIMEOUT_MS || '60000', 10);
  console.log("API Timeout:", timeoutMs, "ms");

  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: apiKey || 'placeholder-for-development',
    defaultHeaders: {
      'HTTP-Referer': refererUrl,
      'X-Title': siteTitle,
    },
    timeout: timeoutMs, // Set the timeout for axios requests
    maxRetries: 1, // Allow 1 retry by default from the OpenAI client itself
  });
};

const openai = initializeOpenAI();

export default openai;
