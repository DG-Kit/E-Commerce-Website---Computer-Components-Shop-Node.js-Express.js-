const express = require('express');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
const ProductCtrl = require('../controllers/productController');
const router = express.Router();

// Lấy danh sách sản phẩm
router.get('/', ProductCtrl.getProducts);

// Lấy chi tiết sản phẩm
router.get('/:productId', ProductCtrl.getProductById);

// Thêm sản phẩm
router.post('/add', verifyToken, verifyAdmin, ProductCtrl.addProduct);

// Sửa sản phẩm
router.put('/update', verifyToken, verifyAdmin, ProductCtrl.updateProduct);

// Xóa sản phẩm
router.delete('/delete', verifyToken, verifyAdmin, ProductCtrl.deleteProduct);

module.exports = router;