import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Grid, 
  Typography, 
  Box, 
  Button, 
  Card, 
  CardMedia, 
  Chip,
  Divider,
  IconButton,
  Paper,
  Rating,
  Skeleton,
  Alert,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  ShoppingCart as CartIcon,
  LocalShipping as ShippingIcon,
  Verified as VerifiedIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { productsApi, cartApi } from '../services/api';
import { useCart } from '../context/CartContext';

// Format currency to VND
const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// Calculate discount percentage
const calculateDiscount = (originalPrice, currentPrice) => {
  if (!originalPrice || !currentPrice || originalPrice <= currentPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { addToCart, showNotification } = useCart();
  
  // State
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  
  // Fetch product data
  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        setLoading(true);
        const response = await productsApi.getProductById(id);
        setProduct(response.data);
        
        // Set first variant as default selected if variants exist
        if (response.data.variants && response.data.variants.length > 0) {
          setSelectedVariant(response.data.variants[0]);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductDetail();
  }, [id]);
  
  // Navigation for image carousel
  const handleNextImage = () => {
    if (!product || !product.images) return;
    setCurrentImageIndex((prevIndex) => 
      prevIndex === product.images.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  const handlePrevImage = () => {
    if (!product || !product.images) return;
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? product.images.length - 1 : prevIndex - 1
    );
  };
  
  const handleImageClick = (index) => {
    setCurrentImageIndex(index);
  };
  
  // Variant selection
  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
  };
  
  // Tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  // Add to cart functionality
  const handleAddToCart = async () => {
    // Kiểm tra sản phẩm và biến thể đã được chọn
    if (!product || !product._id) {
      showNotification('Không thể tìm thấy thông tin sản phẩm', 'error');
      return;
    }
    
    if (!selectedVariant || !selectedVariant._id) {
      showNotification('Vui lòng chọn phiên bản sản phẩm', 'warning');
      return;
    }
    
    // Kiểm tra tồn kho
    if (selectedVariant.stock <= 0) {
      showNotification('Sản phẩm đã hết hàng', 'error');
      return;
    }
    
    // Sử dụng context để thêm vào giỏ hàng
    const result = await addToCart(product._id, selectedVariant._id, 1);
    
    // Notification is handled by CartContext
    return result;
  };
  
  // Buy now functionality
  const handleBuyNow = async () => {
    // Instead of using the return value from handleAddToCart,
    // duplicate the checks to ensure proper notification handling
    if (!product || !product._id) {
      showNotification('Không thể tìm thấy thông tin sản phẩm', 'error');
      return;
    }
    
    if (!selectedVariant || !selectedVariant._id) {
      showNotification('Vui lòng chọn phiên bản sản phẩm', 'warning');
      return;
    }
    
    if (selectedVariant.stock <= 0) {
      showNotification('Sản phẩm đã hết hàng', 'error');
      return;
    }
    
    // Add to cart and navigate if successful
    const result = await addToCart(product._id, selectedVariant._id, 1);
    if (result && result.success) {
      navigate('/cart');
    }
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Left column - Image carousel skeleton */}
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={400} />
            <Box sx={{ display: 'flex', mt: 2 }}>
              {Array.from(new Array(4)).map((_, index) => (
                <Skeleton key={index} variant="rectangular" width={80} height={80} sx={{ mr: 1 }} />
              ))}
            </Box>
          </Grid>
          
          {/* Right column - Product details skeleton */}
          <Grid item xs={12} md={6}>
            <Skeleton variant="text" height={60} />
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="40%" sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={50} />
          </Grid>
        </Grid>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  
  if (!product) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">Không tìm thấy sản phẩm</Alert>
      </Container>
    );
  }
  
  // Get current displayed image
  const currentImage = product.images && product.images.length > 0
    ? product.images[currentImageIndex]
    : '/placeholder.svg?height=400&width=400';
  
  // For demo purposes - assuming original price is 20% higher than current price
  // In real app, you would get this from the API
  const getCurrentPrice = () => {
    return selectedVariant ? selectedVariant.price : product.minPrice || 0;
  };
  
  const getOriginalPrice = () => {
    const currentPrice = getCurrentPrice();
    const discountPercent = selectedVariant?.discountPercentage || product?.discountPercentage || 0;
    
    if (discountPercent <= 0) {
      return currentPrice; // Không có giảm giá
    }
    
    // Tính giá gốc: currentPrice / (1 - discount/100)
    const originalPrice = currentPrice / (1 - discountPercent/100);
    return Math.round(originalPrice); // Làm tròn để tránh số thập phân
  };
  
  const getDiscountPercentage = () => {
    return selectedVariant?.discountPercentage || product?.discountPercentage || 0;
  };
  
  // Extract brand information
  const getBrandInfo = () => {
    // Check if product has attributes.brand
    if (product.attributes && product.attributes.brand) {
      return product.attributes.brand;
    }
    
    // Check if product has brandInfo from API
    if (product.brandInfo && product.brandInfo.name) {
      return product.brandInfo.name;
    }
    
    // Check if product has a populated category object
    if (product.category && typeof product.category === 'object') {
      // Check if the category has brand attribute
      if (product.category.attributes && product.category.attributes.length > 0) {
        const brandAttribute = product.category.attributes.find(attr => 
          attr.name.toLowerCase() === 'thương hiệu');
        
        if (brandAttribute && brandAttribute.values && brandAttribute.values.length > 0) {
          return brandAttribute.values[0]; // Return first brand as default
        }
      }
      
      // Fallback to category name if no brand found
      return product.category.name || 'Chưa xác định';
    }
    
    // If no category info, return default
    return 'Chưa xác định';
  };
  
  const discountPercentage = calculateDiscount(getOriginalPrice(), getCurrentPrice());
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Force Grid container to maintain columns on all viewports */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, width: '100%' }}>
        {/* Left column - Image carousel */}
        <Box 
          sx={{ 
            flex: { xs: '1 0 100%', md: '0 0 40%' }, 
            mb: { xs: 3, md: 0 }, 
            pr: { md: 4 }
          }}
        >
          <Paper 
            elevation={0} 
            sx={{ 
              position: 'relative',
              borderRadius: 2,
              overflow: 'hidden',
              mb: 2,
              height: { xs: 320, sm: 350 },
              maxWidth: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'white',
              mx: 'auto'
            }}
          >
            <CardMedia
              component="img"
              image={currentImage}
              alt={product.name}
              sx={{ 
                height: '100%',
                objectFit: 'contain', 
                width: '100%',
                maxHeight: '100%'
              }}
            />
            
            {/* Image navigation arrows */}
            <IconButton
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255,255,255,0.8)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
              }}
              onClick={handlePrevImage}
            >
              <ChevronLeftIcon />
            </IconButton>
            
            <IconButton
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255,255,255,0.8)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
              }}
              onClick={handleNextImage}
            >
              <ChevronRightIcon />
            </IconButton>
          </Paper>
          
          {/* Thumbnail images */}
          <Box sx={{ display: 'flex', overflowX: 'auto', pb: 1, justifyContent: 'center' }}>
            {product.images && product.images.map((image, index) => (
              <Box
                key={index}
                onClick={() => handleImageClick(index)}
                sx={{
                  width: 70,
                  height: 70,
                  borderRadius: 1,
                  mr: 1,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: index === currentImageIndex ? '2px solid #1976d2' : '2px solid transparent',
                }}
              >
                <CardMedia
                  component="img"
                  image={image}
                  alt={`${product.name} thumbnail ${index + 1}`}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            ))}
          </Box>
        </Box>
        
        {/* Right column - Product details */}
        <Box 
          sx={{ 
            flex: { xs: '1 0 100%', md: '0 0 60%' }
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom 
                fontWeight="bold"
                sx={{ 
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                  width: { xs: 'calc(100% - 80px)', md: 'auto' }
                }}
              >
                {product.name}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', minWidth: '80px' }}>
                <IconButton color="default">
                  <FavoriteIcon />
                </IconButton>
                <IconButton color="default">
                  <ShareIcon />
                </IconButton>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
              <Rating value={4.5} precision={0.5} readOnly />
              <Typography variant="body2" sx={{ ml: 1 }}>
                (45 đánh giá)
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Thương hiệu: <strong>{getBrandInfo()}</strong>
              </Typography>
              <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 16, display: { xs: 'none', sm: 'block' } }} />
              <Typography variant="body2" color="text.secondary">
                Trạng thái: {' '}
                {selectedVariant?.stock > 0 ? (
                  <Chip size="small" label="Còn hàng" color="success" />
                ) : (
                  <Chip size="small" label="Hết hàng" color="error" />
                )}
              </Typography>
            </Box>
            
            {/* Price section */}
            <Box sx={{ mt: 2 }}>
              {/* Current price */}
              <Typography 
                variant="h4" 
                component="div" 
                color="primary" 
                fontWeight="bold" 
                sx={{ display: 'block' }}
              >
                {formatPrice(getCurrentPrice())}
              </Typography>
              
              {/* Original price and discount */}
              {getDiscountPercentage() > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <Typography 
                    variant="body1" 
                    component="span" 
                    color="text.secondary"
                    sx={{ textDecoration: 'line-through', mr: 1 }}
                  >
                    {formatPrice(getOriginalPrice())}
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    component="span" 
                    sx={{ color: 'error.main', fontWeight: 'bold' }}
                  >
                    -{getDiscountPercentage()}%
                  </Typography>
                </Box>
              )}
              
              {/* Shipping */}
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5 }}>
                <ShippingIcon fontSize="small" color="primary" />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  Miễn phí vận chuyển
                </Typography>
              </Box>
            </Box>
            
            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Cấu hình:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {product.variants.map((variant) => (
                    <Button
                      key={variant.name}
                      variant={selectedVariant === variant ? "contained" : "outlined"}
                      color="primary"
                      size="large"
                      onClick={() => handleVariantSelect(variant)}
                      sx={{ 
                        minWidth: { xs: '100px', sm: '120px' },
                        borderRadius: 2,
                        textTransform: 'none',
                        flex: { xs: '1 0 45%', sm: '0 1 auto' }
                      }}
                      disabled={variant.stock <= 0}
                    >
                      {variant.name}
                    </Button>
                  ))}
                </Box>
              </Box>
            )}
            
            {/* Additional information */}
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <VerifiedIcon fontSize="small" color="success" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Bảo hành chính hãng 24 tháng
              </Typography>
              <Typography variant="body2">
                <VerifiedIcon fontSize="small" color="success" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Hỗ trợ đổi mới trong 7 ngày
              </Typography>
            </Box>
            
            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 2, mt: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button 
                variant="outlined" 
                color="primary" 
                size="large"
                fullWidth
                startIcon={<CartIcon />}
                onClick={handleAddToCart}
                disabled={!selectedVariant || selectedVariant.stock <= 0}
              >
                Thêm vào giỏ
              </Button>
              <Button 
                variant="contained" 
                color="warning" 
                size="large"
                fullWidth
                onClick={handleBuyNow}
                disabled={!selectedVariant || selectedVariant.stock <= 0}
                sx={{ 
                  bgcolor: '#f59e0b',
                  '&:hover': {
                    bgcolor: '#d97706',
                  },
                }}
              >
                Mua ngay
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
      
      {/* Product details tabs */}
      <Box sx={{ mt: 6 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label="Mô tả sản phẩm" />
            <Tab label="Thông số kỹ thuật" />
            <Tab label="Đánh giá (45)" />
          </Tabs>
        </Box>
        
        {/* Tab content */}
        <Box sx={{ py: 3 }}>
          {currentTab === 0 && (
            <Typography variant="body1">
              {product.description}
            </Typography>
          )}
          
          {currentTab === 1 && (
            <Box>
              <Typography variant="body1">
                Thông số kỹ thuật sẽ được hiển thị ở đây
              </Typography>
            </Box>
          )}
          
          {currentTab === 2 && (
            <Box>
              <Typography variant="body1">
                Đánh giá sản phẩm sẽ được hiển thị ở đây
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default ProductDetail; 