const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middlewares/authMiddleware');

/**
 * @route   POST /api/payment/create-vnpay-url
 * @desc    Tạo URL thanh toán VNPay
 * @access  Private
 */
router.post('/create-vnpay-url', authenticate, paymentController.createVNPayUrl);

/**
 * @route   GET /api/payment/vnpay-return
 * @desc    Xử lý callback từ VNPay
 * @access  Public
 */
router.get('/vnpay-return', paymentController.vnpayReturn);

/**
 * @route   GET /api/payment/history
 * @desc    Lấy lịch sử thanh toán của người dùng
 * @access  Private
 */
router.get('/history', authenticate, paymentController.getPaymentHistory);

module.exports = router;