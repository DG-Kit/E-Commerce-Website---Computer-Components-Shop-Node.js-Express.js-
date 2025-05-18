const Product = require('../models/Product');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { uploadFile } = require('../utils/fileUpload');
const cloudinary = require('../utils/cloudinary');

/**
 * @desc    Lấy danh sách sản phẩm có phân trang, tìm kiếm và lọc
 * @route   GET /api/admin/products
 * @access  Private/Admin
 */
const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';

    // Xây dựng query từ các tham số
    const query = {};
    
    // Thêm filter tìm kiếm
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Thêm filter danh mục
    if (category) {
      query.category = mongoose.Types.ObjectId(category);
    }

    // Đếm tổng số sản phẩm
    const totalProducts = await Product.countDocuments(query);
    
    // Lấy sản phẩm với phân trang
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    // Ensure all price fields are numbers
    const formattedProducts = products.map(product => {
      const productObj = product.toObject();
      
      // Ensure price and related fields are numbers
      productObj.price = Number(productObj.price);
      if (productObj.salePrice !== null && productObj.salePrice !== undefined) {
        productObj.salePrice = Number(productObj.salePrice);
      }
      if (productObj.minPrice !== null && productObj.minPrice !== undefined) {
        productObj.minPrice = Number(productObj.minPrice);
      }
      
      // Ensure variants have proper number values
      if (productObj.variants && Array.isArray(productObj.variants)) {
        productObj.variants = productObj.variants.map(variant => {
          return {
            ...variant,
            price: Number(variant.price || 0),
            stock: Number(variant.stock || 0),
            discountPercentage: Number(variant.discountPercentage || 0)
          };
        });
      } else {
        // If no variants exist, create a default one based on the main product
        productObj.variants = [{
          name: "Mặc định",
          price: productObj.price,
          stock: productObj.stock,
          discountPercentage: productObj.discountPercentage || 0
        }];
      }
      
      return productObj;
    });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách sản phẩm thành công',
      data: {
        products: formattedProducts,
        page,
        limit,
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi lấy danh sách sản phẩm',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy chi tiết một sản phẩm theo ID
 * @route   GET /api/admin/products/:id
 * @access  Private/Admin
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }
    
    const product = await Product.findById(id).populate('category', 'name');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    // Ensure price fields are numbers
    const formattedProduct = product.toObject();
    formattedProduct.price = Number(formattedProduct.price);
    
    if (formattedProduct.salePrice !== null && formattedProduct.salePrice !== undefined) {
      formattedProduct.salePrice = Number(formattedProduct.salePrice);
    }
    
    if (formattedProduct.minPrice !== null && formattedProduct.minPrice !== undefined) {
      formattedProduct.minPrice = Number(formattedProduct.minPrice);
    }
    
    // Ensure variants have proper number values
    if (formattedProduct.variants && Array.isArray(formattedProduct.variants)) {
      formattedProduct.variants = formattedProduct.variants.map(variant => {
        return {
          ...variant,
          price: Number(variant.price || 0),
          stock: Number(variant.stock || 0),
          discountPercentage: Number(variant.discountPercentage || 0)
        };
      });
    } else {
      // If no variants exist, create a default one based on the main product
      formattedProduct.variants = [{
        name: "Mặc định",
        price: formattedProduct.price,
        stock: formattedProduct.stock,
        discountPercentage: formattedProduct.discountPercentage || 0
      }];
    }
    
    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin sản phẩm thành công',
      data: formattedProduct
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi lấy thông tin sản phẩm',
      error: error.message
    });
  }
};

/**
 * @desc    Tạo sản phẩm mới
 * @route   POST /api/admin/products
 * @access  Private/Admin
 */
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      salePrice,
      category,
      stock,
      sku,
      isActive,
      images,
      attributes,
      specifications,
      variants
    } = req.body;
    
    // Validate đầu vào
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin sản phẩm'
      });
    }
    
    // Kiểm tra danh mục hợp lệ
    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({
        success: false,
        message: 'ID danh mục không hợp lệ'
      });
    }
    
    // Kiểm tra danh mục tồn tại
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: 'Danh mục không tồn tại'
      });
    }
    
    // Ensure price is a number
    const productPrice = Number(price);
    const productSalePrice = salePrice ? Number(salePrice) : undefined;
    const productStock = Number(stock || 0);
    
    // Set minPrice to match price for consistent pricing
    const minPrice = productPrice;
    
    // Process variants if provided
    let processedVariants = [];
    if (variants && Array.isArray(variants) && variants.length > 0) {
      processedVariants = variants.map(variant => ({
        name: variant.name,
        price: Number(variant.price || productPrice),
        stock: Number(variant.stock || 0),
        discountPercentage: Number(variant.discountPercentage || 0)
      }));
    } else {
      // Create default variant if none provided
      processedVariants = [{
        name: "Mặc định",
        price: productPrice,
        stock: productStock,
        discountPercentage: 0
      }];
    }
    
    // Tạo sản phẩm mới
    const newProduct = await Product.create({
      name,
      description,
      price: productPrice,
      salePrice: productSalePrice,
      minPrice,
      category,
      stock: productStock,
      sku,
      isActive,
      images,
      attributes,
      specifications,
      variants: processedVariants
    });
    
    return res.status(201).json({
      success: true,
      message: 'Tạo sản phẩm thành công',
      data: newProduct
    });
  } catch (error) {
    console.error('Lỗi khi tạo sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi tạo sản phẩm',
      error: error.message
    });
  }
};

/**
 * @desc    Cập nhật thông tin sản phẩm
 * @route   PUT /api/admin/products/:id
 * @access  Private/Admin
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }
    
    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    // Nếu có category và được thay đổi, kiểm tra danh mục hợp lệ
    if (req.body.category && req.body.category !== product.category.toString()) {
      if (!mongoose.Types.ObjectId.isValid(req.body.category)) {
        return res.status(400).json({
          success: false,
          message: 'ID danh mục không hợp lệ'
        });
      }
      
      const categoryExists = await Category.findById(req.body.category);
      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: 'Danh mục không tồn tại'
        });
      }
    }
    
    // Process price and salePrice if provided
    const updateData = { ...req.body };
    
    if (updateData.price !== undefined) {
      updateData.price = Number(updateData.price);
      // Update minPrice to match price for consistent pricing
      updateData.minPrice = updateData.price;
    }
    
    if (updateData.salePrice !== undefined) {
      updateData.salePrice = updateData.salePrice ? Number(updateData.salePrice) : null;
    }
    
    if (updateData.stock !== undefined) {
      updateData.stock = Number(updateData.stock);
    }
    
    // Process variants if provided
    if (updateData.variants) {
      if (Array.isArray(updateData.variants) && updateData.variants.length > 0) {
        updateData.variants = updateData.variants.map(variant => ({
          name: variant.name,
          price: Number(variant.price || updateData.price || product.price),
          stock: Number(variant.stock || 0),
          discountPercentage: Number(variant.discountPercentage || 0)
        }));
      } else {
        // Create default variant if empty array is provided
        updateData.variants = [{
          name: "Mặc định",
          price: updateData.price || product.price,
          stock: updateData.stock || product.stock,
          discountPercentage: 0
        }];
      }
    }
    
    // Cập nhật sản phẩm
    const updatedProduct = await Product.findByIdAndUpdate(
      id, 
      updateData,
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi cập nhật sản phẩm',
      error: error.message
    });
  }
};

/**
 * @desc    Xóa sản phẩm
 * @route   DELETE /api/admin/products/:id
 * @access  Private/Admin
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }
    
    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    // Xóa sản phẩm
    await Product.findByIdAndDelete(id);
    
    return res.status(200).json({
      success: true,
      message: 'Xóa sản phẩm thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi xóa sản phẩm',
      error: error.message
    });
  }
};

/**
 * @desc    Thay đổi trạng thái hiển thị sản phẩm
 * @route   PUT /api/admin/products/:id/toggle-status
 * @access  Private/Admin
 */
const toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }
    
    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    // Đảo ngược trạng thái
    product.isActive = !product.isActive;
    await product.save();
    
    return res.status(200).json({
      success: true,
      message: `Sản phẩm đã được ${product.isActive ? 'kích hoạt' : 'vô hiệu hóa'} thành công`,
      data: {
        isActive: product.isActive
      }
    });
  } catch (error) {
    console.error('Lỗi khi thay đổi trạng thái sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi thay đổi trạng thái sản phẩm',
      error: error.message
    });
  }
};

/**
 * @desc    Tải lên hình ảnh sản phẩm
 * @route   POST /api/admin/upload
 * @access  Private/Admin
 */
const uploadProductImages = async (req, res) => {
  try {
    if (!req.files || !req.files.images) {
      return res.status(400).json({
        success: false,
        message: 'Không có file tải lên'
      });
    }
    
    let imageFiles = req.files.images;
    
    // Đảm bảo imageFiles luôn là một mảng
    if (!Array.isArray(imageFiles)) {
      imageFiles = [imageFiles];
    }
    
    // Kiểm tra số lượng file tải lên (tối đa 5 file)
    if (imageFiles.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ được tải lên tối đa 5 hình ảnh'
      });
    }
    
    // Kiểm tra định dạng file
    for (const file of imageFiles) {
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({
          success: false,
          message: 'Chỉ chấp nhận file hình ảnh'
        });
      }
      
      // Kiểm tra kích thước file (tối đa 2MB mỗi file)
      if (file.size > 2 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'Kích thước file không được vượt quá 2MB'
        });
      }
    }
    
    // Tải lên các file lên Cloudinary
    const uploadPromises = imageFiles.map(file => {
      return new Promise((resolve, reject) => {
        // Tạo đường dẫn tạm thời để lưu file
        const tempFilePath = `./public/uploads/temp/${Date.now()}_${file.name}`;
        
        // Đảm bảo thư mục tồn tại
        const tempDir = path.dirname(tempFilePath);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Lưu file tạm thời
        file.mv(tempFilePath, async (err) => {
          if (err) {
            console.error('Lỗi khi lưu file tạm thời:', err);
            return reject(err);
          }
          
          try {
            // Upload lên Cloudinary
            const result = await cloudinary.uploader.upload(tempFilePath, {
              folder: 'products',
              use_filename: true,
              unique_filename: true,
              overwrite: false,
              resource_type: 'image'
            });
            
            // Xóa file tạm sau khi upload
            fs.unlinkSync(tempFilePath);
            
            // Trả về URL của file đã tải
            resolve(result.secure_url);
          } catch (uploadError) {
            console.error('Lỗi khi upload lên Cloudinary:', uploadError);
            
            // Xóa file tạm nếu có lỗi
            if (fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath);
            }
            
            reject(uploadError);
          }
        });
      });
    });
    
    const uploadedUrls = await Promise.all(uploadPromises);
    
    return res.status(200).json({
      success: true,
      message: 'Tải lên hình ảnh thành công',
      data: {
        urls: uploadedUrls
      }
    });
  } catch (error) {
    console.error('Lỗi khi tải lên hình ảnh:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi tải lên hình ảnh',
      error: error.message
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  uploadProductImages
}; 