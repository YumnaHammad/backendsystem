const express = require('express');
const router = express.Router();
const { getDashboardSummary, getModuleAnalytics } = require('../controllers/dashboardController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// @route   GET /api/dashboard/summary
// @desc    Get dashboard summary (admin only)
// @access  Private (Admin only)
router.get('/summary', authenticateToken, requireAdmin, getDashboardSummary);

// @route   GET /api/dashboard/analytics/:module
// @desc    Get module-specific analytics (admin only)
// @access  Private (Admin only)
router.get('/analytics/:module', authenticateToken, requireAdmin, getModuleAnalytics);

module.exports = router;
