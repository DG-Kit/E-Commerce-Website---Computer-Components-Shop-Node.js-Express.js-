const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

exports.register = async (req, res) => {
    try {
        const { fullName, email, password, role, secretKey } = req.body;

        // Kiểm tra nếu email đã tồn tại
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ msg: 'Email đã được sử dụng' });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Kiểm tra nếu tạo tài khoản admin
        let userRole = role || 'customer'; // Mặc định là 'customer'
        if (role === 'admin') {
            if (secretKey !== process.env.ADMIN_SECRET_KEY) {
                return res.status(403).json({ msg: 'Không có quyền tạo tài khoản admin' });
            }
        }

        // Tạo user mới
        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
            role: userRole,
        });

        await newUser.save();

        res.status(201).json({ msg: 'Đăng ký thành công', user: newUser });
    } catch (error) {
        res.status(500).json({ msg: 'Lỗi server', error: error.message });
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

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id; // Lấy userId từ token
        const { fullName, phoneNumber, addresses } = req.body;

        // Cập nhật thông tin người dùng
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { fullName, phoneNumber, addresses },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ msg: 'Người dùng không tồn tại' });
        }

        res.status(200).json({
            msg: 'Cập nhật thông tin cá nhân thành công',
            user: updatedUser,
        });
    } catch (error) {
        res.status(500).json({ msg: 'Lỗi server', error: error.message });
    }
};

// Thêm địa chỉ giao hàng
exports.addAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const newAddress = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'Người dùng không tồn tại' });

        user.addresses.push(newAddress);
        await user.save();

        res.status(201).json({ msg: 'Thêm địa chỉ thành công', addresses: user.addresses });
    } catch (error) {
        res.status(500).json({ msg: 'Lỗi server', error: error.message });
    }
};

// Sửa địa chỉ giao hàng
exports.updateAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { addressId, ...updatedAddress } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'Người dùng không tồn tại' });

        const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
        if (addressIndex === -1) return res.status(404).json({ msg: 'Địa chỉ không tồn tại' });

        // If this is set as default, update other addresses
        if (updatedAddress.isDefault) {
            user.addresses.forEach((addr, idx) => {
                if (idx !== addressIndex) {
                    addr.isDefault = false;
                }
            });
        }

        // Update the address fields
        Object.keys(updatedAddress).forEach(key => {
            user.addresses[addressIndex][key] = updatedAddress[key];
        });

        await user.save();

        res.status(200).json({ msg: 'Cập nhật địa chỉ thành công', addresses: user.addresses });
    } catch (error) {
        res.status(500).json({ msg: 'Lỗi server', error: error.message });
    }
};

// Xóa địa chỉ giao hàng
exports.deleteAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { addressId } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'Người dùng không tồn tại' });

        user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);
        await user.save();

        res.status(200).json({ msg: 'Xóa địa chỉ thành công', addresses: user.addresses });
    } catch (error) {
        res.status(500).json({ msg: 'Lỗi server', error: error.message });
    }
};

// Lấy danh sách người dùng
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Không trả về mật khẩu
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ msg: 'Lỗi server', error: error.message });
    }
};

// Cập nhật thông tin người dùng (dành cho admin)
exports.updateUserByAdmin = async (req, res) => {
    try {
        const { userId, updates } = req.body;

        const updatedUser = await User.findByIdAndUpdate(userId, updates, {
            new: true,
            runValidators: true,
        });

        if (!updatedUser) {
            return res.status(404).json({ msg: 'Người dùng không tồn tại' });
        }

        res.status(200).json({ msg: 'Cập nhật người dùng thành công', user: updatedUser });
    } catch (error) {
        res.status(500).json({ msg: 'Lỗi server', error: error.message });
    }
};

// Xóa người dùng
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.body;
        await User.findByIdAndDelete(userId);
        res.status(200).json({ msg: 'Xóa người dùng thành công' });
    } catch (error) {
        res.status(500).json({ msg: 'Lỗi server', error: error.message });
    }
};

// Thêm controller logout
// Trong JWT, chúng ta cần lưu token đã đăng xuất vào blacklist
// để ngăn chặn việc sử dụng token đó sau khi đăng xuất
// Blacklist có thể lưu trong Redis, hoặc MongoDB cho đơn giản
exports.logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(400).json({ msg: 'Không có token' });
        }

        // Giải mã token để lấy thời gian hết hạn
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const expiryTime = decoded.exp;
        
        // Lưu token vào blacklist
        // Trong ví dụ này, chúng ta tạo một model mới để lưu token đã vô hiệu hóa
        // Nhưng bạn có thể sử dụng Redis cho giải pháp tốt hơn về hiệu suất
        const BlacklistedToken = require('../models/BlacklistedToken');
        await new BlacklistedToken({
            token,
            expiresAt: new Date(expiryTime * 1000) // Convert timestamp to Date
        }).save();

        res.status(200).json({ msg: 'Đăng xuất thành công' });
    } catch (error) {
        // Nếu token không hợp lệ, vẫn coi như đã đăng xuất thành công
        if (error.name === 'JsonWebTokenError') {
            return res.status(200).json({ msg: 'Đăng xuất thành công' });
        }
        res.status(500).json({ msg: 'Lỗi server', error: error.message });
    }
};
