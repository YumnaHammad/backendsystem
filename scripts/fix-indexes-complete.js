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

    console.log('\n🗑️  Dropping ALL old indexes...');
    
    // Drop all indexes except _id_
    for (const index of indexes) {
      if (index.name !== '_id_') {
        try {
          await collection.dropIndex(index.name);
          console.log(`✅ Dropped ${index.name}`);
        } catch (e) {
          console.log(`⚠️  Could not drop ${index.name}: ${e.message}`);
        }
      }
    }

    console.log('\n🔨 Creating new indexes...');
    
    // Create sparse unique index for SKU
    await collection.createIndex(
      { sku: 1 },
      { 
        unique: true, 
        sparse: true,
        name: 'sku_1'
      }
    );
    console.log('✅ Created sparse unique index for sku');

    // Create sparse index for variant SKUs
    await collection.createIndex(
      { 'variants.sku': 1 },
      { 
        sparse: true,
        name: 'variants.sku_1'
      }
    );
    console.log('✅ Created sparse index for variants.sku');

    // Create other indexes
    await collection.createIndex({ name: 1 }, { name: 'name_1' });
    console.log('✅ Created index for name');

    await collection.createIndex({ category: 1 }, { name: 'category_1' });
    console.log('✅ Created index for category');

    console.log('\n📋 Final indexes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(index => {
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

