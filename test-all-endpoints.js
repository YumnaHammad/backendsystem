const http = require('http');

function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsed,
            path: path,
            isArray: Array.isArray(parsed)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData,
            path: path,
            error: 'Invalid JSON'
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({ path: path, error: error.message });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAllEndpoints() {
  console.log('🔍 Testing all backend endpoints...\n');

  const endpoints = [
    { path: '/api/health', name: 'Health Check' },
    { path: '/api/products', name: 'Products' },
    { path: '/api/sales', name: 'Sales' },
    { path: '/api/purchases', name: 'Purchases' },
    { path: '/api/suppliers', name: 'Suppliers' },
    { path: '/api/warehouses', name: 'Warehouses' },
    { path: '/api/sales-orders', name: 'Sales Orders' },
    { path: '/api/dashboard/stats', name: 'Dashboard Stats' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name} (${endpoint.path})...`);
      const result = await testEndpoint(endpoint.path);
      
      if (result.status === 200) {
        console.log(`✅ ${endpoint.name}: Status ${result.status}`);
        if (result.isArray) {
          console.log(`   📊 Data: Array with ${result.data.length} items`);
        } else if (result.data && typeof result.data === 'object') {
          console.log(`   📊 Data: Object with keys: ${Object.keys(result.data).join(', ')}`);
        }
      } else {
        console.log(`❌ ${endpoint.name}: Status ${result.status}`);
        console.log(`   Error: ${JSON.stringify(result.data)}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Connection failed`);
      console.log(`   Error: ${error.error}`);
    }
    console.log('');
  }

  // Test login
  try {
    console.log('Testing Login...');
    const loginResult = await testEndpoint('/api/auth/login', 'POST', {
      email: 'admin@example.com',
      password: 'AdminPass123'
    });
    
    if (loginResult.status === 200) {
      console.log('✅ Login: Status 200');
      console.log('   📊 User:', loginResult.data.user?.email || 'No user data');
    } else {
      console.log('❌ Login: Status', loginResult.status);
      console.log('   Error:', JSON.stringify(loginResult.data));
    }
  } catch (error) {
    console.log('❌ Login: Connection failed');
    console.log('   Error:', error.error);
  }
}

testAllEndpoints();
