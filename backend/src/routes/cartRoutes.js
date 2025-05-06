const express = require('express');
const { verifyToken } = require('../middlewares/authMiddleware');
const CartCtrl = require('../controllers/cartController');
const router = express.Router();

// Thêm sản phẩm vào giỏ hàng
router.post('/add', verifyToken, CartCtrl.addToCart);

// Cập nhật số lượng sản phẩm trong giỏ hàng
router.put('/update', verifyToken, CartCtrl.updateCartItem);

// Xóa sản phẩm khỏi giỏ hàng
router.delete('/remove', verifyToken, CartCtrl.removeFromCart);

// Lấy thông tin giỏ hàng
router.get('/', verifyToken, CartCtrl.getCart);

module.exports = router;