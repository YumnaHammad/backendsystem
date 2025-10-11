const express = require('express');
const { 
  getAllProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  generateSKU
} = require('../controllers/productController');
const { authenticateToken, requireManagerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Public routes (authenticated users)
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/generate-sku', generateSKU);

// Protected routes (manager or admin only)
router.post('/', requireManagerOrAdmin, createProduct);
router.put('/:id', requireManagerOrAdmin, updateProduct);
router.delete('/:id', requireManagerOrAdmin, deleteProduct);

module.exports = router;