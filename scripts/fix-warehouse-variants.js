const mongoose = require('mongoose');
const { Warehouse, Product } = require('../models');
require('dotenv').config();

async function fixWarehouseVariants() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory');
    console.log('✅ Connected to MongoDB');

    const warehouses = await Warehouse.find()
      .populate('currentStock.productId', 'name sku hasVariants variants');

    console.log(`\nFound ${warehouses.length} warehouses`);

    for (const warehouse of warehouses) {
      console.log(`\n📦 Processing Warehouse: ${warehouse.name}`);
      let updated = false;

      for (const stockItem of warehouse.currentStock) {
        const product = stockItem.productId;
        
        console.log(`\n  Product: ${product?.name}`);
        console.log(`    Has Variants: ${product?.hasVariants}`);
        console.log(`    VariantId: ${stockItem.variantId}`);
        console.log(`    VariantName: ${stockItem.variantName}`);

        // If product has variants and stock has variantId but no variantName
        if (product && product.hasVariants && product.variants && stockItem.variantId) {
          const variant = product.variants.find(v => 
            (v._id && v._id.toString() === stockItem.variantId) || 
            (v.sku === stockItem.variantId) ||
            (v.sku && stockItem.variantId && v.sku.toString() === stockItem.variantId.toString())
          );

          if (variant) {
            console.log(`    ✓ Found variant: ${variant.name}`);
            
            if (!stockItem.variantName || stockItem.variantName !== variant.name) {
              console.log(`    → Updating variantName from "${stockItem.variantName}" to "${variant.name}"`);
              stockItem.variantName = variant.name;
              updated = true;
            }
          } else {
            console.log(`    ✗ No matching variant found for variantId: ${stockItem.variantId}`);
            console.log(`      Available variants:`, product.variants.map(v => ({ 
              _id: v._id?.toString(), 
              sku: v.sku, 
              name: v.name 
            })));
          }
        }
      }

      if (updated) {
        await warehouse.save();
        console.log(`  ✅ Warehouse "${warehouse.name}" updated`);
      } else {
        console.log(`  → No changes needed for "${warehouse.name}"`);
      }
    }

    console.log('\n✅ Warehouse variant fix completed!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

fixWarehouseVariants();

