/**
 * MongoDB migration script
 * Run this script to initialize collections and indexes
 */
import mongoose from 'mongoose';
import { User, ChatSession, ChatMessage, Document, UserPreference } from './models/index.js';
import config from './config/index.js';
import { migrateAllChatHistories } from './utils/chatHistoryMigration.js';

async function runMigrations() {
  console.log('Starting database migrations...');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB');
    
    // Check and create indexes
    console.log('Creating indexes...');
    await createIndexes();
    
    // Run additional migrations
    console.log('Running migrations...');
    await migrateData();
    
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

async function createIndexes() {
  // Already defined in the schema but this ensures they exist
  await ChatMessage.collection.createIndex({ sessionId: 1, timestamp: 1 });
  await Document.collection.createIndex({ userId: 1, isDeleted: 1 });
  await ChatSession.collection.createIndex({ userId: 1, isActive: 1 });
  await ChatSession.collection.createIndex({ sessionId: 1 }, { unique: true });
  
  console.log('Indexes created successfully');
}

async function migrateData() {
  // Check if we have any users
  const userCount = await User.countDocuments();
  
  if (userCount === 0) {
    console.log('No users found, skipping chat history migration');
    return;
  }
  
  // Get the first user (for demo purposes - in production you'd handle this differently)
  const firstUser = await User.findOne();
  
  if (firstUser) {
    console.log(`Migrating in-memory chat histories for user ${firstUser.email}...`);
    
    try {
      // Migrate in-memory chat histories
      const migrationResults = await migrateAllChatHistories(firstUser._id);
      
      console.log(`Migration results: ${migrationResults.migrated} migrated, ${migrationResults.failed} failed`);
    } catch (error) {
      console.error('Chat history migration failed:', error);
    }
  }
}

// Run the migrations
runMigrations();