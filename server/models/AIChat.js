import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content cannot be empty'],
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const aiChatSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Chat session must be linked to a user account'],
    index: true
  },
  messages: {
    type: [chatMessageSchema],
    default: []
  },
  context: {
    type: String,
    trim: true,
    default: '' // e.g., 'financial analytics tab context'
  }
}, {
  timestamps: true
});

// Index chat sessions by user, owner, and activity
aiChatSchema.index({ owner: 1, createdAt: -1 });
aiChatSchema.index({ userId: 1, updatedAt: -1 });

const AIChat = mongoose.model('AIChat', aiChatSchema);
export default AIChat;
