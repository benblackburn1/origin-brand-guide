const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const ColorPalette = require('../models/ColorPalette');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

// @route   GET /api/colors
// @desc    Get all color palettes
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const palettes = await ColorPalette.find({ is_active: true })
      .sort({ order_index: 1 });

    res.json({
      success: true,
      data: palettes
    });
  } catch (error) {
    console.error('Get color palettes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/colors/:category
// @desc    Get color palette by category
// @access  Public
router.get('/:category', optionalAuth, async (req, res) => {
  try {
    const palette = await ColorPalette.findOne({
      category: req.params.category,
      is_active: true
    });

    if (!palette) {
      return res.status(404).json({
        success: false,
        message: 'Color palette not found'
      });
    }

    res.json({
      success: true,
      data: palette
    });
  } catch (error) {
    console.error('Get color palette error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/colors
// @desc    Create or update color palette (admin only)
// @access  Private/Admin
router.post('/',
  authenticateToken,
  requireAdmin,
  [
    body('category').isIn(['primary', 'secondary', 'tertiary']).withMessage('Invalid category'),
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

      const { category, title, description, colors, order_index } = req.body;

      // Upsert - create or update
      const palette = await ColorPalette.findOneAndUpdate(
        { category },
        {
          category,
          title,
          description,
          colors: colors || [],
          order_index: order_index || 0,
          updated_by: req.user._id
        },
        { new: true, upsert: true, runValidators: true }
      );

      res.json({
        success: true,
        data: palette
      });
    } catch (error) {
      console.error('Create/update color palette error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// @route   PUT /api/colors/:category
// @desc    Update color palette (admin only)
// @access  Private/Admin
router.put('/:category',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { title, description, colors, order_index, is_active } = req.body;

      const updateData = { updated_by: req.user._id };
      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (colors) updateData.colors = colors;
      if (order_index !== undefined) updateData.order_index = order_index;
      if (is_active !== undefined) updateData.is_active = is_active;

      const palette = await ColorPalette.findOneAndUpdate(
        { category: req.params.category },
        updateData,
        { new: true, runValidators: true }
      );

      if (!palette) {
        return res.status(404).json({
          success: false,
          message: 'Color palette not found'
        });
      }

      res.json({
        success: true,
        data: palette
      });
    } catch (error) {
      console.error('Update color palette error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// @route   POST /api/colors/:category/color
// @desc    Add a color to palette (admin only)
// @access  Private/Admin
router.post('/:category/color',
  authenticateToken,
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Color name is required'),
    body('hex').matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Invalid hex color')
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

      const { name, hex, rgb, cmyk, pantone } = req.body;

      const palette = await ColorPalette.findOne({ category: req.params.category });

      if (!palette) {
        return res.status(404).json({
          success: false,
          message: 'Color palette not found'
        });
      }

      // Get next order index
      const maxOrder = palette.colors.reduce((max, c) => Math.max(max, c.order_index || 0), 0);

      palette.colors.push({
        name,
        hex,
        rgb,
        cmyk,
        pantone,
        order_index: maxOrder + 1
      });

      palette.updated_by = req.user._id;
      await palette.save();

      res.json({
        success: true,
        data: palette
      });
    } catch (error) {
      console.error('Add color error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// @route   PUT /api/colors/:category/color/:colorId
// @desc    Update a color in palette (admin only)
// @access  Private/Admin
router.put('/:category/color/:colorId',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const palette = await ColorPalette.findOne({ category: req.params.category });

      if (!palette) {
        return res.status(404).json({
          success: false,
          message: 'Color palette not found'
        });
      }

      const color = palette.colors.id(req.params.colorId);
      if (!color) {
        return res.status(404).json({
          success: false,
          message: 'Color not found'
        });
      }

      const { name, hex, rgb, cmyk, pantone, order_index } = req.body;

      if (name) color.name = name;
      if (hex) color.hex = hex;
      if (rgb) color.rgb = rgb;
      if (cmyk) color.cmyk = cmyk;
      if (pantone !== undefined) color.pantone = pantone;
      if (order_index !== undefined) color.order_index = order_index;

      palette.updated_by = req.user._id;
      await palette.save();

      res.json({
        success: true,
        data: palette
      });
    } catch (error) {
      console.error('Update color error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// @route   DELETE /api/colors/:category/color/:colorId
// @desc    Delete a color from palette (admin only)
// @access  Private/Admin
router.delete('/:category/color/:colorId',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const palette = await ColorPalette.findOne({ category: req.params.category });

      if (!palette) {
        return res.status(404).json({
          success: false,
          message: 'Color palette not found'
        });
      }

      palette.colors.pull(req.params.colorId);
      palette.updated_by = req.user._id;
      await palette.save();

      res.json({
        success: true,
        data: palette
      });
    } catch (error) {
      console.error('Delete color error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// @route   PUT /api/colors/:category/reorder
// @desc    Reorder colors in palette (admin only)
// @access  Private/Admin
router.put('/:category/reorder',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { items } = req.body; // Array of { id, order_index }

      if (!Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          message: 'Items array is required'
        });
      }

      const palette = await ColorPalette.findOne({ category: req.params.category });

      if (!palette) {
        return res.status(404).json({
          success: false,
          message: 'Color palette not found'
        });
      }

      // Update order for each color
      for (const item of items) {
        const color = palette.colors.id(item.id);
        if (color) {
          color.order_index = item.order_index;
        }
      }

      palette.updated_by = req.user._id;
      await palette.save();

      res.json({
        success: true,
        data: palette
      });
    } catch (error) {
      console.error('Reorder colors error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

module.exports = router;
