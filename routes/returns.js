const express = require('express');
const { 
  createReturn, 
  getAllReturns, 
  getReturnById, 
  processReturn,
  updateReturnStatus,
  deleteReturn 
} = require('../controllers/returnController');
const { authenticateToken, requireManagerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Public routes (authenticated users)
router.get('/', getAllReturns);
router.get('/:id', getReturnById);

// Protected routes (manager or admin only)
router.post('/', requireManagerOrAdmin, createReturn);
router.post('/:id/process', requireManagerOrAdmin, processReturn);
router.put('/:id/status', requireManagerOrAdmin, updateReturnStatus);
router.delete('/:id', requireManagerOrAdmin, deleteReturn);

module.exports = router;
