const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, verifyAdmin } = require('../middlewares/authMiddleware');

// Middleware to check admin authorization
const adminAuth = [authenticate, verifyAdmin];

/**
 * @route   GET /api/admin/dashboard/stats
 * @desc    Lấy thống kê tổng quan cho dashboard
 * @access  Private/Admin
 */
router.get('/dashboard/stats', adminAuth, adminController.getDashboardStats);

/**
 * @route   GET /api/admin/dashboard/recent-orders
 * @desc    Lấy danh sách đơn hàng gần đây
 * @access  Private/Admin
 */
router.get('/dashboard/recent-orders', adminAuth, adminController.getRecentOrders);

/**
 * @route   GET /api/admin/dashboard/best-sellers
 * @desc    Lấy danh sách sản phẩm bán chạy
 * @access  Private/Admin
 */
router.get('/dashboard/best-sellers', adminAuth, adminController.getBestSellingProducts);

/**
 * @route   GET /api/admin/dashboard/revenue
 * @desc    Lấy dữ liệu doanh thu theo khoảng thời gian
 * @access  Private/Admin
 */
router.get('/dashboard/revenue', adminAuth, adminController.getRevenueData);

module.exports = router; 