import mongoose from 'mongoose';

const userPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  language: {
    type: String,
    enum: ['english', 'hindi', 'punjabi', 'gujarati', 'bengali', 'tamil', 'telugu', 'marathi', 'kannada', 'malayalam', 'urdu'],
    default: 'english'
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system'
  },
  defaultModel: {
    type: String,
    default: null // Will use system default if not specified
  },
  maxTokens: {
    type: Number,
    default: 2000
  },
  temperature: {
    type: Number,
    min: 0,
    max: 2,
    default: 0.7
  },
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    app: {
      type: Boolean, 
      default: true
    }
  },
  responseFormat: {
    type: String,
    enum: ['markdown', 'html', 'plain'],
    default: 'markdown'
  },
  chatDefaults: {
    showTimestamps: {
      type: Boolean,
      default: true
    },
    showTokenCounts: {
      type: Boolean,
      default: false
    }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
userPreferenceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const UserPreference = mongoose.model('UserPreference', userPreferenceSchema);

export default UserPreference;