require('dotenv').config();
const mongoose = require('mongoose');

// Import all models
const {
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
} = require('../../models');

const cleanDatabase = async () => {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_system';
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Delete all documents from all collections
    const collections = [
      { name: 'Products', model: Product },
      { name: 'Warehouses', model: Warehouse },
      { name: 'Suppliers', model: Supplier },
      { name: 'Purchases', model: Purchase },
      { name: 'Invoices', model: Invoice },
      { name: 'Receipts', model: Receipt },
      { name: 'SalesOrders', model: SalesOrder },
      { name: 'SalesShipments', model: SalesShipment },
      { name: 'Returns', model: Return },
      { name: 'Reports', model: Report },
      { name: 'Users', model: User },
      { name: 'AuditLogs', model: AuditLog }
    ];
    
    const deletionResults = {};
    
    for (const collection of collections) {
      const result = await collection.model.deleteMany({});
      deletionResults[collection.name] = result.deletedCount;
      console.log(`Deleted ${result.deletedCount} documents from ${collection.name}`);
    }
    
    console.log('\n=== CLEANUP SUMMARY ===');
    console.log('Deleted documents:');
    Object.entries(deletionResults).forEach(([collection, count]) => {
      console.log(`  ${collection}: ${count}`);
    });
    
    const totalDeleted = Object.values(deletionResults).reduce((sum, count) => sum + count, 0);
    console.log(`\nTotal documents deleted: ${totalDeleted}`);
    
    console.log('\nDatabase cleaned successfully!');
    
  } catch (error) {
    console.error('Error cleaning database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the cleanup
cleanDatabase();
