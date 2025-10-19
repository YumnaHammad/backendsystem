const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_system';

async function fixIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('products');

    console.log('📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n🗑️  Dropping old indexes...');
    try {
      await collection.dropIndex('sku_1');
      console.log('✅ Dropped sku_1 index');
    } catch (e) {
      console.log('⚠️  sku_1 index not found or already dropped');
    }

    try {
      await collection.dropIndex('variants.sku_1');
      console.log('✅ Dropped variants.sku_1 index');
    } catch (e) {
      console.log('⚠️  variants.sku_1 index not found or already dropped');
    }

    console.log('\n🔨 Creating new indexes...');
    
    // Create sparse unique index for SKU
    await collection.createIndex(
      { sku: 1 },
      { 
        unique: true, 
        sparse: true,
        name: 'sku_1_sparse'
      }
    );
    console.log('✅ Created sparse unique index for sku');

    // Create sparse index for variant SKUs
    await collection.createIndex(
      { 'variants.sku': 1 },
      { 
        sparse: true,
        name: 'variants.sku_1_sparse'
      }
    );
    console.log('✅ Created sparse index for variants.sku');

    console.log('\n📋 New indexes:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✨ Index fix completed successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

fixIndexes();

