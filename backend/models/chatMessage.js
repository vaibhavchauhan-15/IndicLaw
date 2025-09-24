import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: [true, 'Session ID is required'],
    index: true
  },
  role: {
    type: String,
    enum: ['system', 'user', 'assistant'],
    required: [true, 'Role is required']
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: Object,
    default: {}
  },
  tokens: {
    type: Number,
    default: 0 // Track token usage
  },
  attachments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }]
});

// Create compound index for efficient queries
chatMessageSchema.index({ sessionId: 1, timestamp: 1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;