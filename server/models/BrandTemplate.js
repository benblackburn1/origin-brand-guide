const mongoose = require('mongoose');

const brandTemplateSchema = new mongoose.Schema({
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
  // Template type
  template_type: {
    type: String,
    required: true,
    enum: ['figma', 'google-slides', 'keynote', 'pdf', 'powerpoint', 'other']
  },
  // Link for external templates (Figma, Google Slides)
  external_link: {
    type: String,
    trim: true
  },
  // File URL for downloadable templates
  file_url: {
    type: String
  },
  gcs_path: {
    type: String
  },
  file_size: {
    type: Number
  },
  // Preview image/video
  preview_url: {
    type: String
  },
  preview_gcs_path: {
    type: String
  },
  preview_type: {
    type: String,
    enum: ['image', 'video', 'gif'],
    default: 'image'
  },
  // Custom tags
  tags: [{
    type: String,
    trim: true
  }],
  // Order for display
  order_index: {
    type: Number,
    default: 0
  },
  // Status
  is_active: {
    type: Boolean,
    default: true
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
brandTemplateSchema.index({ order_index: 1 });
brandTemplateSchema.index({ tags: 1 });
brandTemplateSchema.index({ template_type: 1 });
brandTemplateSchema.index({ is_active: 1 });

module.exports = mongoose.model('BrandTemplate', brandTemplateSchema);
