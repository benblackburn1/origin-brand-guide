const mongoose = require('mongoose');

const toolCallSchema = new mongoose.Schema({
  tool: { type: String, required: true },
  input: { type: mongoose.Schema.Types.Mixed },
  result: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant']
  },
  content: {
    type: String,
    default: ''
  },
  tool_calls: [toolCallSchema],
  created_at: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const chatConversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'New Conversation'
  },
  messages: [messageSchema],
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

chatConversationSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model('ChatConversation', chatConversationSchema);
