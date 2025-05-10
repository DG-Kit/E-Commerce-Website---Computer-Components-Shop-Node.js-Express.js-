const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    match: /^[A-Z0-9]{5}$/ // Bắt buộc 5 ký tự chữ hoa hoặc số
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ['PERCENTAGE', 'FIXED'], // Giảm theo % hoặc số tiền cố định
    default: 'PERCENTAGE'
  },
  maxUses: {
    type: Number,
    required: true,
    default: 1,
    max: 10 // Tối đa 10 lần sử dụng
  },
  currentUses: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usedBy: [{
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    usedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Kiểm tra xem mã giảm giá còn hiệu lực hay không
couponSchema.methods.isValid = function() {
  return this.isActive && this.currentUses < this.maxUses;
};

// Tính toán số tiền giảm
couponSchema.methods.calculateDiscount = function(amount) {
  if (this.type === 'PERCENTAGE') {
    // Giảm theo phần trăm, tối đa 100%
    const percentage = Math.min(this.value, 100);
    return (amount * percentage) / 100;
  } else {
    // Giảm số tiền cố định, nhưng không vượt quá tổng đơn hàng
    return Math.min(this.value, amount);
  }
};

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon; 