const express = require('express');
const router = express.Router();
const {
  updateDispatchStatus,
  getAllDispatches,
  getDispatchById
} = require('../controllers/dispatchController');
const { authenticateToken } = require('../middleware/auth');

// @route   GET /api/dispatches
// @desc    Get all dispatches
// @access  Private
router.get('/', authenticateToken, getAllDispatches);

// @route   GET /api/dispatches/:id
// @desc    Get dispatch by ID
// @access  Private
router.get('/:id', authenticateToken, getDispatchById);

// @route   PUT /api/dispatches/:id/status
// @desc    Update dispatch status
// @access  Private
router.put('/:id/status', authenticateToken, updateDispatchStatus);

module.exports = router;