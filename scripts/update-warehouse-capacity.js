const mongoose = require('mongoose');
require('dotenv').config();

// Import Warehouse model
const Warehouse = require('../models/Warehouse');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_system', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Update warehouse capacity to 1 lac (100,000)
const updateWarehouseCapacity = async () => {
  try {
    console.log('\n🔄 Updating warehouse capacity to 1 lac (100,000)...\n');
    
    // Find all warehouses
    const warehouses = await Warehouse.find({});
    
    if (warehouses.length === 0) {
      console.log('⚠️  No warehouses found in the database.');
      return;
    }
    
    console.log(`Found ${warehouses.length} warehouse(s):\n`);
    
    // Update each warehouse
    for (const warehouse of warehouses) {
      const oldCapacity = warehouse.capacity;
      warehouse.capacity = 100000; // 1 lac
      await warehouse.save();
      
      console.log(`✅ Updated: ${warehouse.name}`);
      console.log(`   Location: ${warehouse.location}`);
      console.log(`   Old Capacity: ${oldCapacity.toLocaleString()}`);
      console.log(`   New Capacity: ${warehouse.capacity.toLocaleString()}`);
      console.log(`   Current Stock: ${warehouse.getTotalStock().toLocaleString()}`);
      console.log(`   Available Space: ${(warehouse.capacity - warehouse.getTotalStock()).toLocaleString()}`);
      console.log(`   Capacity Usage: ${warehouse.getCapacityUsage().toFixed(2)}%\n`);
    }
    
    console.log('✅ All warehouses updated successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   Total Warehouses: ${warehouses.length}`);
    console.log(`   New Capacity: 100,000 units per warehouse`);
    
  } catch (error) {
    console.error('❌ Error updating warehouse capacity:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
};

// Run the update
const run = async () => {
  await connectDB();
  await updateWarehouseCapacity();
  process.exit(0);
};

run();
