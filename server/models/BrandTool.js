const mongoose = require('mongoose');

const brandToolSchema = new mongoose.Schema({
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
  // URL-friendly slug for the tool route
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  // Custom HTML/CSS/JS code
  html_code: {
    type: String,
    default: ''
  },
  css_code: {
    type: String,
    default: ''
  },
  js_code: {
    type: String,
    default: ''
  },
  // Preview image for the tools listing
  preview_url: {
    type: String
  },
  preview_gcs_path: {
    type: String
  },
  // Enable/disable tool
  is_active: {
    type: Boolean,
    default: true
  },
  // Order for display
  order_index: {
    type: Number,
    default: 0
  },
  // Metadata
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

// Indexes
brandToolSchema.index({ slug: 1 });
brandToolSchema.index({ order_index: 1 });
brandToolSchema.index({ is_active: 1 });

// Pre-save hook to generate slug from title if not provided
brandToolSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

module.exports = mongoose.model('BrandTool', brandToolSchema);
