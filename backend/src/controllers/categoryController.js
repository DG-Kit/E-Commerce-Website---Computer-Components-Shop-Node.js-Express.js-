const Category = require('../models/Category');

// Thêm danh mục
exports.addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const newCategory = new Category({ name, description });
    await newCategory.save();

    res.status(201).json({ msg: 'Thêm danh mục thành công', category: newCategory });
  } catch (error) {
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};

// Lấy danh sách danh mục
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};

// Sửa danh mục
exports.updateCategory = async (req, res) => {
  try {
    const { categoryId, updates } = req.body;

    const updatedCategory = await Category.findByIdAndUpdate(categoryId, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedCategory) {
      return res.status(404).json({ msg: 'Danh mục không tồn tại' });
    }

    res.status(200).json({ msg: 'Cập nhật danh mục thành công', category: updatedCategory });
  } catch (error) {
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};

// Xóa danh mục
exports.deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.body;

    const deletedCategory = await Category.findByIdAndDelete(categoryId);

    if (!deletedCategory) {
      return res.status(404).json({ msg: 'Danh mục không tồn tại' });
    }

    res.status(200).json({ msg: 'Xóa danh mục thành công' });
  } catch (error) {
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};