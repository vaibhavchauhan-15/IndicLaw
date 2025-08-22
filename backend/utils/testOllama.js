/**
 * Test script to check if Ollama is running and accessible
 * Run with: node utils/testOllama.js
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Main function to test Ollama connectivity
 */
async function testOllama() {
  try {
    console.log("===================================");
    console.log("🔍 Testing Ollama Connectivity");
    console.log("===================================");
    
    const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
    console.log("Ollama Host:", ollamaHost);
    
    // Get available models
    const modelsUrl = `${ollamaHost}/api/tags`;
    console.log(`\n📋 Trying to connect to Ollama API at: ${modelsUrl}`);
    
    // Check if Ollama is running by listing models
    const modelsResponse = await fetch(modelsUrl);
    
    if (!modelsResponse.ok) {
      throw new Error(`Failed to connect to Ollama API: ${modelsResponse.status} ${modelsResponse.statusText}`);
    }
    
    const modelsText = await modelsResponse.text();
    let models;
    try {
      models = JSON.parse(modelsText);
    } catch (e) {
      console.error("Failed to parse JSON response:", e);
      console.error("Raw response:", modelsText);
      throw new Error("Invalid JSON response from Ollama API");
    }
    
    if (!models.models || !Array.isArray(models.models)) {
      console.log("Unexpected response format:", models);
      throw new Error("Unexpected response format from Ollama API");
    }
    
    console.log("✅ Successfully connected to Ollama!");
    console.log(`\n📊 Found ${models.models.length} models:`);
    
    // Print out model info
    models.models.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name} (${(model.size / (1024 * 1024 * 1024)).toFixed(2)} GB)`);
    });

    // Update .env file with an available model
    if (models.models.length > 0) {
      const firstModel = models.models[0].name;
      console.log(`\n✍️ Updating DEFAULT_MODEL in .env to use available model: ${firstModel}`);
      
      // We'll let the user do this manually
      console.log(`👉 Please update your .env file to set DEFAULT_MODEL=${firstModel}`);
    }

    // Try a simple completion test
    const firstAvailableModel = models.models.length > 0 ? models.models[0].name : null;
    
    if (firstAvailableModel) {
      console.log(`\n🚀 Testing model '${firstAvailableModel}' with a simple query...`);
      
      try {
        const completionResponse = await fetch(`${ollamaHost}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: firstAvailableModel,
            prompt: "Say hello to IndicLaw in a short, friendly way.",
            stream: false
          }),
        });
        
        if (!completionResponse.ok) {
          const errorText = await completionResponse.text();
          throw new Error(`Failed to get completion: ${completionResponse.status} - ${errorText}`);
        }
        
        const completionText = await completionResponse.text();
        let completion;
        try {
          completion = JSON.parse(completionText);
          console.log("\n💬 Model Response:");
          console.log(completion.response);
        } catch (e) {
          console.error("Error parsing completion response:", e);
          console.error("Raw response:", completionText);
          throw new Error("Invalid JSON in completion response");
        }
      } catch (completionError) {
        console.error("Error testing completion:", completionError.message);
        console.log("Skipping completion test, but connectivity to Ollama API is confirmed.");
      }
    }
    
    console.log("\n✅ Ollama API connectivity test completed successfully!");
    console.log("===================================");
    
  } catch (error) {
    console.error("\n❌ Error testing Ollama connection:");
    console.error(error.message);
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('Failed to connect')) {
      console.error("\n👉 Possible reasons for connection failure:");
      console.error("- Ollama may not be running. Start it with 'ollama serve' command.");
      console.error("- Check if Ollama is running on the correct host and port.");
      console.error("- Make sure your OLLAMA_HOST in .env is set correctly (default is http://localhost:11434).");
      console.error("- Check for firewall or network restrictions blocking the connection.");
    } else if (error.message.includes('not found') || error.message.includes('model not found')) {
      console.error("\n👉 Possible reason for error:");
      console.error("- The specified model may not be pulled/installed in your Ollama instance.");
      console.error("- Try pulling the model first with 'ollama pull llama3' (or other model name).");
    }
    
    console.error("\n❗ Test failed. Please fix the issues above before continuing.");
    process.exit(1);
  }
}

// Run the test
testOllama();

// Run the test
testOllama();

// Run the test
testOllama();
