// Test script to check backend endpoints
const https = require('https');

const backendUrl = 'https://backend-g9e53sk2n-yumnas-projects-cde3c46c.vercel.app';

function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'backend-g9e53sk2n-yumnas-projects-cde3c46c.vercel.app',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testBackend() {
  console.log('🔍 Testing Backend Endpoints...\n');
  
  const endpoints = [
    '/api/health',
    '/api/cors-test', 
    '/api/test'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${backendUrl}${endpoint}`);
      const result = await testEndpoint(endpoint);
      
      console.log(`✅ Status: ${result.status}`);
      console.log(`📄 Response: ${result.data}`);
      console.log(`🌐 CORS Headers: ${JSON.stringify(result.headers['access-control-allow-origin'] || 'Not set')}`);
      console.log('---\n');
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log('---\n');
    }
  }
}

testBackend();
