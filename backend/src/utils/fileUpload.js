const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Function to ensure directory exists
const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

// Upload directory
const UPLOAD_DIR = './public/uploads';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = UPLOAD_DIR;
    
    // Determine subdirectory based on file type or route
    if (req.baseUrl.includes('/admin')) {
      uploadPath = path.join(UPLOAD_DIR, 'products');
    } else {
      uploadPath = path.join(UPLOAD_DIR, 'others');
    }
    
    // Ensure directory exists
    ensureDirectoryExists(uploadPath);
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueName = `${Date.now()}_${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Configure file filter
const fileFilter = (req, file, cb) => {
  // Only accept images and PDFs
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Function to upload a single file
const uploadFile = (fieldName) => {
  return upload.single(fieldName);
};

// Function to upload multiple files
const uploadFiles = (fieldName, maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

// Function to delete a file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

module.exports = {
  uploadFile,
  uploadFiles,
  deleteFile
}; 