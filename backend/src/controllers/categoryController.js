const Category = require('../models/Category');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Thêm danh mục
exports.addCategory = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      parent, 
      icon, 
      image, 
      orderIndex,
      attributes,
      meta
    } = req.body;

    // Xử lý attributes - kiểm tra nếu là string thì parse, nếu là object thì giữ nguyên
    let parsedAttributes = attributes;
    if (attributes) {
      if (typeof attributes === 'string') {
        try {
          parsedAttributes = JSON.parse(attributes);
        } catch (e) {
          console.error('Error parsing attributes:', e);
          return res.status(400).json({ msg: 'Định dạng attributes không hợp lệ' });
        }
      }
    }

    // Xử lý meta - kiểm tra nếu là string thì parse, nếu là object thì giữ nguyên
    let parsedMeta = meta;
    if (meta) {
      if (typeof meta === 'string') {
        try {
          parsedMeta = JSON.parse(meta);
        } catch (e) {
          console.error('Error parsing meta:', e);
          return res.status(400).json({ msg: 'Định dạng meta không hợp lệ' });
        }
      }
    }

    // Tạo slug từ tên - không dựa vào middleware pre-save
    const convertToNonAccentVietnamese = (str) => {
      str = str.toLowerCase();
      str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
      str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
      str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
      str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
      str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
      str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
      str = str.replace(/đ/g, "d");
      return str;
    };

    const normalizedName = convertToNonAccentVietnamese(name);
    const slug = normalizedName
      .replace(/[^a-z0-9\-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Tạo slug từ tên (slug sẽ tự động tạo trong pre save middleware)
    const category = new Category({ 
      name, 
      description, 
      slug,
      parent, 
      icon, 
      image, 
      orderIndex,
      attributes: parsedAttributes,
      meta: parsedMeta
    });

    // Nếu có danh mục cha, cập nhật level
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(400).json({ msg: 'Danh mục cha không tồn tại' });
      }
      category.level = parentCategory.level + 1;
    }

    await category.save();
    res.status(201).json({ msg: 'Thêm danh mục thành công', category });
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};

// Lấy danh sách danh mục
exports.getCategories = async (req, res) => {
  try {
    const { flat, parentId, withChildren, active } = req.query;
    
    let query = {};
    
    // Lọc theo danh mục cha nếu có
    if (parentId === 'null' || parentId === 'root') {
      query.parent = null;
    } else if (parentId) {
      query.parent = parentId;
    }
    
    // Lọc theo trạng thái active nếu có
    if (active === 'true') {
      query.isActive = true;
    } else if (active === 'false') {
      query.isActive = false;
    }
    
    // Nếu flat=true thì trả về danh sách phẳng, nếu không thì trả về dạng cây
    if (flat === 'true') {
      const categories = await Category.find(query)
        .sort({ orderIndex: 1, name: 1 });
      return res.status(200).json(categories);
    }
    
    // Trả về dạng cây (populate children)
    const categories = await Category.find(parentId ? query : { parent: null })
      .sort({ orderIndex: 1, name: 1 });
    
    if (withChildren === 'true') {
      const populatedCategories = await Promise.all(
        categories.map(async (category) => {
          const categoryObj = category.toObject();
          categoryObj.children = await getChildCategories(category._id);
          return categoryObj;
        })
      );
      return res.status(200).json(populatedCategories);
    }
    
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};

// Hàm trợ giúp lấy danh mục con đệ quy
const getChildCategories = async (parentId) => {
  const children = await Category.find({ parent: parentId })
    .sort({ orderIndex: 1, name: 1 });
  
  const populatedChildren = await Promise.all(
    children.map(async (child) => {
      const childObj = child.toObject();
      childObj.children = await getChildCategories(child._id);
      return childObj;
    })
  );
  
  return populatedChildren;
};

// Lấy chi tiết danh mục
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ msg: 'Danh mục không tồn tại' });
    }
    
    // Lấy danh mục con
    const children = await Category.find({ parent: id });
    
    // Lấy số lượng sản phẩm của danh mục
    const productCount = await Product.countDocuments({ category: id });
    
    // Nếu có parent, lấy thông tin parent
    let parentInfo = null;
    if (category.parent) {
      parentInfo = await Category.findById(category.parent, 'name slug');
    }
    
    const result = {
      ...category.toObject(),
      children,
      productCount,
      parentInfo
    };
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting category detail:', error);
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};

// Lấy danh mục theo slug
exports.getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const category = await Category.findOne({ slug });
    if (!category) {
      return res.status(404).json({ msg: 'Danh mục không tồn tại' });
    }
    
    // Lấy danh mục con
    const children = await Category.find({ parent: category._id });
    
    const result = {
      ...category.toObject(),
      children
    };
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting category by slug:', error);
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};

// Sửa danh mục
exports.updateCategory = async (req, res) => {
  try {
    const { categoryId, updates } = req.body;
    
    // Nếu có attributes hoặc meta, parse từ JSON
    if (updates.attributes && typeof updates.attributes === 'string') {
      updates.attributes = JSON.parse(updates.attributes);
    }
    if (updates.meta && typeof updates.meta === 'string') {
      updates.meta = JSON.parse(updates.meta);
    }
    
    // Kiểm tra và cập nhật level nếu parent thay đổi
    if (updates.parent) {
      const parentCategory = await Category.findById(updates.parent);
      if (!parentCategory) {
        return res.status(400).json({ msg: 'Danh mục cha không tồn tại' });
      }
      updates.level = parentCategory.level + 1;
    } else if (updates.parent === null) {
      updates.level = 0;
    }

    const updatedCategory = await Category.findByIdAndUpdate(categoryId, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedCategory) {
      return res.status(404).json({ msg: 'Danh mục không tồn tại' });
    }

    res.status(200).json({ msg: 'Cập nhật danh mục thành công', category: updatedCategory });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};

// Xóa danh mục
exports.deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.body;
    
    // Kiểm tra xem có danh mục con không
    const childrenCount = await Category.countDocuments({ parent: categoryId });
    if (childrenCount > 0) {
      return res.status(400).json({ 
        msg: 'Không thể xóa danh mục này vì có danh mục con. Vui lòng xóa các danh mục con trước.' 
      });
    }
    
    // Kiểm tra xem có sản phẩm trong danh mục không
    const productsCount = await Product.countDocuments({ category: categoryId });
    if (productsCount > 0) {
      return res.status(400).json({ 
        msg: `Không thể xóa danh mục này vì có ${productsCount} sản phẩm liên kết. Vui lòng di chuyển hoặc xóa các sản phẩm trước.` 
      });
    }

    const deletedCategory = await Category.findByIdAndDelete(categoryId);

    if (!deletedCategory) {
      return res.status(404).json({ msg: 'Danh mục không tồn tại' });
    }

    res.status(200).json({ msg: 'Xóa danh mục thành công' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};

// Get all brands for a category
exports.getCategoryBrands = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ msg: 'Danh mục không tồn tại' });
    }
    
    // Find brand attribute
    const brandAttribute = category.attributes.find(attr => 
      attr.name.toLowerCase() === 'thương hiệu');
    
    if (!brandAttribute) {
      return res.status(404).json({ msg: 'Danh mục này chưa có thuộc tính thương hiệu' });
    }
    
    res.status(200).json({
      categoryId: category._id,
      categoryName: category.name,
      brands: brandAttribute.values || []
    });
  } catch (error) {
    console.error('Lỗi server:', error);
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};

// Add a new brand to a category
exports.addCategoryBrand = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { brandName } = req.body;
    
    if (!brandName) {
      return res.status(400).json({ msg: 'Tên thương hiệu không được để trống' });
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ msg: 'Danh mục không tồn tại' });
    }
    
    // Find or create brand attribute
    let brandAttribute = category.attributes.find(attr => 
      attr.name.toLowerCase() === 'thương hiệu');
    
    if (!brandAttribute) {
      // Create new brand attribute
      brandAttribute = {
        name: 'Thương hiệu',
        values: [],
        isFilterable: true
      };
      category.attributes.push(brandAttribute);
    } else if (brandAttribute.values.includes(brandName)) {
      return res.status(400).json({ msg: 'Thương hiệu này đã tồn tại trong danh mục' });
    }
    
    // Add new brand value
    brandAttribute.values.push(brandName);
    
    await category.save();
    
    res.status(200).json({
      msg: 'Thêm thương hiệu thành công',
      categoryId: category._id,
      categoryName: category.name,
      brands: brandAttribute.values
    });
  } catch (error) {
    console.error('Lỗi server:', error);
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};