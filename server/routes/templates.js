const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const BrandTemplate = require('../models/BrandTemplate');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { uploadToMemory, handleUploadError, getFileType } = require('../middleware/upload');
const { uploadToGCS, generateSignedUrl, deleteFromGCS, isGCSConfigured } = require('../config/storage');

// @route   GET /api/templates
// @desc    Get all templates
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { tag, type } = req.query;
    const filter = { is_active: true };

    if (tag) {
      filter.tags = { $in: Array.isArray(tag) ? tag : [tag] };
    }
    if (type) {
      filter.template_type = type;
    }

    const templates = await BrandTemplate.find(filter)
      .sort({ order_index: 1 })
      .populate('created_by', 'username');

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/templates/tags
// @desc    Get all unique tags
// @access  Public
router.get('/tags', optionalAuth, async (req, res) => {
  try {
    const tags = await BrandTemplate.distinct('tags', { is_active: true });
    res.json({
      success: true,
      data: tags.filter(Boolean).sort()
    });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/templates/:id
// @desc    Get single template
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const template = await BrandTemplate.findById(req.params.id)
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/templates/:id/download
// @desc    Get signed URL for downloading template file
// @access  Public
router.get('/:id/download', optionalAuth, async (req, res) => {
  try {
    const template = await BrandTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    if (!template.file_url) {
      return res.status(400).json({
        success: false,
        message: 'Template has no downloadable file'
      });
    }

    // If GCS path exists, generate signed URL
    if (template.gcs_path && isGCSConfigured()) {
      const signedUrl = await generateSignedUrl(template.gcs_path, 60);
      return res.json({
        success: true,
        data: {
          url: signedUrl,
          expires_in: 60
        }
      });
    }

    // Return external link or direct URL
    res.json({
      success: true,
      data: {
        url: template.external_link || template.file_url,
        expires_in: null
      }
    });
  } catch (error) {
    console.error('Download template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/templates
// @desc    Create new template (admin only)
// @access  Private/Admin
router.post('/',
  authenticateToken,
  requireAdmin,
  uploadToMemory.fields([
    { name: 'file', maxCount: 1 },
    { name: 'preview', maxCount: 1 }
  ]),
  handleUploadError,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('template_type').notEmpty().withMessage('Template type is required')
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

      const { title, description, template_type, external_link, tags } = req.body;
      const templateFile = req.files?.file?.[0];
      const previewFile = req.files?.preview?.[0];

      // Get max order index
      const maxOrder = await BrandTemplate.findOne()
        .sort({ order_index: -1 })
        .select('order_index');
      const order_index = (maxOrder?.order_index || 0) + 1;

      let file_url = null;
      let gcs_path = null;
      let file_size = null;
      let preview_url = null;
      let preview_gcs_path = null;

      if (isGCSConfigured()) {
        // Upload template file
        if (templateFile) {
          const uploaded = await uploadToGCS(templateFile, 'templates');
          file_url = uploaded.publicUrl;
          gcs_path = uploaded.fileName;
          file_size = templateFile.size;
        }

        // Upload preview
        if (previewFile) {
          const uploadedPreview = await uploadToGCS(previewFile, 'previews');
          preview_url = uploadedPreview.publicUrl;
          preview_gcs_path = uploadedPreview.fileName;
        }
      }

      // Create template
      const template = await BrandTemplate.create({
        title,
        description,
        template_type,
        external_link,
        file_url,
        gcs_path,
        file_size,
        preview_url,
        preview_gcs_path,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
        order_index,
        created_by: req.user._id,
        updated_by: req.user._id
      });

      res.status(201).json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Create template error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// @route   PUT /api/templates/:id
// @desc    Update template (admin only)
// @access  Private/Admin
router.put('/:id',
  authenticateToken,
  requireAdmin,
  uploadToMemory.fields([
    { name: 'file', maxCount: 1 },
    { name: 'preview', maxCount: 1 }
  ]),
  handleUploadError,
  async (req, res) => {
    try {
      const template = await BrandTemplate.findById(req.params.id);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      const { title, description, template_type, external_link, tags, order_index, is_active } = req.body;
      const templateFile = req.files?.file?.[0];
      const previewFile = req.files?.preview?.[0];

      // Update basic fields
      if (title) template.title = title;
      if (description !== undefined) template.description = description;
      if (template_type) template.template_type = template_type;
      if (external_link !== undefined) template.external_link = external_link;
      if (tags) {
        template.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
      }
      if (order_index !== undefined) template.order_index = parseInt(order_index);
      if (is_active !== undefined) template.is_active = is_active === 'true' || is_active === true;

      // Handle file upload
      if (templateFile && isGCSConfigured()) {
        // Delete old file
        if (template.gcs_path) {
          try {
            await deleteFromGCS(template.gcs_path);
          } catch (e) {
            console.error('Failed to delete old file:', e);
          }
        }

        const uploaded = await uploadToGCS(templateFile, 'templates');
        template.file_url = uploaded.publicUrl;
        template.gcs_path = uploaded.fileName;
        template.file_size = templateFile.size;
      }

      // Handle preview upload
      if (previewFile && isGCSConfigured()) {
        if (template.preview_gcs_path) {
          try {
            await deleteFromGCS(template.preview_gcs_path);
          } catch (e) {
            console.error('Failed to delete old preview:', e);
          }
        }

        const uploadedPreview = await uploadToGCS(previewFile, 'previews');
        template.preview_url = uploadedPreview.publicUrl;
        template.preview_gcs_path = uploadedPreview.fileName;
      }

      template.updated_by = req.user._id;
      await template.save();

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Update template error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// @route   DELETE /api/templates/:id
// @desc    Delete template (admin only)
// @access  Private/Admin
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const template = await BrandTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Delete files from GCS
    if (isGCSConfigured()) {
      if (template.gcs_path) {
        try {
          await deleteFromGCS(template.gcs_path);
        } catch (e) {
          console.error('Failed to delete file:', e);
        }
      }
      if (template.preview_gcs_path) {
        try {
          await deleteFromGCS(template.preview_gcs_path);
        } catch (e) {
          console.error('Failed to delete preview:', e);
        }
      }
    }

    await template.deleteOne();

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/templates/reorder
// @desc    Reorder templates (admin only)
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

    await BrandTemplate.bulkWrite(bulkOps);

    res.json({
      success: true,
      message: 'Templates reordered successfully'
    });
  } catch (error) {
    console.error('Reorder templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
