const axios = require('axios');

async function testAddStockDetailed() {
  const API_URL = 'http://localhost:5000/api';
  
  console.log('🔍 DETAILED ADD STOCK TEST\n');
  console.log('═══════════════════════════════════════\n');
  
  try {
    // Step 1: Get warehouses
    console.log('📦 Step 1: Fetching warehouses...');
    const warehousesRes = await axios.get(`${API_URL}/warehouses`);
    const warehouses = warehousesRes.data;
    console.log(`   ✅ Found ${warehouses.length} warehouses`);
    
    if (warehouses.length === 0) {
      console.log('   ❌ ERROR: No warehouses found!');
      console.log('   💡 Solution: Create a warehouse first at /warehouses/new\n');
      return;
    }
    
    const warehouse = warehouses[0];
    console.log(`   📍 Selected: ${warehouse.name}`);
    console.log(`   📊 Capacity: ${warehouse.totalStock}/${warehouse.capacity}\n`);
    
    // Step 2: Get products
    console.log('📦 Step 2: Fetching products...');
    const productsRes = await axios.get(`${API_URL}/products`);
    const products = productsRes.data.products || productsRes.data;
    console.log(`   ✅ Found ${products.length} products`);
    
    if (products.length === 0) {
      console.log('   ❌ ERROR: No products found!');
      console.log('   💡 Solution: Create products first at /products/new\n');
      return;
    }
    
    const product = products[0];
    console.log(`   📍 Selected: ${product.name} (${product.sku})`);
    console.log(`   💰 Price: PKR ${product.sellingPrice}\n`);
    
    // Step 3: Test Add Stock
    console.log('📦 Step 3: Adding stock...');
    const stockData = {
      productId: product._id,
      quantity: 10,
      tags: []
    };
    
    console.log('   📤 Request:', JSON.stringify(stockData, null, 2));
    console.log(`   🎯 URL: POST ${API_URL}/warehouses/${warehouse._id}/add-stock\n`);
    
    const addStockRes = await axios.post(
      `${API_URL}/warehouses/${warehouse._id}/add-stock`,
      stockData
    );
    
    console.log('   ✅ SUCCESS! Stock added');
    console.log('   📊 Response:', JSON.stringify(addStockRes.data, null, 2));
    
    // Step 4: Verify
    console.log('\n📦 Step 4: Verifying...');
    const verifyRes = await axios.get(`${API_URL}/warehouses/${warehouse._id}`);
    const updated = verifyRes.data;
    console.log(`   ✅ Updated stock: ${updated.totalStock}/${updated.capacity}`);
    console.log(`   📊 Utilization: ${Math.round(updated.capacityUsage)}%\n`);
    
    console.log('═══════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED - Add Stock is working!\n');
    
  } catch (error) {
    console.log('\n❌ ERROR OCCURRED:');
    console.log('═══════════════════════════════════════');
    
    if (error.response) {
      console.log('📛 Status:', error.response.status);
      console.log('📛 Error:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 400) {
        console.log('\n💡 Common 400 errors:');
        console.log('   - Invalid productId or quantity');
        console.log('   - Warehouse capacity exceeded');
        console.log('   - Missing required fields');
      }
    } else if (error.request) {
      console.log('📛 No response from server');
      console.log('💡 Check if backend is running on port 5000');
    } else {
      console.log('📛 Error:', error.message);
    }
    
    console.log('\n');
  }
}

testAddStockDetailed();

