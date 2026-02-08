const mongoose = require('mongoose');

const brandConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    enum: ['general'],
    default: 'general'
  },
  // Homepage hero background
  homepage_hero_image_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BrandAsset',
    default: null
  },
  homepage_hero_image_url: {
    type: String,
    default: null
  },
  // Brand description (used in Home.js "Who We Are" section)
  description: {
    type: String,
    maxlength: 2000
  },
  // Future extensibility for additional settings
  settings: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

brandConfigSchema.index({ key: 1 });

module.exports = mongoose.model('BrandConfig', brandConfigSchema);
