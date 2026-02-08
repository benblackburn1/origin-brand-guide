const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const BrandTool = require('../models/BrandTool');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { uploadToMemory, handleUploadError } = require('../middleware/upload');
const { uploadToGCS, deleteFromGCS, isGCSConfigured } = require('../config/storage');

// @route   GET /api/tools
// @desc    Get all active tools
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const filter = req.user?.role === 'admin' ? {} : { is_active: true };

    const tools = await BrandTool.find(filter)
      .sort({ order_index: 1 })
      .select('-html_code -css_code -js_code')
      .populate('created_by', 'username');

    res.json({
      success: true,
      data: tools
    });
  } catch (error) {
    console.error('Get tools error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/tools/:id
// @desc    Get tool by ID (includes code for admin)
// @access  Public/Private
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const tool = await BrandTool.findById(req.params.id)
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!tool) {
      return res.status(404).json({
        success: false,
        message: 'Tool not found'
      });
    }

    // Only admins can see inactive tools and code
    if (!tool.is_active && req.user?.role !== 'admin') {
      return res.status(404).json({
        success: false,
        message: 'Tool not found'
      });
    }

    // Non-admins don't get the code in API response (they use the tool page)
    const data = req.user?.role === 'admin' ? tool : {
      _id: tool._id,
      title: tool.title,
      description: tool.description,
      slug: tool.slug,
      preview_url: tool.preview_url,
      is_active: tool.is_active,
      order_index: tool.order_index,
      createdAt: tool.createdAt
    };

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get tool error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/tools/slug/:slug
// @desc    Get tool by slug
// @access  Public
router.get('/slug/:slug', async (req, res) => {
  try {
    const tool = await BrandTool.findOne({
      slug: req.params.slug,
      is_active: true
    });

    if (!tool) {
      return res.status(404).json({
        success: false,
        message: 'Tool not found'
      });
    }

    res.json({
      success: true,
      data: tool
    });
  } catch (error) {
    console.error('Get tool by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/tools
// @desc    Create new tool (admin only)
// @access  Private/Admin
router.post('/',
  authenticateToken,
  requireAdmin,
  uploadToMemory.single('preview'),
  handleUploadError,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('slug')
      .optional()
      .trim()
      .matches(/^[a-z0-9-]+$/)
      .withMessage('Slug can only contain lowercase letters, numbers, and hyphens')
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

      const { title, description, slug, html_code, css_code, js_code, is_active } = req.body;
      const previewFile = req.file;

      // Check for duplicate slug
      const generatedSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const existingTool = await BrandTool.findOne({ slug: generatedSlug });
      if (existingTool) {
        return res.status(400).json({
          success: false,
          message: 'A tool with this slug already exists'
        });
      }

      // Get max order index
      const maxOrder = await BrandTool.findOne()
        .sort({ order_index: -1 })
        .select('order_index');
      const order_index = (maxOrder?.order_index || 0) + 1;

      let preview_url = null;
      let preview_gcs_path = null;

      if (previewFile && isGCSConfigured()) {
        const uploadedPreview = await uploadToGCS(previewFile, 'tool-previews');
        preview_url = uploadedPreview.publicUrl;
        preview_gcs_path = uploadedPreview.fileName;
      }

      // Create tool
      const tool = await BrandTool.create({
        title,
        description,
        slug: generatedSlug,
        html_code: html_code || '',
        css_code: css_code || '',
        js_code: js_code || '',
        preview_url,
        preview_gcs_path,
        is_active: is_active !== 'false',
        order_index,
        created_by: req.user._id,
        updated_by: req.user._id
      });

      res.status(201).json({
        success: true,
        data: tool
      });
    } catch (error) {
      console.error('Create tool error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// @route   PUT /api/tools/:id
// @desc    Update tool (admin only)
// @access  Private/Admin
router.put('/:id',
  authenticateToken,
  requireAdmin,
  uploadToMemory.single('preview'),
  handleUploadError,
  async (req, res) => {
    try {
      const tool = await BrandTool.findById(req.params.id);

      if (!tool) {
        return res.status(404).json({
          success: false,
          message: 'Tool not found'
        });
      }

      const {
        title,
        description,
        slug,
        html_code,
        css_code,
        js_code,
        is_active,
        order_index
      } = req.body;
      const previewFile = req.file;

      // Update fields
      if (title) tool.title = title;
      if (description !== undefined) tool.description = description;
      if (slug && slug !== tool.slug) {
        // Check for duplicate slug
        const existingTool = await BrandTool.findOne({ slug, _id: { $ne: tool._id } });
        if (existingTool) {
          return res.status(400).json({
            success: false,
            message: 'A tool with this slug already exists'
          });
        }
        tool.slug = slug;
      }
      if (html_code !== undefined) tool.html_code = html_code;
      if (css_code !== undefined) tool.css_code = css_code;
      if (js_code !== undefined) tool.js_code = js_code;
      if (is_active !== undefined) tool.is_active = is_active === 'true' || is_active === true;
      if (order_index !== undefined) tool.order_index = parseInt(order_index);

      // Handle preview upload
      if (previewFile && isGCSConfigured()) {
        if (tool.preview_gcs_path) {
          try {
            await deleteFromGCS(tool.preview_gcs_path);
          } catch (e) {
            console.error('Failed to delete old preview:', e);
          }
        }

        const uploadedPreview = await uploadToGCS(previewFile, 'tool-previews');
        tool.preview_url = uploadedPreview.publicUrl;
        tool.preview_gcs_path = uploadedPreview.fileName;
      }

      tool.updated_by = req.user._id;
      await tool.save();

      res.json({
        success: true,
        data: tool
      });
    } catch (error) {
      console.error('Update tool error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// @route   DELETE /api/tools/:id
// @desc    Delete tool (admin only)
// @access  Private/Admin
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const tool = await BrandTool.findById(req.params.id);

    if (!tool) {
      return res.status(404).json({
        success: false,
        message: 'Tool not found'
      });
    }

    // Delete preview from GCS
    if (tool.preview_gcs_path && isGCSConfigured()) {
      try {
        await deleteFromGCS(tool.preview_gcs_path);
      } catch (e) {
        console.error('Failed to delete preview:', e);
      }
    }

    await tool.deleteOne();

    res.json({
      success: true,
      message: 'Tool deleted successfully'
    });
  } catch (error) {
    console.error('Delete tool error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/tools/reorder
// @desc    Reorder tools (admin only)
// @access  Private/Admin
router.put('/reorder', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required'
      });
    }

    const bulkOps = items.map(item => ({
      updateOne: {
        filter: { _id: item.id },
        update: { order_index: item.order_index }
      }
    }));

    await BrandTool.bulkWrite(bulkOps);

    res.json({
      success: true,
      message: 'Tools reordered successfully'
    });
  } catch (error) {
    console.error('Reorder tools error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
