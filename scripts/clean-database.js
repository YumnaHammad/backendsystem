const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function cleanDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    
    console.log('📋 Found collections:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    console.log('');

    // Drop each collection
    console.log('🗑️  Deleting all data from collections...\n');
    
    for (const collection of collections) {
      const collectionName = collection.name;
      try {
        const result = await db.collection(collectionName).deleteMany({});
        console.log(`✅ ${collectionName}: ${result.deletedCount} documents deleted`);
      } catch (error) {
        console.error(`❌ Error deleting from ${collectionName}:`, error.message);
      }
    }

    console.log('\n✅ All data deleted successfully!');
    console.log('\n📊 Database is now empty and ready for fresh data.');
    
    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

cleanDatabase();

