const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');


router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);
router.get('/me', verifyToken, authCtrl.getProfile);
router.put('/change-password', verifyToken, authCtrl.changePassword);
router.post('/forgot-password', authCtrl.forgotPassword);
router.post('/reset-password', authCtrl.resetPassword);

module.exports = router;
