const express = require('express');
const router = express.Router();
const BrandConfig = require('../models/BrandConfig');
const BrandAsset = require('../models/BrandAsset');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

// @route   GET /api/brand-config
// @desc    Get brand configuration (public)
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    let config = await BrandConfig.findOne({ key: 'general' })
      .populate('homepage_hero_image_id');

    if (!config) {
      // Return default empty config
      return res.json({
        success: true,
        data: {
          homepage_hero_image_id: null,
          homepage_hero_image_url: null,
          description: null
        }
      });
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Get brand config error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/brand-config
// @desc    Update brand configuration
// @access  Admin only
router.put('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { homepage_hero_image_id, description, settings } = req.body;

    const updateData = {
      key: 'general',
      updated_by: req.user._id
    };

    if (homepage_hero_image_id !== undefined) {
      updateData.homepage_hero_image_id = homepage_hero_image_id || null;

      // Also store the URL directly for faster access
      if (homepage_hero_image_id) {
        const asset = await BrandAsset.findById(homepage_hero_image_id);
        if (asset) {
          updateData.homepage_hero_image_url = asset.preview_url || asset.files?.[0]?.file_url;
        }
      } else {
        updateData.homepage_hero_image_url = null;
      }
    }

    if (description !== undefined) updateData.description = description;
    if (settings !== undefined) updateData.settings = settings;

    const config = await BrandConfig.findOneAndUpdate(
      { key: 'general' },
      updateData,
      { new: true, upsert: true, runValidators: true }
    ).populate('homepage_hero_image_id');

    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Update brand config error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/brand-config/imagery-options
// @desc    Get available imagery assets for homepage background selection
// @access  Admin only
router.get('/imagery-options', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const imageryAssets = await BrandAsset.find({
      section: 'imagery',
      category: { $in: ['imagery', 'patterns'] },
      is_active: true
    }).select('_id title preview_url files').sort({ order_index: 1 });

    res.json({ success: true, data: imageryAssets });
  } catch (error) {
    console.error('Get imagery options error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
