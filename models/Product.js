const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    required: function() {
      // SKU is required only if product has no variants
      return !this.hasVariants;
    },
    unique: true,
    sparse: true, // Allow null values in unique index
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
  // costPrice: {
  //   type: Number,
  //   required: false, // Not required when hasVariants is true
  //   min: 0,
  //   default: 0
  // },
  sellingPrice: {
    type: Number,
    required: false, // Not required when hasVariants is true
    min: 0,
    default: 0
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Variant Support
  hasVariants: {
    type: Boolean,
    default: false
  },
  attributes: [{
    name: {
      type: String,
      trim: true
    },
    values: [{
      type: String,
      trim: true
    }]
  }],
  variants: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true  // Each variant must have unique SKU
    },
    attributes: [{
      name: {
        type: String,
        trim: true
      },
      value: {
        type: String,
        trim: true
      }
    }],
    // costPrice: {
    //   type: Number,
    //   min: 0
    // },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0
    },
    stock: {
      type: Number,
      default: 0,
      min: 0
    }
  }]
}, {
  timestamps: true
});

// Index for efficient searching
productSchema.index({ sku: 1 }, { unique: true, sparse: true }); // Ensure unique SKU at database level
productSchema.index({ 'variants.sku': 1 }, { sparse: true }); // Index for variant SKUs (sparse to allow nulls)
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });

// Ensure variant SKUs are unique across all products
productSchema.pre('save', async function(next) {
  if (this.hasVariants && this.variants && this.variants.length > 0) {
    const variantSkus = this.variants.map(v => v.sku);
    
    // Check for duplicates within this product's variants
    const duplicates = variantSkus.filter((sku, index) => variantSkus.indexOf(sku) !== index);
    if (duplicates.length > 0) {
      throw new Error(`Duplicate variant SKUs found within product: ${duplicates.join(', ')}`);
    }
    
    // Check for duplicates across other products
    const Product = this.constructor;
    for (const variantSku of variantSkus) {
      const existingProduct = await Product.findOne({
        _id: { $ne: this._id },
        $or: [
          { sku: variantSku },
          { 'variants.sku': variantSku }
        ]
      });
      
      if (existingProduct) {
        throw new Error(`Variant SKU '${variantSku}' already exists in another product: ${existingProduct.name}`);
      }
    }
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);