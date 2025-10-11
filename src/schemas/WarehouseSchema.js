const mongoose = require('mongoose');

// Warehouse Schema
const warehouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Warehouse name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Warehouse name cannot exceed 100 characters']
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'Pakistan'
    },
    postalCode: {
      type: String,
      trim: true
    },
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    }
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be greater than 0']
  },
  currentUsage: {
    type: Number,
    min: 0,
    default: 0,
    validate: {
      validator: function(value) {
        return value <= this.capacity;
      },
      message: 'Current usage cannot exceed capacity'
    }
  },
  capacityUnit: {
    type: String,
    enum: ['items', 'cubic_meters', 'weight_kg'],
    default: 'items'
  },
  type: {
    type: String,
    enum: ['main', 'overflow', 'cold_storage', 'hazardous', 'other'],
    default: 'main'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  manager: {
    name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  operatingHours: {
    open: {
      type: String,
      default: '09:00'
    },
    close: {
      type: String,
      default: '18:00'
    },
    timezone: {
      type: String,
      default: 'Asia/Karachi'
    },
    workingDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  },
  facilities: [{
    type: String,
    enum: ['loading_dock', 'climate_control', 'security', 'cctv', 'fire_safety', 'forklift_access']
  }],
  // Stock tracking
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    sku: String,
    name: String,
    stock: {
      type: Number,
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
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
warehouseSchema.index({ name: 1 });
warehouseSchema.index({ 'location.city': 1 });
warehouseSchema.index({ status: 1 });
warehouseSchema.index({ type: 1 });
warehouseSchema.index({ 'products.productId': 1 });

// Virtual for capacity utilization percentage
warehouseSchema.virtual('capacityUtilization').get(function() {
  if (this.capacity > 0) {
    return ((this.currentUsage / this.capacity) * 100).toFixed(2);
  }
  return 0;
});

// Virtual for available capacity
warehouseSchema.virtual('availableCapacity').get(function() {
  return this.capacity - this.currentUsage;
});

// Virtual for full address
warehouseSchema.virtual('fullAddress').get(function() {
  const { address, city, state, country, postalCode } = this.location;
  return `${address}, ${city}, ${state}, ${country}${postalCode ? ` ${postalCode}` : ''}`;
});

// Pre-save middleware
warehouseSchema.pre('save', function(next) {
  // Update current usage based on products
  this.currentUsage = this.products.reduce((sum, product) => sum + product.stock, 0);
  
  // Validate capacity
  if (this.currentUsage > this.capacity) {
    return next(new Error('Total stock exceeds warehouse capacity'));
  }
  
  next();
});

// Static methods
warehouseSchema.statics.findByLocation = function(city) {
  return this.find({ 'location.city': city, status: 'active' });
};

warehouseSchema.statics.findByType = function(type) {
  return this.find({ type, status: 'active' });
};

warehouseSchema.statics.findAvailable = function(requiredCapacity = 0) {
  return this.find({
    status: 'active',
    $expr: {
      $gte: [{ $subtract: ['$capacity', '$currentUsage'] }, requiredCapacity]
    }
  });
};

// Instance methods
warehouseSchema.methods.addProduct = function(productId, sku, name, stock = 0) {
  const existingProduct = this.products.find(p => p.productId.toString() === productId.toString());
  
  if (existingProduct) {
    existingProduct.stock += stock;
    existingProduct.lastUpdated = new Date();
  } else {
    this.products.push({
      productId,
      sku,
      name,
      stock,
      lastUpdated: new Date()
    });
  }
  
  return this.save();
};

warehouseSchema.methods.removeProduct = function(productId) {
  this.products = this.products.filter(p => p.productId.toString() !== productId.toString());
  return this.save();
};

warehouseSchema.methods.updateProductStock = function(productId, newStock) {
  const product = this.products.find(p => p.productId.toString() === productId.toString());
  
  if (product) {
    product.stock = newStock;
    product.lastUpdated = new Date();
    return this.save();
  }
  
  throw new Error('Product not found in this warehouse');
};

warehouseSchema.methods.transferStock = async function(toWarehouseId, productId, quantity) {
  const fromProduct = this.products.find(p => p.productId.toString() === productId.toString());
  
  if (!fromProduct) {
    throw new Error('Product not found in source warehouse');
  }
  
  if (fromProduct.stock < quantity) {
    throw new Error('Insufficient stock for transfer');
  }
  
  // Reduce stock from this warehouse
  fromProduct.stock -= quantity;
  fromProduct.lastUpdated = new Date();
  
  // Find target warehouse and add stock
  const Warehouse = mongoose.model('Warehouse');
  const toWarehouse = await Warehouse.findById(toWarehouseId);
  
  if (!toWarehouse) {
    throw new Error('Target warehouse not found');
  }
  
  // Check if target warehouse has capacity
  const requiredCapacity = quantity;
  if (toWarehouse.availableCapacity < requiredCapacity) {
    throw new Error('Target warehouse does not have sufficient capacity');
  }
  
  await toWarehouse.addProduct(productId, fromProduct.sku, fromProduct.name, quantity);
  await this.save();
  
  return {
    fromWarehouse: this.name,
    toWarehouse: toWarehouse.name,
    productId,
    quantity,
    transferredAt: new Date()
  };
};

module.exports = warehouseSchema;
