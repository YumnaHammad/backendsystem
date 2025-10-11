const mongoose = require('mongoose');

// Import schemas
const userSchema = require('../schemas/UserSchema');
const productSchema = require('../schemas/ProductSchema');
const warehouseSchema = require('../schemas/WarehouseSchema');

// Create models
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Warehouse = mongoose.model('Warehouse', warehouseSchema);

// Additional models with existing schemas
const Supplier = require('./Supplier');
const Purchase = require('./Purchase');
const Invoice = require('./Invoice');
const Receipt = require('./Receipt');
const SalesOrder = require('./SalesOrder');
const SalesShipment = require('./SalesShipment');
const Return = require('./Return');
const Report = require('./Report');
const AuditLog = require('./AuditLog');

// Export all models
module.exports = {
  User,
  Product,
  Warehouse,
  Supplier,
  Purchase,
  Invoice,
  Receipt,
  SalesOrder,
  SalesShipment,
  Return,
  Report,
  AuditLog
};
