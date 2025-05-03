const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  fullName: String,
  street: String,
  city: String,
  district: String,
  postalCode: String,
  country: String,
  phoneNumber: String,
  isDefault: { type: Boolean, default: false }
}, { _id: true }); // Thêm _id tự động cho mỗi địa chỉ

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  provider: { type: String, enum: ['local', 'google', 'facebook'], default: 'local' },
  addresses: [addressSchema], // Mảng địa chỉ
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  points: { type: Number, default: 0 },
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
