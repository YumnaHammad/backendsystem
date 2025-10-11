const mongoose = require('mongoose');

// Warehouse Stock Schema (embedded)
const warehouseStockSchema = new mongoose.Schema({
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reserved: {
    type: Number,
    min: 0,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Product Timeline Schema (embedded)
const timelineEventSchema = new mongoose.Schema({
  timestampISO: {
    type: Date,
    required: true,
    default: Date.now
  },
  displayDateTime: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'created',
      'purchased',
      'stock_allocated',
      'sold',
      'dispatched',
      'delivered',
      'returned',
      'transferred',
      'updated'
    ]
  },
  details: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    min: 0
  },
  warehouse: {
    type: String
  },
  actor: {
    type: String,
    default: 'System'
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  referenceType: {
    type: String,
    enum: ['Purchase', 'SalesOrder', 'SalesShipment', 'Return', 'Transfer']
  }
}, { _id: false });

// Main Product Schema
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['Electronics', 'Accessories', 'Spare Parts', 'Tools', 'Materials', 'Other'],
      message: 'Category must be one of: Electronics, Accessories, Spare Parts, Tools, Materials, Other'
    }
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: {
      values: ['piece', 'kg', 'liter', 'meter', 'box', 'set'],
      message: 'Unit must be one of: piece, kg, liter, meter, box, set'
    },
    default: 'piece'
  },
  costPrice: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: [0, 'Cost price cannot be negative']
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Selling price cannot be negative'],
    validate: {
      validator: function(value) {
        return value >= this.costPrice;
      },
      message: 'Selling price must be greater than or equal to cost price'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  currentStock: {
    type: Number,
    min: 0,
    default: 0,
    get: function() {
      return this.warehouses.reduce((sum, w) => sum + w.stock, 0);
    }
  },
  warehouses: [warehouseStockSchema],
  timeline: [timelineEventSchema],
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
  lowStockThreshold: {
    type: Number,
    min: 0,
    default: 5
  },
  tags: [{
    type: String,
    trim: true
  }],
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { 
    getters: true,
    virtuals: true
  },
  toObject: { 
    getters: true,
    virtuals: true
  }
});

// Indexes for better performance
productSchema.index({ sku: 1 });
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ 'warehouses.warehouseId': 1 });

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.costPrice > 0) {
    return ((this.sellingPrice - this.costPrice) / this.costPrice * 100).toFixed(2);
  }
  return 0;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  const totalStock = this.currentStock;
  if (totalStock === 0) return 'out_of_stock';
  if (totalStock <= this.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});

// Pre-save middleware
productSchema.pre('save', function(next) {
  // Update current stock based on warehouses
  this.currentStock = this.warehouses.reduce((sum, w) => sum + w.stock, 0);
  
  // Add timeline event for updates
  if (!this.isNew && this.isModified()) {
    const event = {
      timestampISO: new Date(),
      displayDateTime: new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Karachi',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      }),
      action: 'updated',
      details: 'Product information updated',
      actor: 'System'
    };
    this.timeline.push(event);
  }
  
  next();
});

// Static methods
productSchema.statics.findByCategory = function(category) {
  return this.find({ category, status: 'active' });
};

productSchema.statics.findLowStock = function(threshold = 5) {
  return this.find({
    currentStock: { $lte: threshold },
    status: 'active'
  });
};

productSchema.statics.findOutOfStock = function() {
  return this.find({
    currentStock: 0,
    status: 'active'
  });
};

// Instance methods
productSchema.methods.addStock = function(warehouseId, quantity, actor = 'System') {
  const warehouse = this.warehouses.find(w => w.warehouseId.toString() === warehouseId.toString());
  
  if (warehouse) {
    warehouse.stock += quantity;
    warehouse.lastUpdated = new Date();
  } else {
    throw new Error('Warehouse not found for this product');
  }
  
  // Add timeline event
  this.timeline.push({
    timestampISO: new Date(),
    displayDateTime: new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }),
    action: 'stock_allocated',
    details: `Stock increased by ${quantity} units`,
    quantity,
    warehouse: warehouse?.name || 'Unknown',
    actor
  });
  
  return this.save();
};

productSchema.methods.reduceStock = function(warehouseId, quantity, actor = 'System') {
  const warehouse = this.warehouses.find(w => w.warehouseId.toString() === warehouseId.toString());
  
  if (!warehouse) {
    throw new Error('Warehouse not found for this product');
  }
  
  if (warehouse.stock < quantity) {
    throw new Error('Insufficient stock in warehouse');
  }
  
  warehouse.stock -= quantity;
  warehouse.lastUpdated = new Date();
  
  // Add timeline event
  this.timeline.push({
    timestampISO: new Date(),
    displayDateTime: new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }),
    action: 'stock_reduced',
    details: `Stock reduced by ${quantity} units`,
    quantity,
    warehouse: warehouse.name,
    actor
  });
  
  return this.save();
};

module.exports = productSchema;
