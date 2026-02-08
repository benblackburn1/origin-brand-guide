const mongoose = require('mongoose');

const colorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Color name is required'],
    trim: true,
    maxlength: [100, 'Color name cannot exceed 100 characters']
  },
  hex: {
    type: String,
    required: [true, 'Hex value is required'],
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format']
  },
  rgb: {
    r: { type: Number, min: 0, max: 255 },
    g: { type: Number, min: 0, max: 255 },
    b: { type: Number, min: 0, max: 255 }
  },
  cmyk: {
    c: { type: Number, min: 0, max: 100 },
    m: { type: Number, min: 0, max: 100 },
    y: { type: Number, min: 0, max: 100 },
    k: { type: Number, min: 0, max: 100 }
  },
  pantone: {
    type: String,
    trim: true
  },
  order_index: {
    type: Number,
    default: 0
  }
}, { _id: true });

const colorPaletteSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['primary', 'secondary', 'tertiary'],
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  colors: [colorSchema],
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
colorPaletteSchema.index({ category: 1 });
colorPaletteSchema.index({ order_index: 1 });

module.exports = mongoose.model('ColorPalette', colorPaletteSchema);
