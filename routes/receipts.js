const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Placeholder routes - receipts are created automatically via purchase confirmations
router.get('/', (req, res) => {
  res.json({ message: 'Receipts are created automatically when purchases are confirmed' });
});

router.get('/:id', (req, res) => {
  res.json({ message: 'Receipt details endpoint - to be implemented' });
});

module.exports = router;