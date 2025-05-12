const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true 
  },
  description: { 
    type: String 
  },
  parent: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category', 
    default: null 
  },
  level: { 
    type: Number, 
    default: 0 
  },
  orderIndex: { 
    type: Number, 
    default: 0 
  },
  icon: { 
    type: String 
  },
  image: { 
    type: String 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  attributes: [{ 
    name: { type: String, required: true },
    values: [{ type: String }],
    isFilterable: { type: Boolean, default: true }
  }],
  meta: {
    title: { type: String },
    description: { type: String },
    keywords: { type: String }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual để lấy danh sách danh mục con
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Tạo slug tự động từ tên danh mục
categorySchema.pre('save', function(next) {
  // Kiểm tra nếu là document mới hoặc name bị sửa đổi
  if (this.isNew || this.isModified('name')) {
    // Hàm chuyển đổi tiếng Việt có dấu thành không dấu
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

    const normalizedName = convertToNonAccentVietnamese(this.name);
    this.slug = normalizedName
      .replace(/[^a-z0-9\-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);