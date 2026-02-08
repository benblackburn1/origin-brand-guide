const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { processBrandGuidelinesPDF } = require('../services/claudeService');
const ColorPalette = require('../models/ColorPalette');
const Content = require('../models/Content');
const BrandTemplate = require('../models/BrandTemplate');

// Configure multer for PDF and image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/guidelines');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'guideline-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files (PNG, JPG, GIF, WebP) are allowed'));
    }
  }
});

// @route   POST /api/brand-guidelines/upload-images
// @desc    Upload and process brand guidelines screenshots
// @access  Admin
router.post('/upload-images', authenticateToken, requireAdmin, upload.array('images', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image'
      });
    }

    console.log(`Processing ${req.files.length} brand guideline images`);

    const { extractBrandGuidelinesFromImages } = require('../services/claudeService');

    // Process images with Claude
    const extractedData = await extractBrandGuidelinesFromImages(req.files);

    // Save extracted data to database
    const savedData = await saveBrandGuidelines(extractedData);

    // Clean up uploaded files
    for (const file of req.files) {
      await fs.unlink(file.path);
    }

    res.json({
      success: true,
      message: 'Brand guidelines processed successfully',
      data: {
        extracted: extractedData,
        saved: savedData
      }
    });

  } catch (error) {
    console.error('Error processing brand guidelines:', error);

    // Clean up files if they exist
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to process brand guidelines',
      error: error.message
    });
  }
});

// @route   POST /api/brand-guidelines/upload
// @desc    Upload and process brand guidelines PDF
// @access  Admin
router.post('/upload', authenticateToken, requireAdmin, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a PDF file'
      });
    }

    console.log('Processing brand guidelines PDF:', req.file.filename);

    // Process PDF with Claude
    const extractedData = await processBrandGuidelinesPDF(req.file.path);

    // Save extracted data to database
    const savedData = await saveBrandGuidelines(extractedData);

    // Clean up uploaded file
    await fs.unlink(req.file.path);

    res.json({
      success: true,
      message: 'Brand guidelines processed successfully',
      data: {
        extracted: extractedData,
        saved: savedData
      }
    });

  } catch (error) {
    console.error('Error processing brand guidelines:', error);

    // Clean up file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to process brand guidelines',
      error: error.message
    });
  }
});

/**
 * Save extracted brand guidelines to database
 */
async function saveBrandGuidelines(extractedData) {
  const savedData = {
    colors: 0,
    fonts: 0,
    brandVoice: false,
    applications: 0
  };

  try {
    // Save Colors
    if (extractedData.colors && extractedData.colors.length > 0) {
      for (const color of extractedData.colors) {
        try {
          // Determine category
          const category = color.category || 'primary';

          // Check if palette exists for this category
          let palette = await ColorPalette.findOne({ category });

          if (!palette) {
            // Create new palette
            palette = new ColorPalette({
              category,
              name: `${category.charAt(0).toUpperCase() + category.slice(1)} Colors`,
              colors: []
            });
          }

          // Add color to palette
          palette.colors.push({
            name: color.name || 'Unnamed Color',
            hex: color.hex || '#000000',
            rgb: color.rgb || '',
            cmyk: color.cmyk || '',
            pantone: color.pantone || '',
            usage: color.usage || ''
          });

          await palette.save();
          savedData.colors++;
        } catch (error) {
          console.error('Error saving color:', error);
        }
      }
    }

    // Save Typography/Fonts
    if (extractedData.fonts && extractedData.fonts.length > 0) {
      try {
        const fontContent = extractedData.fonts.map(font => {
          return `### ${font.name}\n\n` +
            `**Weights**: ${font.weights.join(', ')}\n\n` +
            `**Usage**: ${font.usage}\n\n`;
        }).join('\n');

        await Content.findOneAndUpdate(
          { section: 'typography' },
          {
            section: 'typography',
            title: 'Typography',
            content: fontContent,
            order: 2
          },
          { upsert: true, new: true }
        );

        savedData.fonts = extractedData.fonts.length;
      } catch (error) {
        console.error('Error saving fonts:', error);
      }
    }

    // Save Brand Voice
    if (extractedData.brandVoice) {
      try {
        const voiceContent = `## Brand Personality\n\n${extractedData.brandVoice.personality.join(', ')}\n\n` +
          `## Tone of Voice\n\n${extractedData.brandVoice.tone}\n\n` +
          `## Key Messages\n\n${extractedData.brandVoice.messaging.map(m => `- ${m}`).join('\n')}\n\n` +
          `## Brand Values\n\n${extractedData.brandVoice.values.map(v => `- ${v}`).join('\n')}\n\n` +
          `## Communication Guidelines\n\n${extractedData.brandVoice.guidelines}`;

        await Content.findOneAndUpdate(
          { section: 'brand-voice' },
          {
            section: 'brand-voice',
            title: 'Brand Voice & Messaging',
            content: voiceContent,
            order: 3
          },
          { upsert: true, new: true }
        );

        savedData.brandVoice = true;
      } catch (error) {
        console.error('Error saving brand voice:', error);
      }
    }

    // Save Applications
    if (extractedData.applications && extractedData.applications.length > 0) {
      try {
        const applicationsContent = extractedData.applications.map(app => {
          return `### ${app.type}\n\n` +
            `**Description**: ${app.description}\n\n` +
            `**Guidelines**: ${app.guidelines}\n\n`;
        }).join('\n');

        await Content.findOneAndUpdate(
          { section: 'applications' },
          {
            section: 'applications',
            title: 'Brand Applications',
            content: applicationsContent,
            order: 4
          },
          { upsert: true, new: true }
        );

        savedData.applications = extractedData.applications.length;
      } catch (error) {
        console.error('Error saving applications:', error);
      }
    }

    return savedData;
  } catch (error) {
    console.error('Error saving brand guidelines:', error);
    throw error;
  }
}

// @route   GET /api/brand-guidelines/status
// @desc    Get Claude API status
// @access  Admin
router.get('/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

    res.json({
      success: true,
      data: {
        claudeEnabled: hasApiKey,
        apiKeyConfigured: hasApiKey
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check status'
    });
  }
});

module.exports = router;
