const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: String, required: true },
  stock: { type: Number, required: true },
  images: [{ type: String }],
  variants: [
    {
      name: { type: String, required: true },
      stock: { type: Number, required: true },
      price: { type: Number, required: true },
    },
  ],
  minPrice: { type: Number, default: 0 }, // Giá thấp nhất của sản phẩm
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);