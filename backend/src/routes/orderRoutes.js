const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middlewares/authMiddleware');
const { verifyAdmin } = require('../middlewares/authMiddleware');

/**
 * @route   POST /api/orders
 * @desc    Tạo đơn hàng mới
 * @access  Private
 */
router.post('/', authenticate, orderController.createOrder);

/**
 * @route   GET /api/orders
 * @desc    Lấy tất cả đơn hàng của người dùng hiện tại
 * @access  Private
 */
router.get('/', authenticate, orderController.getUserOrders);

/**
 * @route   GET /api/orders/user
 * @desc    Lấy tất cả đơn hàng của người dùng hiện tại (với phân trang)
 * @access  Private
 */
router.get('/user', authenticate, orderController.getUserOrders);

/**
 * @route   GET /api/orders/:orderId
 * @desc    Lấy chi tiết một đơn hàng
 * @access  Private
 */
router.get('/:orderId', authenticate, orderController.getOrderDetails);

/**
 * @route   PATCH /api/orders/:orderId/status
 * @desc    Cập nhật trạng thái đơn hàng (chỉ cho admin)
 * @access  Private/Admin
 */
router.patch('/:orderId/status', authenticate, verifyAdmin, orderController.updateOrderStatus);

/**
 * @route   GET /api/orders/admin/all
 * @desc    Lấy tất cả đơn hàng (chỉ cho admin)
 * @access  Private/Admin
 */
router.get('/admin/all', authenticate, verifyAdmin, orderController.getAllOrders);

module.exports = router; 