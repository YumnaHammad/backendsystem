// Test script to verify system components without MongoDB
const fs = require('fs');
const path = require('path');

console.log('=== INVENTORY SYSTEM COMPONENT TEST ===\n');

// Test 1: Check if all models exist
console.log('1) Checking Mongoose Models...');
const modelsDir = path.join(__dirname, '../models');
const modelFiles = [
  'User.js',
  'Product.js', 
  'Warehouse.js',
  'Supplier.js',
  'Purchase.js',
  'Invoice.js',
  'Receipt.js',
  'SalesOrder.js',
  'SalesShipment.js',
  'Return.js',
  'Report.js',
  'AuditLog.js',
  'index.js'
];

let modelsExist = true;
modelFiles.forEach(file => {
  const filePath = path.join(modelsDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✓ ${file}`);
  } else {
    console.log(`   ✗ ${file} - MISSING`);
    modelsExist = false;
  }
});

// Test 2: Check if all controllers exist
console.log('\n2) Checking Controllers...');
const controllersDir = path.join(__dirname, '../controllers');
const controllerFiles = [
  'authController.js',
  'productController.js',
  'warehouseController.js',
  'purchaseController.js',
  'salesController.js',
  'supplierController.js',
  'reportController.js'
];

let controllersExist = true;
controllerFiles.forEach(file => {
  const filePath = path.join(controllersDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✓ ${file}`);
  } else {
    console.log(`   ✗ ${file} - MISSING`);
    controllersExist = false;
  }
});

// Test 3: Check if all routes exist
console.log('\n3) Checking Routes...');
const routesDir = path.join(__dirname, '../routes');
const routeFiles = [
  'auth.js',
  'products.js',
  'warehouses.js',
  'purchases.js',
  'sales.js',
  'suppliers.js',
  'reports.js',
  'invoices.js',
  'receipts.js'
];

let routesExist = true;
routeFiles.forEach(file => {
  const filePath = path.join(routesDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✓ ${file}`);
  } else {
    console.log(`   ✗ ${file} - MISSING`);
    routesExist = false;
  }
});

// Test 4: Check middleware
console.log('\n4) Checking Middleware...');
const middlewareDir = path.join(__dirname, '../middleware');
const middlewareFiles = ['auth.js', 'audit.js'];

let middlewareExist = true;
middlewareFiles.forEach(file => {
  const filePath = path.join(middlewareDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✓ ${file}`);
  } else {
    console.log(`   ✗ ${file} - MISSING`);
    middlewareExist = false;
  }
});

// Test 5: Check seed scripts
console.log('\n5) Checking Seed Scripts...');
const seedDir = path.join(__dirname, 'seed');
const seedFiles = ['clean.js', 'flow.js'];

let seedScriptsExist = true;
seedFiles.forEach(file => {
  const filePath = path.join(seedDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✓ ${file}`);
  } else {
    console.log(`   ✗ ${file} - MISSING`);
    seedScriptsExist = false;
  }
});

// Test 6: Check package.json dependencies
console.log('\n6) Checking Dependencies...');
const packageJsonPath = path.join(__dirname, '../package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = ['mongoose', 'express', 'jsonwebtoken', 'bcryptjs'];
  
  let depsExist = true;
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`   ✓ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`   ✗ ${dep} - MISSING`);
      depsExist = false;
    }
  });
} else {
  console.log('   ✗ package.json not found');
}

// Test 7: Check server.js
console.log('\n7) Checking Server Configuration...');
const serverPath = path.join(__dirname, '../server.js');
if (fs.existsSync(serverPath)) {
  console.log('   ✓ server.js exists');
  
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  const hasMongoose = serverContent.includes('mongoose');
  const hasExpress = serverContent.includes('express');
  const hasRoutes = serverContent.includes('routes');
  
  console.log(`   ✓ Mongoose integration: ${hasMongoose ? 'YES' : 'NO'}`);
  console.log(`   ✓ Express setup: ${hasExpress ? 'YES' : 'NO'}`);
  console.log(`   ✓ Routes setup: ${hasRoutes ? 'YES' : 'NO'}`);
} else {
  console.log('   ✗ server.js not found');
}

// Test 8: Check environment file
console.log('\n8) Checking Environment Configuration...');
const envExamplePath = path.join(__dirname, '../env.example');
const envPath = path.join(__dirname, '../.env');

if (fs.existsSync(envExamplePath)) {
  console.log('   ✓ env.example exists');
} else {
  console.log('   ✗ env.example not found');
}

if (fs.existsSync(envPath)) {
  console.log('   ✓ .env file exists');
} else {
  console.log('   ⚠ .env file not found (copy from env.example)');
}

// Summary
console.log('\n=== TEST SUMMARY ===');
const allTestsPass = modelsExist && controllersExist && routesExist && middlewareExist && seedScriptsExist;

if (allTestsPass) {
  console.log('✅ ALL COMPONENTS VERIFIED');
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Install and start MongoDB');
  console.log('2. Run: npm run seed:clean');
  console.log('3. Run: npm run seed:flow');
  console.log('4. Start server: npm run dev');
  console.log('5. Test the complete flow!');
} else {
  console.log('❌ SOME COMPONENTS MISSING');
  console.log('Please ensure all required files are present before proceeding.');
}

console.log('\n🔧 MONGODB SETUP REQUIRED:');
console.log('To run the full system, you need to:');
console.log('1. Install MongoDB Community Server');
console.log('2. Start MongoDB service');
console.log('3. Run the seed scripts');
console.log('\nSee README.md for detailed installation instructions.');

console.log('\n=== TEST COMPLETED ===');
