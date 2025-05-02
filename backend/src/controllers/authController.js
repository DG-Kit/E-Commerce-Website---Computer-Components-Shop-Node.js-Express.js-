const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

exports.register = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ msg: 'Email đã được sử dụng' });

        const hashed = await bcrypt.hash(password, 10);
        const user = new User({ fullName, email, password: hashed });
        await user.save();

        res.status(201).json({ msg: 'Tạo tài khoản thành công' });
    } catch (err) {
        res.status(500).json({ msg: 'Lỗi server', error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Tài khoản không tồn tại' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ msg: 'Sai mật khẩu' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        res.json({ token, user: { id: user._id, email: user.email, role: user.role, fullName: user.fullName } });
    } catch (err) {
        res.status(500).json({ msg: 'Lỗi server', error: err.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ msg: 'Lỗi server', error: err.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'Người dùng không tồn tại' });

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return res.status(400).json({ msg: 'Mật khẩu hiện tại không đúng' });

        const hashed = await bcrypt.hash(newPassword, 10);
        user.password = hashed;
        await user.save();

        res.json({ msg: 'Đổi mật khẩu thành công' });
    } catch (err) {
        res.status(500).json({ msg: 'Lỗi server', error: err.message });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Email không tồn tại' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 phút
    await user.save();

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Khôi phục mật khẩu',
        html: `<p>Nhấn vào <a href="${resetLink}">đây</a> để đặt lại mật khẩu. Liên kết hết hạn sau 15 phút.</p>`
    });

    res.json({ msg: 'Đã gửi email khôi phục mật khẩu' });
};

exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ msg: 'Token không hợp lệ hoặc đã hết hạn' });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ msg: 'Đặt lại mật khẩu thành công' });
};
