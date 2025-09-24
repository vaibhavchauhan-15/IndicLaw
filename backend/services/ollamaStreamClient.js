import fetch from 'node-fetch';
import { getModelSettings } from './ollamaClient.js';
import { AI_MODELS } from './ollamaClient.js';
import config from '../config/index.js';

/**
 * Creates a streaming chat completion with Ollama
 * 
 * @param {Object} params - Parameters for streaming
 * @param {string} params.model - The model to use
 * @param {Array} params.messages - Array of message objects
 * @param {number} params.max_tokens - Maximum tokens to generate
 * @param {number} params.temperature - Temperature for generation
 * @param {Function} params.onChunk - Optional callback for each chunk
 * @param {Response} res - Express response object to write stream chunks to
 * @returns {Promise<string>} - Promise that resolves to the full response text
 */
export async function createStreamingCompletion(params, res) {
  const { model, messages, max_tokens, temperature, onChunk } = params;
  const ollamaHost = config.ollama?.host || 'http://localhost:11434';
  
  // Validate messages is an array
  if (!Array.isArray(messages)) {
    console.error('Messages is not an array:', messages);
    throw new Error('messages.reduce is not a function: Invalid messages format');
  }
  
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
  
  console.log("Sending streaming prompt to Ollama:", prompt.substring(0, 100) + "...");
  
  try {
    // Call Ollama's API using the generate endpoint with streaming enabled
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
        stream: true
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama streaming API error (${response.status}): ${errorText}`);
    }
    
    // Process the stream response
    if (!response.body) {
      throw new Error('Response body is null');
    }
    
    return new Promise((resolve, reject) => {
      let fullResponse = '';
      
      // Handle data chunks
      response.body.on('data', (chunk) => {
        // Convert Buffer to string
        const chunkStr = chunk.toString();
        
        // Ollama returns multiple JSON objects separated by newlines
        const jsonChunks = chunkStr.split('\n').filter(line => line.trim());
        
        for (const jsonChunk of jsonChunks) {
          try {
            const parsed = JSON.parse(jsonChunk);
            
            if (parsed.response) {
              fullResponse += parsed.response;
              
              // Send the chunk to the client
              res.write(`data: ${JSON.stringify({ content: parsed.response })}\n\n`);
              
              // Call onChunk callback if provided
              if (typeof onChunk === 'function') {
                onChunk({
                  content: parsed.response,
                  done: false
                });
              }
            }
          } catch (e) {
            console.error('Error parsing JSON chunk:', e);
            console.error('Problematic chunk:', jsonChunk);
          }
        }
      });
      
      // Handle end of stream
      response.body.on('end', () => {
        console.log('Streaming completed');
        
        // Call onChunk callback if provided with done=true
        if (typeof onChunk === 'function') {
          onChunk({
            content: fullResponse,
            done: true
          });
        }
        
        resolve(fullResponse);
      });
      
      // Handle stream errors
      response.body.on('error', (err) => {
        console.error('Stream error:', err);
        reject(err);
      });
    });
  } catch (error) {
    console.error('Ollama streaming error:', error);
    throw error;
  }
}
