const express = require('express');
const { 
  getAllProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  generateSKU
} = require('../controllers/productController');

const router = express.Router();

// Public routes (no auth required for testing)
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/generate-sku', generateSKU);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;