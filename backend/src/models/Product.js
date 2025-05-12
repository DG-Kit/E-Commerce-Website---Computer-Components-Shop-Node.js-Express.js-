const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }, 
  stock: { type: Number, required: true },
  images: [{ type: String }],
  variants: [
    {
      name: { type: String, required: true },
      stock: { type: Number, required: true },
      price: { type: Number, required: true },
      discountPercentage: { type: Number, default: 0 }, 
    },
  ],
  minPrice: { type: Number, default: 0 },
  discountPercentage: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);