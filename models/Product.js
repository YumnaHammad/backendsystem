const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  unit: {
    type: String,
    required: true,
    enum: ['pcs', 'kg', 'liters', 'boxes', 'meters'],
    default: 'pcs'
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient searching
productSchema.index({ sku: 1 }, { unique: true }); // Ensure unique SKU at database level
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });

module.exports = mongoose.model('Product', productSchema);