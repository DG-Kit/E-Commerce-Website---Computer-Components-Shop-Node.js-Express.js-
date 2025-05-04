const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  brand: { type: String, required: true },
  category: { type: String, required: true },
  stock: { type: Number, required: true },
  images: [{ type: String }], // URLs của hình ảnh
  variants: [
    {
      name: String,
      stock: Number,
      price: Number,
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);