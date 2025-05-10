const Coupon = require('../models/Coupon');
const mongoose = require('mongoose');

/**
 * Tạo mã giảm giá mới (chỉ dành cho admin)
 * @param {Object} req Request - Yêu cầu phải có code, value, type và maxUses
 * @param {Object} res Response
 * @returns {Object} Thông tin mã giảm giá vừa tạo
 */
const createCoupon = async (req, res) => {
  try {
    const { code, value, type, maxUses } = req.body;

    // Kiểm tra trường bắt buộc
    if (!code || !value) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin mã giảm giá hoặc giá trị giảm'
      });
    }

    // Kiểm tra định dạng mã giảm giá
    const codeRegex = /^[A-Z0-9]{5}$/;
    if (!codeRegex.test(code.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá phải bao gồm 5 ký tự là chữ hoa hoặc số'
      });
    }

    // Kiểm tra mã giảm giá đã tồn tại
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá đã tồn tại'
      });
    }

    // Kiểm tra giá trị giảm giá
    if (value <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá trị giảm giá phải lớn hơn 0'
      });
    }

    // Kiểm tra loại giảm giá
    if (type && !['PERCENTAGE', 'FIXED'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Loại giảm giá không hợp lệ, phải là PERCENTAGE hoặc FIXED'
      });
    }

    // Kiểm tra số lần sử dụng tối đa
    if (maxUses && (maxUses <= 0 || maxUses > 10)) {
      return res.status(400).json({
        success: false,
        message: 'Số lần sử dụng tối đa phải nằm trong khoảng từ 1 đến 10'
      });
    }

    // Tạo mã giảm giá mới
    const newCoupon = new Coupon({
      code: code.toUpperCase(),
      value,
      type: type || 'PERCENTAGE',
      maxUses: maxUses || 1
    });

    // Lưu vào database
    await newCoupon.save();

    return res.status(201).json({
      success: true,
      message: 'Tạo mã giảm giá thành công',
      data: newCoupon
    });
  } catch (error) {
    console.error('Lỗi tạo mã giảm giá:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi tạo mã giảm giá'
    });
  }
};

/**
 * Lấy tất cả mã giảm giá (chỉ dành cho admin)
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Object} Danh sách mã giảm giá
 */
const getAllCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort, active } = req.query;
    
    // Tạo bộ lọc
    const filter = {};
    if (active !== undefined) filter.isActive = active === 'true';
    
    // Tính toán phân trang
    const skip = (page - 1) * limit;
    
    // Sắp xếp
    const sortOptions = {};
    if (sort) {
      const [key, order] = sort.split(':'); // Ví dụ: "createdAt:desc"
      sortOptions[key] = order === 'desc' ? -1 : 1;
    } else {
      // Mặc định sắp xếp theo thời gian tạo mới nhất
      sortOptions.createdAt = -1;
    }
    
    // Lấy tổng số mã giảm giá
    const totalCoupons = await Coupon.countDocuments(filter);
    
    // Lấy danh sách mã giảm giá
    const coupons = await Coupon.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách mã giảm giá thành công',
      data: {
        coupons,
        pagination: {
          total: totalCoupons,
          page: Number(page),
          pageSize: Number(limit),
          pages: Math.ceil(totalCoupons / limit)
        }
      }
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách mã giảm giá:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi lấy danh sách mã giảm giá'
    });
  }
};

/**
 * Lấy chi tiết một mã giảm giá (chỉ dành cho admin)
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Object} Chi tiết mã giảm giá và lịch sử sử dụng
 */
const getCouponDetails = async (req, res) => {
  try {
    const { couponId } = req.params;
    
    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      return res.status(400).json({
        success: false,
        message: 'ID mã giảm giá không hợp lệ'
      });
    }
    
    // Lấy thông tin mã giảm giá và populate danh sách đơn hàng đã sử dụng
    const coupon = await Coupon.findById(couponId)
      .populate({
        path: 'usedBy.orderId',
        select: 'totalAmount status createdAt'
      })
      .populate({
        path: 'usedBy.userId',
        select: 'email fullName'
      });
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Lấy chi tiết mã giảm giá thành công',
      data: coupon
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết mã giảm giá:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi lấy chi tiết mã giảm giá'
    });
  }
};

/**
 * Cập nhật trạng thái mã giảm giá (chỉ dành cho admin)
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Object} Thông tin mã giảm giá sau khi cập nhật
 */
const updateCouponStatus = async (req, res) => {
  try {
    const { couponId } = req.params;
    const { isActive } = req.body;
    
    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      return res.status(400).json({
        success: false,
        message: 'ID mã giảm giá không hợp lệ'
      });
    }
    
    // Kiểm tra trạng thái
    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin trạng thái mã giảm giá'
      });
    }
    
    // Cập nhật trạng thái
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      couponId,
      { isActive: Boolean(isActive) },
      { new: true }
    );
    
    if (!updatedCoupon) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái mã giảm giá thành công',
      data: updatedCoupon
    });
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái mã giảm giá:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi cập nhật trạng thái mã giảm giá'
    });
  }
};

/**
 * Xóa mã giảm giá (chỉ dành cho admin)
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Object} Thông báo kết quả
 */
const deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    
    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      return res.status(400).json({
        success: false,
        message: 'ID mã giảm giá không hợp lệ'
      });
    }
    
    // Xóa mã giảm giá
    const deletedCoupon = await Coupon.findByIdAndDelete(couponId);
    
    if (!deletedCoupon) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Xóa mã giảm giá thành công'
    });
  } catch (error) {
    console.error('Lỗi xóa mã giảm giá:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi xóa mã giảm giá'
    });
  }
};

/**
 * Kiểm tra tính hợp lệ của mã giảm giá
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Object} Thông tin mã giảm giá và số tiền giảm nếu hợp lệ
 */
const verifyCoupon = async (req, res) => {
  try {
    const { code, amount } = req.body;
    
    // Kiểm tra thông tin cần thiết
    if (!code || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu mã giảm giá hoặc giá trị đơn hàng'
      });
    }
    
    // Tìm mã giảm giá
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Mã giảm giá không tồn tại'
      });
    }
    
    // Kiểm tra tính hợp lệ
    if (!coupon.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá đã hết hiệu lực hoặc đã sử dụng hết số lần cho phép'
      });
    }
    
    // Tính toán số tiền giảm
    const discountAmount = coupon.calculateDiscount(amount);
    
    return res.status(200).json({
      success: true,
      message: 'Mã giảm giá hợp lệ',
      data: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountAmount
      }
    });
  } catch (error) {
    console.error('Lỗi kiểm tra mã giảm giá:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi kiểm tra mã giảm giá'
    });
  }
};

/**
 * Sử dụng mã giảm giá cho đơn hàng
 * Hàm này được gọi trong quá trình tạo đơn hàng, không phải là API riêng biệt
 * @param {String} code Mã giảm giá
 * @param {Number} amount Tổng đơn hàng
 * @param {String} orderId ID đơn hàng
 * @param {String} userId ID người dùng
 * @returns {Object} Thông tin mã giảm giá và số tiền giảm
 */
const applyCoupon = async (code, amount, orderId, userId) => {
  try {
    // Tìm mã giảm giá
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      throw new Error('Mã giảm giá không tồn tại');
    }
    
    // Kiểm tra tính hợp lệ
    if (!coupon.isValid()) {
      throw new Error('Mã giảm giá đã hết hiệu lực hoặc đã sử dụng hết số lần cho phép');
    }
    
    // Tính toán số tiền giảm
    const discountAmount = coupon.calculateDiscount(amount);
    
    // Cập nhật thông tin sử dụng
    coupon.currentUses += 1;
    coupon.usedBy.push({
      orderId,
      userId,
      usedAt: new Date()
    });
    
    await coupon.save();
    
    return {
      code: coupon.code,
      discountAmount
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createCoupon,
  getAllCoupons,
  getCouponDetails,
  updateCouponStatus,
  deleteCoupon,
  verifyCoupon,
  applyCoupon
}; 