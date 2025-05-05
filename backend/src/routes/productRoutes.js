const express = require('express');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
const ProductCtrl = require('../controllers/productController');
const upload = require('../utils/multer');
const router = express.Router();

// Lấy danh sách sản phẩm
router.get('/', ProductCtrl.getProducts);

// Lấy chi tiết sản phẩm
router.get('/:productId', ProductCtrl.getProductById);

// Thêm sản phẩm với upload hình ảnh
router.post('/add', verifyToken, verifyAdmin, upload.array('images', 5), ProductCtrl.addProduct);

// Thêm variant sản phẩm
router.post('/add-variant', verifyToken, verifyAdmin, ProductCtrl.addVariantToProduct);

// Xóa variant sản phẩm
router.post('/delete-variant', verifyToken, verifyAdmin, ProductCtrl.addVariantToProduct);

// Sửa sản phẩm
router.put('/update', verifyToken, verifyAdmin, ProductCtrl.updateProduct);

// Xóa sản phẩm
router.delete('/delete', verifyToken, verifyAdmin, ProductCtrl.deleteProduct);

module.exports = router;