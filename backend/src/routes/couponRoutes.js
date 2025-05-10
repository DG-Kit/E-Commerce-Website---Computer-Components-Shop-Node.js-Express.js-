const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

// Routes dành cho Admin
// Tạo mã giảm giá mới
router.post('/create', verifyToken, verifyAdmin, couponController.createCoupon);

// Lấy tất cả mã giảm giá
router.get('/all', verifyToken, verifyAdmin, couponController.getAllCoupons);

// Lấy chi tiết mã giảm giá
router.get('/:couponId', verifyToken, verifyAdmin, couponController.getCouponDetails);

// Cập nhật trạng thái mã giảm giá
router.patch('/:couponId/status', verifyToken, verifyAdmin, couponController.updateCouponStatus);

// Xóa mã giảm giá
router.delete('/:couponId', verifyToken, verifyAdmin, couponController.deleteCoupon);

// Routes dành cho tất cả người dùng
// Kiểm tra tính hợp lệ của mã giảm giá
router.post('/verify', verifyToken, couponController.verifyCoupon);

module.exports = router; 