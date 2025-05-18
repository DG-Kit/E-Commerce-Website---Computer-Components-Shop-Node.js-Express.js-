import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
  Alert,
  FormControlLabel,
  FormGroup,
  Stack,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AttachMoney as PriceIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  Inventory as InventoryIcon,
  Label as LabelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Visibility as VisibilityIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { adminApi } from '../../services/api';

const ProductEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // Product form state
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    isActive: true,
    images: [],
    attributes: {
      brand: '',
      model: '',
      warranty: '',
      color: '',
    },
    specifications: [],
    variants: [],
    minPrice: '',
    discountPercentage: ''
  });
  
  // Form validation errors
  const [errors, setErrors] = useState({});
  
  // Image upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  
  // State for image preview modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  
  // Format currency with commas
  const formatCurrency = (value) => {
    if (!value) return '';
    // Remove any non-digits
    const numericValue = value.toString().replace(/[^\d]/g, '');
    // Add commas as thousands separators
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  
  // Parse formatted currency back to number
  const parseCurrency = (formattedValue) => {
    if (!formattedValue) return '';
    // Remove commas and non-digits
    return formattedValue.toString().replace(/[^\d]/g, '');
  };
  
  // Special handler for currency fields
  const handleCurrencyChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = parseCurrency(value);
    setProduct({
      ...product,
      [name]: parsedValue
    });
    
    // Clear validation error when field is changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };
  
  // Handle variant currency change
  const handleVariantCurrencyChange = (index, field, value) => {
    const newVariants = [...product.variants];
    const parsedValue = parseCurrency(value);
    newVariants[index][field] = parsedValue;
    
    // Recalculate price and stock
    const { minPrice, totalStock } = calculatePriceAndStock(newVariants);
    
    setProduct({
      ...product,
      variants: newVariants,
      minPrice: minPrice,
      price: minPrice,
      stock: totalStock
    });
  };
  
  // Calculate min price and total stock from variants
  const calculatePriceAndStock = (variants) => {
    if (!variants || variants.length === 0) {
      return { minPrice: product.price, totalStock: product.stock };
    }
    
    const prices = variants.map(v => parseInt(v.price) || 0).filter(price => price > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const totalStock = variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
    
    return { minPrice: minPrice.toString(), totalStock: totalStock.toString() };
  };
  
  // Update handleVariantChange to recalculate price and stock when variants change
  const handleVariantChange = (index, field, value) => {
    const newVariants = [...product.variants];
    
    // Đảm bảo giá trị là hợp lệ cho các trường số
    if (field === 'price' || field === 'stock' || field === 'discountPercentage') {
      // Kiểm tra nếu người dùng xóa hoàn toàn giá trị thì để trống cho họ nhập lại
      if (value === '') {
        newVariants[index][field] = value;
      } else {
        // Nếu không phải chuỗi rỗng, đảm bảo đó là số
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          // Đối với giá, đảm bảo nó không âm
          if ((field === 'price' || field === 'stock') && numValue < 0) {
            newVariants[index][field] = '0';
          } else {
            newVariants[index][field] = value;
          }
        }
        // Nếu giá trị không phải số, giữ nguyên giá trị cũ
      }
    } else {
      // Đối với các trường không phải số, gán trực tiếp
      newVariants[index][field] = value;
    }
    
    // Recalculate price and stock
    const { minPrice, totalStock } = calculatePriceAndStock(newVariants);
    
    setProduct({
      ...product,
      variants: newVariants,
      minPrice: minPrice,
      price: minPrice,
      stock: totalStock
    });
  };
  
  // Fetch product and categories on component mount
  useEffect(() => {
    const fetchProductAndCategories = async () => {
      try {
        setLoadingProduct(true);
        
        // Fetch product details
        const productResponse = await adminApi.getProduct(id);
        if (productResponse.data?.data) {
          const productData = productResponse.data.data;
          
          // Process variants to calculate price and stock
          const variants = Array.isArray(productData.variants) ? productData.variants.map(v => ({
            ...v,
            price: v.price !== null && v.price !== undefined ? v.price.toString() : '',
            stock: v.stock !== null && v.stock !== undefined ? v.stock.toString() : '',
            discountPercentage: v.discountPercentage !== null && v.discountPercentage !== undefined ? v.discountPercentage.toString() : '0'
          })) : [];
          
          // Calculate min price and total stock
          const prices = variants.map(v => parseInt(v.price) || 0).filter(price => price > 0);
          const minPrice = prices.length > 0 ? Math.min(...prices).toString() : 
                          (productData.price !== null && productData.price !== undefined ? productData.price.toString() : '');
          const totalStock = variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0).toString();
          
          // Convert all numeric values to strings for form inputs
          setProduct({
            ...productData,
            price: minPrice,
            stock: totalStock,
            minPrice: minPrice,
            discountPercentage: productData.discountPercentage !== null && productData.discountPercentage !== undefined ? productData.discountPercentage.toString() : '',
            attributes: productData.attributes || {
              brand: '',
              model: '',
              warranty: '',
              color: '',
            },
            // Set variants
            variants: variants
          });
        }
        
        // Fetch categories - Get only child categories
        const categoriesResponse = await adminApi.getCategories({ parent: 'all', flat: 'true' });
        if (categoriesResponse.data?.data) {
          // Filter to only show child categories (those with a parent)
          const childCategories = categoriesResponse.data.data.filter(category => category.parent !== null);
          setCategories(childCategories);
        } else if (categoriesResponse.data) {
          // If the API doesn't return data in a data property
          const childCategories = categoriesResponse.data.filter(category => category.parent !== null);
          setCategories(childCategories);
        }
      } catch (error) {
        console.error('Error fetching product or categories:', error);
        setError('Không thể tải thông tin sản phẩm hoặc danh mục. Vui lòng thử lại sau.');
      } finally {
        setLoadingProduct(false);
      }
    };
    
    fetchProductAndCategories();
  }, [id]);
  
  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested attributes
      const [parent, child] = name.split('.');
      setProduct({
        ...product,
        [parent]: {
          ...product[parent],
          [child]: value,
        },
      });
    } else {
      setProduct({
        ...product,
        [name]: value,
      });
    }
    
    // Clear validation error when field is changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };
  
  // Handle switch/checkbox change
  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setProduct({
      ...product,
      [name]: checked,
    });
  };
  
  // Handle image upload
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      setUploading(true);
      setUploadError(null);
      
      // Create FormData object
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }
      
      // Upload images
      const response = await adminApi.uploadProductImage(formData);
      console.log('Image upload response:', response);
      
      if (response.data?.data?.urls) {
        // Add uploaded images to state
        const newImages = [...product.images, ...response.data.data.urls];
        console.log('Updated images array:', newImages);
        setProduct({
          ...product,
          images: newImages,
        });
        
        // Set success message
        setSuccess(true);
        setError(null);
        
        // Show brief success message (temporary)
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        console.error('Invalid response format:', response);
        setUploadError('Định dạng phản hồi không hợp lệ. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      setUploadError('Không thể tải lên hình ảnh. Vui lòng thử lại.');
      setError('Không thể tải lên hình ảnh. Vui lòng thử lại sau.');
    } finally {
      setUploading(false);
    }
  };
  
  // Remove image
  const handleRemoveImage = (index) => {
    const newImages = [...product.images];
    newImages.splice(index, 1);
    setProduct({
      ...product,
      images: newImages,
    });
  };
  
  // Preview image
  const handlePreviewImage = (image, index) => {
    setPreviewImage(image);
    setSelectedImageIndex(index);
    setPreviewOpen(true);
  };

  // Close preview
  const handleClosePreview = () => {
    setPreviewOpen(false);
  };

  // Set image as thumbnail (move to first position)
  const handleSetAsThumbnail = (index) => {
    if (index === 0) return; // Already the thumbnail
    
    const newImages = [...product.images];
    const imageToMove = newImages[index];
    newImages.splice(index, 1); // Remove from current position
    newImages.unshift(imageToMove); // Add to beginning
    
    setProduct({
      ...product,
      images: newImages,
    });
    
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
    }, 3000);
  };

  // Move image up in the order
  const handleMoveImageUp = (index) => {
    if (index === 0) return; // Already at the top
    
    const newImages = [...product.images];
    const temp = newImages[index];
    newImages[index] = newImages[index - 1];
    newImages[index - 1] = temp;
    
    setProduct({
      ...product,
      images: newImages,
    });
  };

  // Move image down in the order
  const handleMoveImageDown = (index) => {
    if (index === product.images.length - 1) return; // Already at the bottom
    
    const newImages = [...product.images];
    const temp = newImages[index];
    newImages[index] = newImages[index + 1];
    newImages[index + 1] = temp;
    
    setProduct({
      ...product,
      images: newImages,
    });
  };
  
  // Add empty specification
  const handleAddSpecification = () => {
    setProduct({
      ...product,
      specifications: [
        ...product.specifications,
        { name: '', value: '' },
      ],
    });
  };
  
  // Remove specification
  const handleRemoveSpecification = (index) => {
    const newSpecs = [...product.specifications];
    newSpecs.splice(index, 1);
    setProduct({
      ...product,
      specifications: newSpecs,
    });
  };
  
  // Update specification
  const handleSpecificationChange = (index, field, value) => {
    const newSpecs = [...product.specifications];
    newSpecs[index][field] = value;
    setProduct({
      ...product,
      specifications: newSpecs,
    });
  };
  
  // Add empty variant
  const handleAddVariant = () => {
    const newVariants = [
      ...product.variants,
      { name: '', price: product.price || '0', stock: '0', discountPercentage: '0' },
    ];
    
    const { minPrice, totalStock } = calculatePriceAndStock(newVariants);
    
    setProduct({
      ...product,
      variants: newVariants,
      minPrice: minPrice,
      price: minPrice,
      stock: totalStock
    });
  };
  
  // Remove variant
  const handleRemoveVariant = (index) => {
    const newVariants = [...product.variants];
    newVariants.splice(index, 1);
    
    const { minPrice, totalStock } = calculatePriceAndStock(newVariants);
    
    setProduct({
      ...product,
      variants: newVariants,
      minPrice: minPrice,
      price: minPrice,
      stock: totalStock
    });
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!product.name.trim()) {
      newErrors.name = 'Tên sản phẩm không được để trống';
    }
    
    if (!product.description.trim()) {
      newErrors.description = 'Mô tả sản phẩm không được để trống';
    }
    
    if (product.images.length === 0) {
      newErrors.images = 'Vui lòng tải lên ít nhất một hình ảnh';
    }
    
    // Kiểm tra biến thể nếu có
    if (product.variants.length > 0) {
      product.variants.forEach((variant, index) => {
        if (!variant.name && index > 0) {
          if (!newErrors.variants) newErrors.variants = {};
          newErrors.variants[index] = 'Tên biến thể không được để trống';
        }
        
        if (!variant.price || isNaN(parseInt(variant.price)) || parseInt(variant.price) <= 0) {
          if (!newErrors.variants) newErrors.variants = {};
          newErrors.variants[index] = (newErrors.variants[index] || '') + ' Giá biến thể phải là số dương.';
        }

        if (!variant.stock || isNaN(parseInt(variant.stock)) || parseInt(variant.stock) < 0) {
          if (!newErrors.variants) newErrors.variants = {};
          newErrors.variants[index] = (newErrors.variants[index] || '') + ' Số lượng phải là số không âm.';
        }
      });
    } else {
      // Yêu cầu có ít nhất một biến thể
      newErrors.variants = 'Vui lòng thêm ít nhất một biến thể sản phẩm';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error
      const firstError = Object.keys(errors)[0];
      const element = document.getElementsByName(firstError)[0];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      // Format product data for API
      const productData = {
        ...product,
        variants: product.variants.map(variant => ({
          ...variant,
          price: parseInt(variant.price) || 0,
          stock: parseInt(variant.stock) || 0,
          discountPercentage: parseInt(variant.discountPercentage) || 0
        }))
      };
      
      // Update product
      await adminApi.updateProduct(id, productData);
      
      setSuccess(true);
      
      // Redirect to products list after short delay
      setTimeout(() => {
        navigate('/admin/products');
      }, 2000);
      
    } catch (error) {
      console.error('Error updating product:', error);
      setError('Không thể cập nhật sản phẩm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loadingProduct) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            aria-label="back" 
            onClick={() => navigate('/admin/products')}
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1" fontWeight={600}>
            Chỉnh sửa sản phẩm
          </Typography>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Cập nhật sản phẩm thành công!
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Left column - Main info */}
          <Grid item xs={12} md={8}>
            <Card 
              variant="outlined" 
              sx={{ 
                p: 3, 
                borderRadius: 2,
                boxShadow: '0px 2px 8px rgba(0,0,0,0.05)' 
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Thông tin cơ bản
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={3}>
                {/* Product name */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tên sản phẩm"
                    name="name"
                    value={product.name}
                    onChange={handleChange}
                    error={!!errors.name}
                    helperText={errors.name}
                    placeholder="Nhập tên sản phẩm"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LabelIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                {/* Product description */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Mô tả sản phẩm"
                    name="description"
                    value={product.description}
                    onChange={handleChange}
                    error={!!errors.description}
                    helperText={errors.description}
                    placeholder="Nhập mô tả chi tiết về sản phẩm"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DescriptionIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                {/* Price and Discount Percentage */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Giá sản phẩm (tự động từ biến thể)"
                    name="price"
                    value={formatCurrency(product.price)}
                    disabled={true}
                    helperText="Giá thấp nhất từ các biến thể"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PriceIcon />
                        </InputAdornment>
                      ),
                      endAdornment: <InputAdornment position="end">VND</InputAdornment>,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phần trăm giảm giá (tự động)"
                    name="discountPercentage"
                    value={product.discountPercentage}
                    disabled={true}
                    helperText="Trung bình % giảm giá từ các biến thể"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                </Grid>
                
                {/* Category and Stock */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={!!errors.category}>
                    <InputLabel id="category-label">Danh mục</InputLabel>
                    <Select
                      labelId="category-label"
                      name="category"
                      value={product.category || ""}
                      onChange={handleChange}
                      disabled={true}
                      input={
                        <OutlinedInput
                          label="Danh mục"
                          startAdornment={
                            <InputAdornment position="start">
                              <CategoryIcon />
                            </InputAdornment>
                          }
                        />
                      }
                    >
                      <MenuItem value="">
                        <em>Chọn danh mục</em>
                      </MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category._id} value={category._id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      {categories.find(c => c._id === product.category)?.name || 'Danh mục không thể thay đổi sau khi tạo sản phẩm'}
                    </FormHelperText>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tồn kho (tự động từ biến thể)"
                    name="stock"
                    value={product.stock}
                    disabled={true}
                    helperText="Tổng số lượng từ tất cả các biến thể"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <InventoryIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                {/* Min Price field */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Giá tối thiểu (tự động tính từ biến thể)"
                    name="minPrice"
                    value={formatCurrency(product.minPrice)}
                    onChange={handleCurrencyChange}
                    disabled={true}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">VND</InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
            </Card>
            
            <Card 
              variant="outlined" 
              sx={{ 
                p: 3, 
                borderRadius: 2,
                boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
                mt: 3
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Thuộc tính sản phẩm
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={3}>
                {/* Brand */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Thương hiệu"
                    name="attributes.brand"
                    value={product.attributes.brand}
                    onChange={handleChange}
                    placeholder="Nhập thương hiệu"
                  />
                </Grid>
                
                {/* Model */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Model"
                    name="attributes.model"
                    value={product.attributes.model}
                    onChange={handleChange}
                    placeholder="Nhập model"
                  />
                </Grid>
                
                {/* Warranty */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Bảo hành"
                    name="attributes.warranty"
                    value={product.attributes.warranty}
                    onChange={handleChange}
                    placeholder="VD: 24 tháng"
                  />
                </Grid>
                
                {/* Color */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Màu sắc"
                    name="attributes.color"
                    value={product.attributes.color}
                    onChange={handleChange}
                    placeholder="VD: Đen, Trắng, Đỏ"
                  />
                </Grid>
              </Grid>
            </Card>
            
            <Card 
              variant="outlined" 
              sx={{ 
                p: 3, 
                borderRadius: 2,
                boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
                mt: 3
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Thông số kỹ thuật
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddSpecification}
                >
                  Thêm thông số
                </Button>
              </Box>
              <Divider sx={{ my: 2 }} />
              
              {product.specifications.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    Chưa có thông số kỹ thuật nào. Nhấn "Thêm thông số" để bắt đầu.
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {product.specifications.map((spec, index) => (
                    <Grid item xs={12} key={index}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={5}>
                          <TextField
                            fullWidth
                            label="Tên thông số"
                            value={spec.name}
                            onChange={(e) => handleSpecificationChange(index, 'name', e.target.value)}
                            placeholder="VD: CPU, RAM, GPU..."
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Giá trị"
                            value={spec.value}
                            onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                            placeholder="VD: Core i7 12700K, 16GB DDR4..."
                          />
                        </Grid>
                        <Grid item xs={1}>
                          <IconButton 
                            color="error" 
                            onClick={() => handleRemoveSpecification(index)}
                            aria-label="Xóa thông số"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Card>

            {/* Variants Section */}
            <Card 
              variant="outlined" 
              sx={{ 
                p: 3, 
                borderRadius: 2,
                boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
                mt: 3
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Biến thể sản phẩm
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddVariant}
                >
                  Thêm biến thể
                </Button>
              </Box>
              <Divider sx={{ my: 2 }} />
              
              {product.variants.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    Chưa có biến thể nào. Nhấn "Thêm biến thể" để bắt đầu.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Nếu không thêm biến thể, hệ thống sẽ tạo biến thể mặc định từ thông tin sản phẩm chính.
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {product.variants.map((variant, index) => (
                    <Grid item xs={12} key={index}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={3}>
                            <TextField
                              fullWidth
                              label="Tên biến thể"
                              value={variant.name}
                              onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                              placeholder="VD: Đen 512GB, Đỏ 256GB..."
                              error={errors.variants && errors.variants[index]}
                              helperText={errors.variants && errors.variants[index]}
                            />
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <TextField
                              fullWidth
                              label="Giá"
                              value={formatCurrency(variant.price)}
                              onChange={(e) => handleVariantCurrencyChange(index, 'price', e.target.value)}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">VND</InputAdornment>,
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              label="Tồn kho"
                              type="number"
                              value={variant.stock}
                              onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <TextField
                              fullWidth
                              label="Giảm giá (%)"
                              type="number"
                              value={variant.discountPercentage}
                              onChange={(e) => handleVariantChange(index, 'discountPercentage', e.target.value)}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={1}>
                            <IconButton 
                              color="error" 
                              onClick={() => handleRemoveVariant(index)}
                              aria-label="Xóa biến thể"
                              disabled={index === 0 && product.variants.length === 1}
                              title={index === 0 && product.variants.length === 1 ? "Không thể xóa biến thể mặc định" : ""}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Card>
          </Grid>
          
          {/* Right column - Images, Status, etc. */}
          <Grid item xs={12} md={4}>
            <Card 
              variant="outlined" 
              sx={{ 
                p: 3, 
                borderRadius: 2,
                boxShadow: '0px 2px 8px rgba(0,0,0,0.05)' 
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Trạng thái
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={product.isActive} 
                      onChange={handleSwitchChange}
                      name="isActive"
                      color="success"
                    />
                  }
                  label={product.isActive ? "Đang bán" : "Ngừng bán"}
                />
              </FormGroup>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {product.isActive 
                  ? "Sản phẩm sẽ được hiển thị trên trang web."
                  : "Sản phẩm sẽ không được hiển thị trên trang web."
                }
              </Typography>
            </Card>
            
            <Card 
              variant="outlined" 
              sx={{ 
                p: 3, 
                borderRadius: 2,
                boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
                mt: 3
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Hình ảnh sản phẩm
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Hướng dẫn:</strong> Sau khi tải lên, di chuột qua hình ảnh để thấy các nút quản lý:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, flexWrap: 'wrap', gap: 1 }}>
                  <Chip icon={<DeleteIcon />} label="Xóa" color="error" size="small" />
                  <Chip icon={<VisibilityIcon />} label="Xem" color="primary" size="small" />
                  <Chip icon={<StarIcon />} label="Đặt làm ảnh đại diện" color="warning" size="small" />
                  <Chip icon={<ArrowUpwardIcon />} label="Di chuyển lên" color="info" size="small" />
                  <Chip icon={<ArrowDownwardIcon />} label="Di chuyển xuống" color="info" size="small" />
                </Box>
              </Alert>
              
              {/* Upload success notification */}
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Tải lên hình ảnh thành công!
                </Alert>
              )}
              
              {/* Error notification */}
              {uploadError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {uploadError}
                </Alert>
              )}
              
              <Box 
                sx={{ 
                  border: '2px dashed',
                  borderColor: errors.images ? 'error.main' : 'divider',
                  borderRadius: 1,
                  p: 2,
                  textAlign: 'center',
                  bgcolor: 'background.paper',
                  mb: 2
                }}
              >
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="image-upload"
                  type="file"
                  multiple
                  onChange={handleImageUpload}
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<ImageIcon />}
                    disabled={uploading}
                  >
                    {uploading ? 'Đang tải lên...' : 'Tải lên hình ảnh'}
                  </Button>
                </label>
                {uploading && (
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={24} />
                  </Box>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Tải lên tối đa 5 hình ảnh, định dạng JPG, PNG
                </Typography>
                {errors.images && (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    {errors.images}
                  </Typography>
                )}
              </Box>
              
              {/* Image Preview Section - IMPROVED WITH VISIBLE IMAGERY */}
              {product.images.length > 0 && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 3, mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Đã tải lên {product.images.length} hình ảnh
                    </Typography>
                    {product.images.length > 0 && (
                      <Chip 
                        color="success" 
                        size="small" 
                        label="Ảnh đại diện" 
                        sx={{ ml: 1, display: 'inline-flex' }} 
                        icon={<StarIcon fontSize="small" />}
                      />
                    )}
                  </Box>
                  
                  {/* Main preview of first image */}
                  {product.images.length > 0 && (
                    <Box sx={{ mb: 2, p: 1, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                      <Typography variant="subtitle2" fontWeight={500} sx={{ mb: 1 }}>
                        Xem trước ảnh đại diện sản phẩm:
                      </Typography>
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        p: 1.5, 
                        bgcolor: '#f5f5f5', 
                        borderRadius: 1
                      }}>
                        <Box 
                          component="img"
                          src={product.images[0]}
                          alt="Ảnh đại diện"
                          sx={{ 
                            width: 120, 
                            height: 120, 
                            objectFit: 'contain',
                            borderRadius: 1,
                            mr: 2,
                            border: '1px solid #e0e0e0',
                            bgcolor: 'white'
                          }}
                        />
                        <Box>
                          <Typography variant="subtitle1" fontWeight={500}>
                            {product.name || 'Tên sản phẩm'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Ảnh này sẽ hiển thị chính trên trang sản phẩm và trong kết quả tìm kiếm
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                  
                  <Typography variant="subtitle2" fontWeight={500} sx={{ mb: 1 }}>
                    Tất cả hình ảnh ({product.images.length}):
                  </Typography>
                  <Grid container spacing={1.5}>
                    {product.images.map((image, index) => (
                      <Grid item xs={6} sm={4} key={index}>
                        <Paper 
                          elevation={index === 0 ? 3 : 1}
                          sx={{
                            position: 'relative',
                            borderRadius: 1,
                            overflow: 'hidden',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            border: index === 0 ? '2px solid #4caf50' : '1px solid #e0e0e0',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                            }
                          }}
                        >
                          <Box
                            sx={{
                              position: 'relative',
                              paddingTop: '100%', // 1:1 aspect ratio
                              overflow: 'hidden',
                            }}
                          >
                            <Box
                              component="img"
                              src={image}
                              alt={`Product image ${index + 1}`}
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                cursor: 'pointer',
                                backgroundColor: '#ffffff'
                              }}
                              onClick={() => handlePreviewImage(image, index)}
                            />
                            {/* Image controls - ALWAYS VISIBLE */}
                            <Box 
                              sx={{ 
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                padding: '8px',
                                background: 'rgba(0,0,0,0.7)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                zIndex: 2
                              }}
                            >
                              {index === 0 ? (
                                <Tooltip title="Ảnh đại diện">
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <StarIcon fontSize="small" sx={{ color: '#ffeb3b' }} />
                                    <Typography variant="caption" sx={{ color: '#ffffff', ml: 0.5 }}>Đại diện</Typography>
                                  </Box>
                                </Tooltip>
                              ) : (
                                <Tooltip title="Đặt làm ảnh đại diện">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleSetAsThumbnail(index)}
                                    sx={{ color: 'white', p: 0.5, bgcolor: 'rgba(255,255,255,0.1)' }}
                                  >
                                    <StarBorderIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Box>
                                <Tooltip title="Xem ảnh">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handlePreviewImage(image, index)}
                                    sx={{ color: 'white', p: 0.5, bgcolor: 'rgba(25,118,210,0.5)', mr: 1 }}
                                  >
                                    <VisibilityIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Xóa ảnh">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRemoveImage(index)}
                                    sx={{ color: 'white', p: 0.5, bgcolor: 'rgba(211,47,47,0.7)' }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>
                            
                            {/* Position controls - ALWAYS VISIBLE */}
                            <Box 
                              sx={{ 
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                padding: '8px',
                                background: 'rgba(0,0,0,0.7)',
                                display: 'flex',
                                justifyContent: 'center',
                                zIndex: 2
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
                                <Tooltip title="Di chuyển lên">
                                  <span>
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleMoveImageUp(index)}
                                      disabled={index === 0}
                                      sx={{ 
                                        color: 'white', 
                                        p: 0.5,
                                        opacity: index === 0 ? 0.5 : 1,
                                        bgcolor: index === 0 ? 'transparent' : 'rgba(25,118,210,0.7)'
                                      }}
                                    >
                                      <ArrowUpwardIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Di chuyển xuống">
                                  <span>
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleMoveImageDown(index)}
                                      disabled={index === product.images.length - 1}
                                      sx={{ 
                                        color: 'white', 
                                        p: 0.5,
                                        opacity: index === product.images.length - 1 ? 0.5 : 1,
                                        bgcolor: index === product.images.length - 1 ? 'transparent' : 'rgba(25,118,210,0.7)'
                                      }}
                                    >
                                      <ArrowDownwardIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Box>
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}
            </Card>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, textAlign: 'right' }}>
          <Button 
            variant="outlined" 
            sx={{ mr: 2 }}
            onClick={() => navigate('/admin/products')}
          >
            Hủy bỏ
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Đang xử lý...' : 'Cập nhật sản phẩm'}
          </Button>
        </Box>
      </form>

      {/* Image Preview Dialog */}
      <Dialog 
        open={previewOpen} 
        onClose={handleClosePreview}
        maxWidth="md"
      >
        <DialogTitle>
          Xem trước hình ảnh
          <IconButton
            onClick={handleClosePreview}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              my: 2,
            }}
          >
            <img 
              src={previewImage} 
              alt="Preview" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '500px',
                objectFit: 'contain' 
              }} 
            />
          </Box>
        </DialogContent>
        <DialogActions>
          {selectedImageIndex !== null && (
            <>
              <Button 
                onClick={() => handleSetAsThumbnail(selectedImageIndex)} 
                color="primary"
                startIcon={<StarIcon />}
                disabled={selectedImageIndex === 0}
              >
                Đặt làm ảnh đại diện
              </Button>
              <Button 
                onClick={() => handleRemoveImage(selectedImageIndex)} 
                color="error"
                startIcon={<DeleteIcon />}
              >
                Xóa ảnh này
              </Button>
            </>
          )}
          <Button onClick={handleClosePreview}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductEdit; 