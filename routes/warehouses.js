const express = require('express');
const { 
  getAllWarehouses, 
  getWarehouseById, 
  createWarehouse, 
  updateWarehouse, 
  deleteWarehouse,
  addStock,
  transferStock
} = require('../controllers/warehouseController');
const { authenticateToken, requireManagerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Public routes (authenticated users)
router.get('/', getAllWarehouses);
router.get('/:id', getWarehouseById);

// Protected routes (manager or admin only)
router.post('/', requireManagerOrAdmin, createWarehouse);
router.put('/:id', requireManagerOrAdmin, updateWarehouse);
router.delete('/:id', requireManagerOrAdmin, deleteWarehouse);
router.post('/:id/add-stock', requireManagerOrAdmin, addStock);
router.post('/:id/transfer', requireManagerOrAdmin, transferStock);

module.exports = router;