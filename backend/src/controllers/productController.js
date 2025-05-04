const Product = require('../models/Product');

// Thêm sản phẩm
exports.addProduct = async (req, res) => {
  try {
    const { name, description, price, brand, category, stock, images, variants } = req.body;

    const newProduct = new Product({
      name,
      description,
      price,
      brand,
      category,
      stock,
      images,
      variants,
    });

    await newProduct.save();
    res.status(201).json({ msg: 'Thêm sản phẩm thành công', product: newProduct });
  } catch (error) {
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};

// Sửa sản phẩm
exports.updateProduct = async (req, res) => {
  try {
    const { productId, updates } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(productId, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return res.status(404).json({ msg: 'Sản phẩm không tồn tại' });
    }

    res.status(200).json({ msg: 'Cập nhật sản phẩm thành công', product: updatedProduct });
  } catch (error) {
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
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice); // Giá tối thiểu
      if (maxPrice) filter.price.$lte = Number(maxPrice); // Giá tối đa
    }

    // Tính toán phân trang
    const skip = (page - 1) * limit;

    // Sắp xếp
    const sortOptions = {};
    if (sort) {
      const [key, order] = sort.split(':'); // Ví dụ: "price:asc" hoặc "price:desc"
      sortOptions[key] = order === 'desc' ? -1 : 1;
    }

    // Lấy danh sách sản phẩm
    const products = await Product.find(filter)
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

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ msg: 'Sản phẩm không tồn tại' });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};