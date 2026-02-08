const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  section: {
    type: String,
    required: [true, 'Section is required'],
    enum: ['brand-voice', 'messaging', 'strategy-positioning'],
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  // Rich text/markdown content
  content: {
    type: String,
    default: ''
  },
  // Order for display
  order_index: {
    type: Number,
    default: 0
  },
  is_active: {
    type: Boolean,
    default: true
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index
contentSchema.index({ section: 1 });
contentSchema.index({ order_index: 1 });

module.exports = mongoose.model('Content', contentSchema);
