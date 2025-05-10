const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
// Các route liên quan đến xác thực người dùng
// Đăng ký tài khoản
router.post('/register', authCtrl.register);

// Đăng nhập tài khoản
router.post('/login', authCtrl.login);

// Đăng xuất tài khoản
router.post('/logout', verifyToken, authCtrl.logout);

// Xem Profile người dùng
router.get('/me', verifyToken, authCtrl.getProfile);

// Thay đổi mật khẩu
router.put('/change-password', verifyToken, authCtrl.changePassword);

// Quên mật khẩu
router.post('/forgot-password', authCtrl.forgotPassword);

// Đặt lại mật khẩu
router.post('/reset-password', authCtrl.resetPassword);

// Cập nhật thông tin cá nhân
router.put('/update-profile', verifyToken, authCtrl.updateProfile);

// Thêm địa chỉ giao hàng
router.post('/add-address', verifyToken, authCtrl.addAddress);

// Sửa địa chỉ giao hàng
router.put('/update-address', verifyToken, authCtrl.updateAddress);

// Xóa địa chỉ giao hàng
router.delete('/delete-address', verifyToken, authCtrl.deleteAddress);

// Lấy danh sách người dùng (chỉ admin)
router.get('/all-users', verifyToken, verifyAdmin, authCtrl.getAllUsers);

// Cập nhật thông tin người dùng (chỉ admin)
router.put('/update-user', verifyToken, verifyAdmin, authCtrl.updateUserByAdmin);

// Xóa người dùng (chỉ admin)
router.delete('/delete-user', verifyToken, verifyAdmin, authCtrl.deleteUser);

module.exports = router;
