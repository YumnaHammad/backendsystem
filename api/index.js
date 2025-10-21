// api/index.js
// ✅ Vercel serverless entry point
const serverless = require('serverless-http');
const app = require('../index.js');

module.exports = serverless(app);
