const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const BrandAsset = require('../models/BrandAsset');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { uploadToMemory, handleUploadError, getFileType } = require('../middleware/upload');
const { uploadToGCS, generateSignedUrl, deleteFromGCS, isGCSConfigured } = require('../config/storage');
const { generatePreview, isProcessableImage } = require('../utils/imageProcessor');

// @route   GET /api/assets
// @desc    Get all assets (grouped by category)
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { section, category } = req.query;
    const filter = { is_active: true };

    if (section) filter.section = section;
    if (category) filter.category = category;

    const assets = await BrandAsset.find(filter)
      .sort({ section: 1, category: 1, order_index: 1 })
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.json({
      success: true,
      data: assets
    });
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/assets/grouped
// @desc    Get assets grouped by section and category
// @access  Public
router.get('/grouped', optionalAuth, async (req, res) => {
  try {
    const assets = await BrandAsset.find({ is_active: true })
      .sort({ order_index: 1 });

    // Group assets by section and category
    const grouped = assets.reduce((acc, asset) => {
      if (!acc[asset.section]) {
        acc[asset.section] = {};
      }
      if (!acc[asset.section][asset.category]) {
        acc[asset.section][asset.category] = [];
      }
      acc[asset.section][asset.category].push(asset);
      return acc;
    }, {});

    res.json({
      success: true,
      data: grouped
    });
  } catch (error) {
    console.error('Get grouped assets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/assets/for-tools
// @desc    Get brand assets in a format optimized for embedded tools
// @access  Public (tools need to access this from iframes)
router.get('/for-tools', async (req, res) => {
  try {
    const ColorPalette = require('../models/ColorPalette');

    const [assets, colorPalettes] = await Promise.all([
      BrandAsset.find({ is_active: true }).sort({ order_index: 1 }),
      ColorPalette.find({})
    ]);

    // Group assets by section and category
    const grouped = assets.reduce((acc, asset) => {
      if (!acc[asset.section]) acc[asset.section] = {};
      if (!acc[asset.section][asset.category]) acc[asset.section][asset.category] = [];

      acc[asset.section][asset.category].push({
        id: asset._id,
        title: asset.title,
        description: asset.description,
        preview_url: asset.preview_url,
        files: asset.files.map(f => ({
          type: f.file_type,
          url: f.file_url
        }))
      });
      return acc;
    }, {});

    // Flatten colors from all palettes
    const colors = colorPalettes.flatMap(palette => palette.colors || []);

    res.json({
      success: true,
      data: {
        assets: grouped,
        colors: colors,
        imagery: grouped.imagery?.imagery || [],
        icons: grouped.imagery?.icons || [],
        patterns: grouped.imagery?.patterns || [],
        logos: grouped.logos || {}
      }
    });
  } catch (error) {
    console.error('Get assets for tools error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/assets/:id
// @desc    Get single asset
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const asset = await BrandAsset.findById(req.params.id)
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    res.json({
      success: true,
      data: asset
    });
  } catch (error) {
    console.error('Get asset error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/assets/:id/download/:fileIndex
// @desc    Stream file download from GCS
// @access  Public
router.get('/:id/download/:fileIndex', optionalAuth, async (req, res) => {
  try {
    const asset = await BrandAsset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    const fileIndex = parseInt(req.params.fileIndex);
    if (fileIndex < 0 || fileIndex >= asset.files.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file index'
      });
    }

    const file = asset.files[fileIndex];

    // If GCS path exists and GCS is configured, stream from GCS
    if (file.gcs_path && isGCSConfigured()) {
      try {
        const { getBucket } = require('../config/storage');
        const bucket = getBucket();
        const gcsFile = bucket.file(file.gcs_path);

        // Check if file exists
        const [exists] = await gcsFile.exists();
        if (!exists) {
          console.error('File not found in GCS:', file.gcs_path);
          return res.status(404).json({
            success: false,
            message: 'File not found in storage'
          });
        }

        // Get file metadata
        const [metadata] = await gcsFile.getMetadata();

        // Set response headers for download
        const fileName = file.gcs_path.split('/').pop();
        res.setHeader('Content-Type', metadata.contentType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', metadata.size);
        res.setHeader('Cache-Control', 'no-cache');

        // Stream the file directly to the response
        gcsFile.createReadStream()
          .on('error', (err) => {
            console.error('Stream error:', err);
            if (!res.headersSent) {
              res.status(500).json({
                success: false,
                message: 'Error streaming file'
              });
            }
          })
          .pipe(res);

      } catch (gcsError) {
        console.error('GCS download error:', gcsError);
        return res.status(500).json({
          success: false,
          message: 'Error downloading file from storage'
        });
      }
    } else if (file.file_url && file.file_url.startsWith('http')) {
      // If it's a public URL, redirect to it
      return res.redirect(file.file_url);
    } else {
      // For local files or other cases, return error as files should be in GCS
      console.error('File not in GCS and no valid public URL:', file);
      return res.status(404).json({
        success: false,
        message: 'File download not available. Please re-upload this asset.'
      });
    }
  } catch (error) {
    console.error('Download asset error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
});

// @route   POST /api/assets/bulk-logo
// @desc    Bulk upload logo files from a folder (admin only)
// @access  Private/Admin
router.post('/bulk-logo',
  authenticateToken,
  requireAdmin,
  uploadToMemory.array('logoFiles', 20),
  handleUploadError,
  [
    body('title').trim().notEmpty().withMessage('Logo title is required'),
    body('category').optional().default('logo-primary'),
    body('description').optional()
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

      const { title, description, category = 'logo-primary', tags } = req.body;
      const uploadedFiles = req.files || [];

      if (uploadedFiles.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      // Get max order index for this category
      const maxOrder = await BrandAsset.findOne({ category })
        .sort({ order_index: -1 })
        .select('order_index');
      const order_index = (maxOrder?.order_index || 0) + 1;

      // Upload files to GCS or store locally
      const files = [];
      let preview_url = null;
      let preview_gcs_path = null;
      let pngFile = null;
      let fallbackImageFile = null;

      if (isGCSConfigured()) {
        // Upload all files to Google Cloud Storage
        for (const file of uploadedFiles) {
          const uploaded = await uploadToGCS(file, `logos/${category}`);
          files.push({
            file_type: getFileType(file),
            file_url: uploaded.publicUrl,
            gcs_path: uploaded.fileName,
            file_size: file.size
          });

          // Prioritize PNG files for preview, fallback to any processable image
          if (!pngFile && file.mimetype === 'image/png') {
            pngFile = file;
          }
          if (!fallbackImageFile && isProcessableImage(file.mimetype)) {
            fallbackImageFile = file;
          }
        }

        // Generate preview from PNG file (or fallback to first image)
        const previewSourceFile = pngFile || fallbackImageFile;
        if (previewSourceFile) {
          const previewBuffer = await generatePreview(previewSourceFile.buffer, {
            width: 640,
            height: 480,
            paddingLeft: 80,
            paddingRight: 80,
            paddingTop: 0,
            paddingBottom: 0
          });
          const previewUpload = await uploadToGCS({
            buffer: previewBuffer,
            originalname: `preview-${Date.now()}.png`,
            mimetype: 'image/png',
            size: previewBuffer.length
          }, 'previews');
          preview_url = previewUpload.publicUrl;
          preview_gcs_path = previewUpload.fileName;
        }
      } else {
        // Fallback: store file URLs (would need local storage implementation)
        for (const file of uploadedFiles) {
          files.push({
            file_type: getFileType(file),
            file_url: `/uploads/${Date.now()}-${file.originalname}`,
            file_size: file.size
          });
        }
      }

      // Create asset with all file variants
      const asset = await BrandAsset.create({
        title,
        description: description || `${title} logo in multiple file formats`,
        category,
        section: 'logos',
        files,
        preview_url,
        preview_gcs_path,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
        order_index,
        created_by: req.user._id,
        updated_by: req.user._id
      });

      res.status(201).json({
        success: true,
        data: asset,
        message: `Successfully uploaded ${files.length} file variants`
      });
    } catch (error) {
      console.error('Bulk logo upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during bulk upload'
      });
    }
  }
);

// @route   POST /api/assets
// @desc    Create new asset (admin only)
// @access  Private/Admin
router.post('/',
  authenticateToken,
  requireAdmin,
  uploadToMemory.fields([
    { name: 'files', maxCount: 10 },
    { name: 'preview', maxCount: 1 }
  ]),
  handleUploadError,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('section').notEmpty().withMessage('Section is required')
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

      const { title, description, category, section, tags } = req.body;
      const uploadedFiles = req.files?.files || [];
      const previewFile = req.files?.preview?.[0];

      // Upload files to GCS or store locally
      const files = [];
      let preview_url = null;
      let preview_gcs_path = null;

      if (isGCSConfigured()) {
        // Upload to Google Cloud Storage
        for (const file of uploadedFiles) {
          const uploaded = await uploadToGCS(file, `assets/${category}`);
          files.push({
            file_type: getFileType(file),
            file_url: uploaded.publicUrl,
            gcs_path: uploaded.fileName,
            file_size: file.size
          });
        }

        // Handle preview
        if (previewFile) {
          const uploadedPreview = await uploadToGCS(previewFile, 'previews');
          preview_url = uploadedPreview.publicUrl;
          preview_gcs_path = uploadedPreview.fileName;
        } else if (uploadedFiles.length > 0 && isProcessableImage(uploadedFiles[0].mimetype)) {
          // Generate preview from first image
          const previewBuffer = await generatePreview(uploadedFiles[0].buffer);
          const previewUpload = await uploadToGCS({
            buffer: previewBuffer,
            originalname: `preview-${Date.now()}.png`,
            mimetype: 'image/png',
            size: previewBuffer.length
          }, 'previews');
          preview_url = previewUpload.publicUrl;
          preview_gcs_path = previewUpload.fileName;
        }
      } else {
        // Fallback: store file URLs (would need local storage implementation)
        for (const file of uploadedFiles) {
          files.push({
            file_type: getFileType(file),
            file_url: `/uploads/${Date.now()}-${file.originalname}`,
            file_size: file.size
          });
        }
      }

      // Check for existing asset with same title and category
      const existingAsset = await BrandAsset.findOne({ title, category });

      if (existingAsset) {
        // Check for duplicate file types
        const newFileTypes = files.map(f => f.file_type);
        const existingFileTypes = existingAsset.files.map(f => f.file_type);
        const duplicateTypes = newFileTypes.filter(t => existingFileTypes.includes(t));

        if (duplicateTypes.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Duplicate file type(s): ${duplicateTypes.join(', ')} already exist for "${title}". Remove the existing file type first or upload a different format.`
          });
        }

        // Merge new files into existing asset
        existingAsset.files.push(...files);
        if (preview_url && !existingAsset.preview_url) {
          existingAsset.preview_url = preview_url;
          existingAsset.preview_gcs_path = preview_gcs_path;
        }
        if (description && !existingAsset.description) {
          existingAsset.description = description;
        }
        existingAsset.updated_by = req.user._id;
        await existingAsset.save();

        return res.status(200).json({
          success: true,
          data: existingAsset,
          message: `Added ${files.length} file(s) to existing asset "${title}"`
        });
      }

      // Get max order index for this category
      const maxOrder = await BrandAsset.findOne({ category })
        .sort({ order_index: -1 })
        .select('order_index');
      const order_index = (maxOrder?.order_index || 0) + 1;

      // Create new asset
      const asset = await BrandAsset.create({
        title,
        description,
        category,
        section,
        files,
        preview_url,
        preview_gcs_path,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
        order_index,
        created_by: req.user._id,
        updated_by: req.user._id
      });

      res.status(201).json({
        success: true,
        data: asset
      });
    } catch (error) {
      console.error('Create asset error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// @route   PUT /api/assets/:id
// @desc    Update asset (admin only)
// @access  Private/Admin
router.put('/:id',
  authenticateToken,
  requireAdmin,
  uploadToMemory.fields([
    { name: 'files', maxCount: 10 },
    { name: 'preview', maxCount: 1 }
  ]),
  handleUploadError,
  async (req, res) => {
    try {
      const asset = await BrandAsset.findById(req.params.id);

      if (!asset) {
        return res.status(404).json({
          success: false,
          message: 'Asset not found'
        });
      }

      const { title, description, category, section, tags, order_index } = req.body;
      const uploadedFiles = req.files?.files || [];
      const previewFile = req.files?.preview?.[0];

      // Update basic fields
      if (title) asset.title = title;
      if (description !== undefined) asset.description = description;
      if (category) asset.category = category;
      if (section) asset.section = section;
      if (tags) {
        asset.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
      }
      if (order_index !== undefined) asset.order_index = parseInt(order_index);

      // Handle new file uploads
      if (uploadedFiles.length > 0 && isGCSConfigured()) {
        for (const file of uploadedFiles) {
          const uploaded = await uploadToGCS(file, `assets/${asset.category}`);
          asset.files.push({
            file_type: getFileType(file),
            file_url: uploaded.publicUrl,
            gcs_path: uploaded.fileName,
            file_size: file.size
          });
        }
      }

      // Handle preview upload
      if (previewFile && isGCSConfigured()) {
        // Delete old preview
        if (asset.preview_gcs_path) {
          try {
            await deleteFromGCS(asset.preview_gcs_path);
          } catch (e) {
            console.error('Failed to delete old preview:', e);
          }
        }

        const uploadedPreview = await uploadToGCS(previewFile, 'previews');
        asset.preview_url = uploadedPreview.publicUrl;
        asset.preview_gcs_path = uploadedPreview.fileName;
      }

      asset.updated_by = req.user._id;
      await asset.save();

      res.json({
        success: true,
        data: asset
      });
    } catch (error) {
      console.error('Update asset error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// @route   DELETE /api/assets/:id/files/:fileId
// @desc    Delete a specific file from asset (admin only)
// @access  Private/Admin
router.delete('/:id/files/:fileId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const asset = await BrandAsset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    const file = asset.files.id(req.params.fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete from GCS
    if (file.gcs_path && isGCSConfigured()) {
      try {
        await deleteFromGCS(file.gcs_path);
      } catch (e) {
        console.error('Failed to delete from GCS:', e);
      }
    }

    // Remove file from array
    asset.files.pull(req.params.fileId);
    asset.updated_by = req.user._id;
    await asset.save();

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/assets/:id
// @desc    Delete asset (admin only)
// @access  Private/Admin
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const asset = await BrandAsset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Delete files from GCS
    if (isGCSConfigured()) {
      for (const file of asset.files) {
        if (file.gcs_path) {
          try {
            await deleteFromGCS(file.gcs_path);
          } catch (e) {
            console.error('Failed to delete from GCS:', e);
          }
        }
      }

      // Delete preview
      if (asset.preview_gcs_path) {
        try {
          await deleteFromGCS(asset.preview_gcs_path);
        } catch (e) {
          console.error('Failed to delete preview:', e);
        }
      }
    }

    await asset.deleteOne();

    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/assets/reorder
// @desc    Reorder assets within a category (admin only)
// @access  Private/Admin
router.put('/reorder', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { items } = req.body; // Array of { id, order_index }

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required'
      });
    }

    // Update order for each item
    const bulkOps = items.map(item => ({
      updateOne: {
        filter: { _id: item.id },
        update: { order_index: item.order_index }
      }
    }));

    await BrandAsset.bulkWrite(bulkOps);

    res.json({
      success: true,
      message: 'Assets reordered successfully'
    });
  } catch (error) {
    console.error('Reorder assets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
