const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_system';

// Import models
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');

async function updateAllProductsStock() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');
    
    console.log('📊 Starting comprehensive stock update for ALL products...\n');
    console.log('='.repeat(80));
    
    // Get all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products in database\n`);
    
    // Get all warehouses
    const warehouses = await Warehouse.find({});
    console.log(`Found ${warehouses.length} warehouses\n`);
    
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalVariantsUpdated = 0;
    
    // Process each product
    for (const product of products) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📦 Product: ${product.name}`);
      console.log(`   SKU: ${product.sku || 'N/A (has variants)'}`);
      console.log(`   ID: ${product._id}`);
      console.log('='.repeat(80));
      
      if (product.hasVariants && product.variants && product.variants.length > 0) {
        // Product has variants
        console.log(`   Type: Variant Product (${product.variants.length} variants)`);
        
        let productUpdated = false;
        let variantsUpdatedCount = 0;
        
        for (let i = 0; i < product.variants.length; i++) {
          const variant = product.variants[i];
          const variantName = variant.name;
          const oldStock = variant.stock || 0;
          
          // Calculate stock from all warehouses
          let totalStock = 0;
          const warehouseBreakdown = [];
          
          for (const warehouse of warehouses) {
            if (warehouse.currentStock && warehouse.currentStock.length > 0) {
              const stockItem = warehouse.currentStock.find(item => 
                item.productId && 
                item.productId.toString() === product._id.toString() &&
                item.variantName === variantName
              );
              
              if (stockItem) {
                const stockQty = stockItem.quantity || 0;
                totalStock += stockQty;
                warehouseBreakdown.push({
                  warehouse: warehouse.name,
                  stock: stockQty
                });
              }
            }
          }
          
          console.log(`\n   Variant ${i + 1}: ${variant.name}`);
          console.log(`   ├─ Old Stock: ${oldStock} units`);
          console.log(`   ├─ New Stock: ${totalStock} units`);
          
          if (warehouseBreakdown.length > 0) {
            console.log(`   └─ Warehouse Breakdown:`);
            warehouseBreakdown.forEach(wb => {
              console.log(`      • ${wb.warehouse}: ${wb.stock} units`);
            });
          } else {
            console.log(`   └─ No stock found in warehouses`);
          }
          
          // Update variant stock
          if (totalStock !== oldStock) {
            product.variants[i].stock = totalStock;
            productUpdated = true;
            variantsUpdatedCount++;
            console.log(`   ✅ Updated: ${oldStock} → ${totalStock} units`);
          } else {
            console.log(`   ⚪ No change needed`);
          }
        }
        
        if (productUpdated) {
          await product.save();
          console.log(`\n   ✨ Product saved with ${variantsUpdatedCount} variants updated`);
          totalUpdated++;
          totalVariantsUpdated += variantsUpdatedCount;
        } else {
          console.log(`\n   ⚠️  No changes needed for this product`);
          totalSkipped++;
        }
        
      } else {
        // Non-variant product
        console.log(`   Type: Simple Product (no variants)`);
        
        // Calculate stock from all warehouses
        let totalStock = 0;
        const warehouseBreakdown = [];
        
        for (const warehouse of warehouses) {
          if (warehouse.currentStock && warehouse.currentStock.length > 0) {
            const stockItem = warehouse.currentStock.find(item => 
              item.productId && 
              item.productId.toString() === product._id.toString() &&
              !item.variantName
            );
            
            if (stockItem) {
              const stockQty = stockItem.quantity || 0;
              totalStock += stockQty;
              warehouseBreakdown.push({
                warehouse: warehouse.name,
                stock: stockQty
              });
            }
          }
        }
        
        console.log(`   ├─ Old Stock: ${product.warehouses?.reduce((sum, w) => sum + w.stock, 0) || 0} units`);
        console.log(`   ├─ New Stock: ${totalStock} units`);
        
        if (warehouseBreakdown.length > 0) {
          console.log(`   └─ Warehouse Breakdown:`);
          warehouseBreakdown.forEach(wb => {
            console.log(`      • ${wb.warehouse}: ${wb.stock} units`);
          });
        } else {
          console.log(`   └─ No stock found in warehouses`);
        }
        
        // Update product warehouses array
        if (warehouseBreakdown.length > 0) {
          product.warehouses = warehouseBreakdown.map(wb => ({
            name: wb.warehouse,
            stock: wb.stock
          }));
          await product.save();
          console.log(`   ✅ Product stock updated`);
          totalUpdated++;
        } else {
          console.log(`   ⚪ No changes needed`);
          totalSkipped++;
        }
      }
    }
    
    // Summary
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Products Updated: ${totalUpdated}`);
    console.log(`⚪ Products Skipped: ${totalSkipped}`);
    console.log(`📦 Total Products: ${products.length}`);
    console.log(`🔢 Variants Updated: ${totalVariantsUpdated}`);
    console.log('='.repeat(80));
    
    console.log('\n✨ Stock update completed successfully!');
    console.log('🔄 Refresh your browser to see updated stock levels!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the update
updateAllProductsStock();

