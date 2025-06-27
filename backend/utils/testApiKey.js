import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Testing utility to verify OpenRouter API key
 */
async function testApiKey() {
  console.log("Testing OpenRouter API key...");
  
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error("\x1b[31m%s\x1b[0m", "ERROR: No API key found in environment variables");
    console.log("Make sure you have a valid OPENROUTER_API_KEY in your .env file");
    process.exit(1);
  }
  
  if (!apiKey.startsWith('sk-or-')) {
    console.warn("\x1b[33m%s\x1b[0m", "WARNING: API key format may be invalid. OpenRouter keys typically start with 'sk-or-'");
  }
  
  console.log("API Key found:", `${apiKey.substring(0, 10)}...`);
  
  try {
    // Initialize the OpenAI client with OpenRouter base URL
    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:5000',
        'X-Title': 'API Key Test',
      },
    });
    
    // Make a simple test call
    console.log("Making test API call...");
    
    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello! This is a test.' }],
      max_tokens: 10,
    });
    
    console.log("\x1b[32m%s\x1b[0m", "SUCCESS! API key is valid.");
    console.log("Response:", completion.choices[0].message.content);
    
  } catch (error) {
    console.error("\x1b[31m%s\x1b[0m", "ERROR: API key validation failed");
    console.error("Error message:", error.message);
    console.error("Status code:", error.status);
    
    if (error.status === 401) {
      console.log("\nTroubleshooting tips:");
      console.log("1. Check if your API key is correct and not expired");
      console.log("2. Verify that you have credit in your OpenRouter account");
      console.log("3. Try generating a new API key in the OpenRouter dashboard");
    }
    
    process.exit(1);
  }
}

// Execute the test
testApiKey();
