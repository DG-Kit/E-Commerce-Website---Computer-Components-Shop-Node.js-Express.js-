const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const productAdminController = require('../controllers/productAdminController');
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

/**
 * @route   GET /api/admin/products
 * @desc    Lấy danh sách sản phẩm với phân trang, tìm kiếm và lọc
 * @access  Private/Admin
 */
router.get('/products', adminAuth, productAdminController.getProducts);

/**
 * @route   GET /api/admin/products/:id
 * @desc    Lấy chi tiết một sản phẩm
 * @access  Private/Admin
 */
router.get('/products/:id', adminAuth, productAdminController.getProductById);

/**
 * @route   POST /api/admin/products
 * @desc    Tạo sản phẩm mới
 * @access  Private/Admin
 */
router.post('/products', adminAuth, productAdminController.createProduct);

/**
 * @route   PUT /api/admin/products/:id
 * @desc    Cập nhật thông tin sản phẩm
 * @access  Private/Admin
 */
router.put('/products/:id', adminAuth, productAdminController.updateProduct);

/**
 * @route   DELETE /api/admin/products/:id
 * @desc    Xóa sản phẩm
 * @access  Private/Admin
 */
router.delete('/products/:id', adminAuth, productAdminController.deleteProduct);

/**
 * @route   PUT /api/admin/products/:id/toggle-status
 * @desc    Thay đổi trạng thái hiển thị sản phẩm
 * @access  Private/Admin
 */
router.put('/products/:id/toggle-status', adminAuth, productAdminController.toggleProductStatus);

/**
 * @route   POST /api/admin/upload
 * @desc    Tải lên hình ảnh sản phẩm
 * @access  Private/Admin
 */
router.post('/upload', adminAuth, productAdminController.uploadProductImages);

module.exports = router; 