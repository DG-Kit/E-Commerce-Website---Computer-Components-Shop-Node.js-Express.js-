const Product = require('../models/Product');
const mongoose = require('mongoose');
const Category = require('../models/Category');

// Thêm sản phẩm
exports.addProduct = async (req, res) => {
  try {
    const { name, description, category, variants } = req.body;

    const images = req.files.map(file => file.path);
    
    // Parse variants với discountPercentage
    const parsedVariants = variants ? JSON.parse(variants) : [];
    
    // Tính stock tổng hợp từ variants
    const totalStock = parsedVariants.reduce((sum, variant) => sum + (variant.stock || 0), 0);

    // Xử lý category
    let categoryDoc;
    if (mongoose.Types.ObjectId.isValid(category)) {
      categoryDoc = await Category.findById(category);
    } else {
      categoryDoc = await Category.findOne({ name: category });
    }

    if (!categoryDoc) {
      return res.status(400).json({ msg: 'Danh mục không tồn tại. Vui lòng tạo danh mục trước.' });
    }

    // Tìm giá thấp nhất từ các variants
    const minPrice = parsedVariants.reduce((min, variant) => {
      return variant.price < min ? variant.price : min;
    }, Infinity);
    
    // Tìm % giảm giá trung bình (hoặc bạn có thể chọn cách khác để tính)
    const avgDiscountPercentage = parsedVariants.reduce((sum, variant) => 
      sum + (variant.discountPercentage || 0), 0) / parsedVariants.length || 0;

    const newProduct = new Product({
      name,
      description,
      category: categoryDoc._id,
      stock: totalStock,
      minPrice: minPrice || 0,
      images,
      variants: parsedVariants,
      discountPercentage: avgDiscountPercentage, // Thêm phần trăm giảm giá tổng thể
    });

    await newProduct.save();
    res.status(201).json({ msg: 'Thêm sản phẩm thành công', product: newProduct });
  } catch (error) {
    console.error('Lỗi server:', error);
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};

// Sửa sản phẩm
exports.updateProduct = async (req, res) => {
  try {
    const { productId, updates } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ msg: 'Sản phẩm không tồn tại' });
    }

    if (updates.variants) {
      let parsedVariants = updates.variants;

      if (typeof updates.variants === 'string') {
        parsedVariants = JSON.parse(updates.variants);
      }

      product.variants = parsedVariants;

      // Tính tổng số lượng từ các variants
      product.stock = parsedVariants.reduce((sum, variant) => sum + (variant.stock || 0), 0);

      // Tính giá thấp nhất từ các variants
      product.minPrice = parsedVariants.reduce((min, variant) => {
        return variant.price < min ? variant.price : min;
      }, Infinity);
    }

    Object.keys(updates).forEach((key) => {
      if (key !== 'variants') {
        product[key] = updates[key];
      }
    });

    await product.save();

    res.status(200).json({ msg: 'Cập nhật sản phẩm thành công', product });
  } catch (error) {
    console.error('Lỗi server:', error);
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};

// Xóa sản phẩm
exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.body;

    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({ msg: 'Sản phẩm không tồn tại' });
    }

    res.status(200).json({ msg: 'Xóa sản phẩm thành công' });
  } catch (error) {
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort, search, category, minPrice, maxPrice } = req.query;

    // Tạo bộ lọc
    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' }; // Tìm kiếm theo tên (không phân biệt hoa thường)
    if (category) filter.category = category; // Lọc theo danh mục
    
    // Cải thiện lọc giá để check cả giá variants và minPrice
    if (minPrice || maxPrice) {
      // Dùng $or để check cả minPrice và variant.price
      const priceFilters = [];
      
      // Điều kiện cho minPrice
      if (minPrice && maxPrice) {
        priceFilters.push({ minPrice: { $gte: Number(minPrice), $lte: Number(maxPrice) } });
      } else if (minPrice) {
        priceFilters.push({ minPrice: { $gte: Number(minPrice) } });
      } else if (maxPrice) {
        priceFilters.push({ minPrice: { $lte: Number(maxPrice) } });
      }
      
      // Điều kiện cho variant price
      if (minPrice && maxPrice) {
        priceFilters.push({ 'variants.price': { $gte: Number(minPrice), $lte: Number(maxPrice) } });
      } else if (minPrice) {
        priceFilters.push({ 'variants.price': { $gte: Number(minPrice) } });
      } else if (maxPrice) {
        priceFilters.push({ 'variants.price': { $lte: Number(maxPrice) } });
      }
      
      // Thêm điều kiện $or vào filter
      filter.$or = priceFilters;
    }

    // Tính toán phân trang
    const skip = (page - 1) * limit;

    // Sắp xếp
    const sortOptions = {};
    if (sort) {
      const [key, order] = sort.split(':'); // Ví dụ: "price:asc" hoặc "price:desc"
      sortOptions[key] = order === 'desc' ? -1 : 1;
    }

    // Lấy danh sách sản phẩm và populate danh mục
    const products = await Product.find(filter)
      .populate('category', 'name description') // Chỉ lấy các trường `name` và `description` từ Category
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    // Tổng số sản phẩm
    const totalProducts = await Product.countDocuments(filter);

    res.status(200).json({
      products,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    // Lấy sản phẩm và populate danh mục
    const product = await Product.findById(productId).populate('category', 'name description');
    if (!product) {
      return res.status(404).json({ msg: 'Sản phẩm không tồn tại' });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};

exports.addVariantToProduct = async (req, res) => {
  try {
    const { productId, variant } = req.body;

    // Tìm sản phẩm theo ID
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ msg: 'Sản phẩm không tồn tại' });
    }

    // Kiểm tra số lượng variant phải lớn hơn 0
    if (variant.stock <= 0) {
      return res.status(400).json({ msg: 'Số lượng của variant phải lớn hơn 0.' });
    }

    // Cập nhật số lượng sản phẩm (stock)
    product.stock += variant.stock;

    // Thêm variant mới vào danh sách variants
    product.variants.push(variant);

    // Lưu sản phẩm
    await product.save();

    res.status(200).json({ msg: 'Thêm variant thành công', product });
  } catch (error) {
    console.error('Lỗi server:', error);
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};

exports.deleteVariantFromProduct = async (req, res) => {
  try {
    const { productId, variantId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ msg: 'Sản phẩm không tồn tại' });
    }

    // Xóa variant
    product.variants = product.variants.filter(variant => variant._id.toString() !== variantId);

    // Tính lại stock
    product.stock = product.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);

    // Tính lại giá thấp nhất
    product.minPrice = product.variants.reduce((min, variant) => {
      return variant.price < min ? variant.price : min;
    }, Infinity);

    await product.save();

    res.status(200).json({ msg: 'Xóa variant thành công', product });
  } catch (error) {
    console.error('Lỗi server:', error);
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};