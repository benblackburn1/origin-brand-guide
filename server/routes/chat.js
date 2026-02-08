const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const ChatConversation = require('../models/ChatConversation');
const User = require('../models/User');
const { processChat } = require('../services/chatService');

// @route   POST /api/chat
// @desc    Send a message and get AI response
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { conversationId, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Load or create conversation
    let conversation;
    if (conversationId) {
      conversation = await ChatConversation.findOne({
        _id: conversationId,
        user: req.user._id
      });
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }
    } else {
      // Create new conversation with title from first message
      const title = message.length > 60 ? message.substring(0, 57) + '...' : message;
      conversation = await ChatConversation.create({
        user: req.user._id,
        title,
        messages: []
      });
    }

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: message.trim()
    });

    // Get user's Google tokens for tool execution
    const user = await User.findById(req.user._id).select('+googleTokens');
    const googleTokens = user?.googleTokens || null;

    // Build messages array for Claude (full conversation history)
    const conversationMessages = conversation.messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    // Process with Claude
    const response = await processChat(conversationMessages, googleTokens);

    // Add assistant response
    conversation.messages.push({
      role: 'assistant',
      content: response.content,
      tool_calls: response.tool_calls || []
    });

    await conversation.save();

    res.json({
      success: true,
      conversationId: conversation._id,
      message: {
        role: 'assistant',
        content: response.content,
        tool_calls: response.tool_calls || []
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process message'
    });
  }
});

// @route   GET /api/chat/conversations
// @desc    List user's conversations
// @access  Private
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const conversations = await ChatConversation.find({
      user: req.user._id,
      is_active: true
    })
      .select('title messages createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(50);

    // Return with message count and last message preview
    const data = conversations.map(c => ({
      _id: c._id,
      title: c.title,
      messageCount: c.messages.length,
      lastMessage: c.messages.length > 0
        ? c.messages[c.messages.length - 1].content?.substring(0, 100)
        : null,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('List conversations error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/chat/conversations/:id
// @desc    Get full conversation
// @access  Private
router.get('/conversations/:id', authenticateToken, async (req, res) => {
  try {
    const conversation = await ChatConversation.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.json({ success: true, data: conversation });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/chat/conversations/:id
// @desc    Delete conversation
// @access  Private
router.delete('/conversations/:id', authenticateToken, async (req, res) => {
  try {
    const conversation = await ChatConversation.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
