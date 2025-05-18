const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }, 
  stock: { type: Number, required: true, default: 0 },
  isActive: { type: Boolean, default: true },
  images: [{ type: String }],
  attributes: {
    brand: { type: String },
    model: { type: String },
    warranty: { type: String },
    color: { type: String }
  },
  specifications: [
    {
      name: { type: String },
      value: { type: String }
    }
  ],
  variants: [
    {
      name: { type: String },
      stock: { type: Number },
      price: { type: Number },
      discountPercentage: { type: Number, default: 0 }, 
    }
  ],
  minPrice: { type: Number, default: 0 },
  discountPercentage: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);