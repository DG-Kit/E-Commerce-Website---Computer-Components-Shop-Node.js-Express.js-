const express = require('express');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
const CategoryCtrl = require('../controllers/categoryController');
const router = express.Router();

// Thêm danh mục
router.post('/add', verifyToken, verifyAdmin, CategoryCtrl.addCategory);

// Lấy danh sách danh mục
router.get('/', CategoryCtrl.getCategories);

// Sửa danh mục
router.put('/update', verifyToken, verifyAdmin, CategoryCtrl.updateCategory);

// Xóa danh mục
router.delete('/delete', verifyToken, verifyAdmin, CategoryCtrl.deleteCategory);

module.exports = router;