const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Content = require('../models/Content');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

// @route   GET /api/content
// @desc    Get all content sections
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const content = await Content.find({ is_active: true })
      .sort({ order_index: 1 });

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/content/:section
// @desc    Get content by section
// @access  Public
router.get('/:section', optionalAuth, async (req, res) => {
  try {
    const content = await Content.findOne({
      section: req.params.section,
      is_active: true
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content section not found'
      });
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Get content section error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/content
// @desc    Create or update content section (admin only)
// @access  Private/Admin
router.post('/',
  authenticateToken,
  requireAdmin,
  [
    body('section').isIn(['brand-voice', 'messaging', 'strategy-positioning']).withMessage('Invalid section'),
    body('title').trim().notEmpty().withMessage('Title is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { section, title, content, order_index } = req.body;

      // Upsert - create or update
      const contentDoc = await Content.findOneAndUpdate(
        { section },
        {
          section,
          title,
          content: content || '',
          order_index: order_index || 0,
          updated_by: req.user._id
        },
        { new: true, upsert: true, runValidators: true }
      );

      res.json({
        success: true,
        data: contentDoc
      });
    } catch (error) {
      console.error('Create/update content error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// @route   PUT /api/content/:section
// @desc    Update content section (admin only)
// @access  Private/Admin
router.put('/:section',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { title, content, order_index, is_active } = req.body;

      const updateData = { updated_by: req.user._id };
      if (title) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (order_index !== undefined) updateData.order_index = order_index;
      if (is_active !== undefined) updateData.is_active = is_active;

      const contentDoc = await Content.findOneAndUpdate(
        { section: req.params.section },
        updateData,
        { new: true, runValidators: true }
      );

      if (!contentDoc) {
        return res.status(404).json({
          success: false,
          message: 'Content section not found'
        });
      }

      res.json({
        success: true,
        data: contentDoc
      });
    } catch (error) {
      console.error('Update content error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// @route   DELETE /api/content/:section
// @desc    Delete content section (admin only)
// @access  Private/Admin
router.delete('/:section',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const contentDoc = await Content.findOneAndDelete({
        section: req.params.section
      });

      if (!contentDoc) {
        return res.status(404).json({
          success: false,
          message: 'Content section not found'
        });
      }

      res.json({
        success: true,
        message: 'Content section deleted successfully'
      });
    } catch (error) {
      console.error('Delete content error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

module.exports = router;
