const mongoose = require('mongoose');

const fileVariantSchema = new mongoose.Schema({
  file_type: {
    type: String,
    required: true,
    enum: ['PNG', 'SVG', 'JPG', 'EPS', 'PDF', 'OTF', 'TTF', 'WOFF', 'GIF', 'MP4', 'WEBM']
  },
  file_url: {
    type: String,
    required: true
  },
  gcs_path: {
    type: String
  },
  file_size: {
    type: Number
  }
}, { _id: true });

const brandAssetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      // Logo categories
      'logo-primary',
      'logo-secondary',
      'logomark',
      // Typography categories
      'typography-hierarchy',
      'font-primary',
      'font-secondary',
      'font-tertiary',
      // Other asset categories
      'imagery',
      'icons',
      'patterns',
      'other'
    ]
  },
  section: {
    type: String,
    required: true,
    enum: ['logos', 'typography', 'imagery', 'other'],
    default: 'other'
  },
  // Multiple file variants (PNG, SVG, EPS, etc.)
  files: [fileVariantSchema],
  // Preview image for display
  preview_url: {
    type: String
  },
  preview_gcs_path: {
    type: String
  },
  // For videos/GIFs
  preview_type: {
    type: String,
    enum: ['image', 'video', 'gif'],
    default: 'image'
  },
  // For multi-page documents (like PDFs)
  page_count: {
    type: Number,
    default: 1
  },
  // Tags for filtering
  tags: [{
    type: String,
    trim: true
  }],
  // Order within category for drag-and-drop reordering
  order_index: {
    type: Number,
    default: 0
  },
  // Metadata
  is_active: {
    type: Boolean,
    default: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient queries
brandAssetSchema.index({ category: 1, order_index: 1 });
brandAssetSchema.index({ section: 1, order_index: 1 });
brandAssetSchema.index({ tags: 1 });
brandAssetSchema.index({ is_active: 1 });

module.exports = mongoose.model('BrandAsset', brandAssetSchema);
