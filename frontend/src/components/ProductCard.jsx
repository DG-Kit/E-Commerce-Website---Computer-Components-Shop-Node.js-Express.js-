import React, { useState, useEffect } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Box,
  Rating,
  IconButton,
  Chip,
  Modal,
  Fade,
  Backdrop,
  Grid,
  useTheme,
  Divider,
  Paper,
  Avatar
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Favorite as HeartIcon,
  CompareArrows as CompareIcon,
  Visibility as QuickViewIcon,
  Close as CloseIcon,
  AddShoppingCart as AddToCartIcon,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

// Format currency to VND
const formatPrice = (price) => {
  if (typeof price !== 'number') return 'N/A';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// Calculate discount percentage
const calculateDiscount = (originalPrice, currentPrice) => {
  if (!originalPrice || !currentPrice || originalPrice <= currentPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
};

// Style for the Modal - Updated to be more compact
const modalStyle = {
              position: 'absolute', 
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '95%', sm: '500px' }, // Fixed width for more compact appearance
  maxHeight: '90vh',
  overflow: 'auto',
  bgcolor: 'background.paper',
  border: 'none',
                      borderRadius: 1,
  boxShadow: 24,
  p: 0,
  outline: 'none',
};

const ProductCard = ({ product }) => {
  const [openQuickView, setOpenQuickView] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const theme = useTheme();
  const { addToCart, showNotification } = useCart();

  // Handle missing images or variants with default values
  const imageUrl = product.images && product.images.length > 0
    ? product.images[0]
    : '/placeholder.svg?height=200&width=200';

  // Set initial variant on product load or QuickView open
  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product]);

  // Determine price: Use selected variant price if available, else first variant price, else minPrice, else 0
  const price = selectedVariant?.price || 
    (product.variants && product.variants.length > 0 ? product.variants[0].price : product.minPrice || 0);

  // Determine discount percentage based on the selected variant
  const discountPercentage = selectedVariant?.discountPercentage ||
    (product.variants && product.variants.length > 0 ? product.variants[0].discountPercentage : product.discountPercentage || 0);

  // Calculate original price based on current price and discount percentage
  const originalPrice = discountPercentage > 0
    ? Math.round(price / (1 - discountPercentage / 100))
    : price;

  // Determine stock based on selected variant
  const stock = selectedVariant?.stock || 
    (product.variants && product.variants.length > 0 ? product.variants[0].stock : product.stock || 0);

  // Extract brand from category info
  const getBrandFromCategory = () => {
    // Check if product has a populated category object
    if (product.category && typeof product.category === 'object') {
      // Check if the category name directly contains a brand (like "CPU Intel", "RAM Kingston")
      const categoryName = product.category.name || '';
      
      // Common brand names in computer components
      const commonBrands = [
        'Intel', 'AMD', 'NVIDIA', 'ASUS', 'MSI', 'Gigabyte', 'ASRock',
        'Kingston', 'Corsair', 'G.Skill', 'Crucial', 'Samsung', 'Western Digital',
        'Seagate', 'SanDisk', 'EVGA', 'Zotac', 'Palit', 'Sapphire'
      ];
      
      // Check if category name contains any of the common brands
      for (const brand of commonBrands) {
        if (categoryName.includes(brand)) {
          return brand;
        }
      }
      
      // If no brand found in name, return the category name as fallback
      return categoryName;
    }
    
    // If no category info, return default
    return 'Thương hiệu';
  };
  
  // Get brand to display
  const brandDisplay = getBrandFromCategory();

  const handleOpenQuickView = () => {
    setQuantity(1);
    // Reset selectedVariant to the first variant
    if (product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    }
    setOpenQuickView(true);
  };
  const handleCloseQuickView = () => setOpenQuickView(false);

  const handleQuantityChange = (event) => {
    let value = parseInt(event.target.value, 10);
    if (isNaN(value) || value < 1) {
      value = 1;
    } else if (value > stock) {
      value = stock;
    }
    setQuantity(value);
  };

  const incrementQuantity = () => {
    if (quantity < stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // Variant selection handler
  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
  };

  const handleAddToCart = async (qty = 1) => {
    // Kiểm tra product._id tồn tại
    if (!product || !product._id) {
      console.error('Product ID not found');
      showNotification('Không thể tìm thấy thông tin sản phẩm', 'error');
      return;
    }
    
    // Kiểm tra xem sản phẩm có variants hay không
    if (!product.variants || !Array.isArray(product.variants) || product.variants.length === 0) {
      console.error('Product has no variants');
      showNotification('Sản phẩm không có biến thể', 'error');
      return;
    }
    
    // Lấy variant đã chọn hoặc variant đầu tiên nếu chưa chọn
    const variant = selectedVariant || product.variants[0];
    if (!variant || !variant._id) {
      console.error('Variant ID not found');
      showNotification('Không thể tìm thấy thông tin biến thể sản phẩm', 'error');
      return;
    }
    
    // Kiểm tra số lượng tồn kho
    if (variant.stock <= 0) {
      console.error('Product is out of stock');
      showNotification('Sản phẩm đã hết hàng', 'error');
      return;
    }
    
    // Sử dụng context để thêm vào giỏ hàng
    await addToCart(product._id, variant._id, qty);
    
    // Notification is handled by CartContext now
    // Close QuickView after adding to cart
    setOpenQuickView(false);
  };

  const handlePayNow = (qty = 1) => {
    console.log(`Proceeding to pay for ${qty} of ${product.name} (ID: ${product._id}).`);
  };

  return (
    <>
      <Card
        sx={{
          height: 380, // Fixed height for all cards
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'box-shadow 0.3s ease-in-out',
          '&:hover': {
            boxShadow: 6,
            '& .quick-view-button': {
              opacity: 1,
            },
          },
          overflow: 'hidden',
          // Reduced horizontal space consumption
          maxWidth: '100%',
          borderRadius: 1,
        }}
      >
        {/* --- Icons: Wishlist, Compare, Quick View --- */}
        <Box sx={{ position: 'absolute', top: 4, right: 4, zIndex: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <IconButton 
            size="small" 
            sx={{ 
              bgcolor: 'rgba(255, 255, 255, 0.8)', 
              '&:hover': { bgcolor: 'white' }, 
              boxShadow: 1,
              width: '24px',
              height: '24px',
              p: 0
            }}
          >
            <HeartIcon fontSize="small" color="action" sx={{ fontSize: '14px' }} />
          </IconButton>
          <IconButton 
            size="small" 
            sx={{ 
              bgcolor: 'rgba(255, 255, 255, 0.8)', 
              '&:hover': { bgcolor: 'white' }, 
              boxShadow: 1,
              width: '24px',
              height: '24px',
              p: 0
            }}
          >
            <CompareIcon fontSize="small" color="action" sx={{ fontSize: '14px' }} />
          </IconButton>
          {/* Quick View Button - initially hidden, appears on hover */}
          <IconButton
            size="small"
            className="quick-view-button"
            onClick={handleOpenQuickView}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.8)',
              '&:hover': { bgcolor: 'white' },
              boxShadow: 1,
              opacity: 0,
              transition: 'opacity 0.3s ease-in-out',
              width: '24px',
              height: '24px',
              p: 0
            }}
            aria-label="Quick view"
          >
            <QuickViewIcon fontSize="small" color="action" sx={{ fontSize: '14px' }} />
          </IconButton>
        </Box>

        {/* --- Out of Stock Chip --- */}
        {stock <= 0 && (
          <Chip
            label="Hết hàng"
            color="error"
            size="small"
            sx={{ 
              position: 'absolute', 
              top: 4, 
              left: 4, 
              zIndex: 1, 
              fontWeight: 'bold',
              height: '20px',
              fontSize: '0.65rem',
              '& .MuiChip-label': {
                px: 0.75
              }
            }}
          />
        )}

        {/* --- Product Image Container --- */}
        <Link to={`/product/${product._id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#f8f9fa',
              p: 1,
              boxSizing: 'border-box',
            }}
          >
            <Avatar
              src={imageUrl}
              alt={product.name}
              variant="square"
              sx={{
                width: 160,
                height: 160,
                objectFit: 'contain',
                backgroundColor: '#f8f9fa', // Light background
                '&.MuiAvatar-root img': {
                  objectFit: 'contain',
                  padding: '8px',
                  transform: 'scale(0.9)', // Để ảnh gọn hơn chút
                  transition: 'transform 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1)',
                  },
                }
              }}
            />
          </Box>
        </Link>

        {/* --- Card Content --- */}
        <CardContent sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          p: 1.5, // Reduced padding
          pt: 1, 
          '&:last-child': { pb: 1.5 } // Override MUI's default padding-bottom
        }}>
          <Typography 
            variant="caption" 
            color="text.secondary" 
            gutterBottom 
            noWrap
            sx={{ height: 18, display: 'block' }} // Fixed height
          >
            {brandDisplay}
          </Typography>

          <Link to={`/product/${product._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography
              variant="subtitle2"
              component="h2"
              title={product.name}
              sx={{
                fontWeight: 600,
                mb: 0.5, // Reduced margin
                display: '-webkit-box',
                overflow: 'hidden',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
                height: '38px', // Fixed height instead of minHeight
                color: 'text.primary',
                '&:hover': {
                  color: 'primary.main',
                },
                fontSize: '0.875rem',
                lineHeight: 1.2, // Tighter line height
              }}
            >
              {product.name}
            </Typography>
          </Link>

          {/* --- Rating --- */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, height: 20 }}>
            <Rating 
              value={product.averageRating || 4.5} 
              precision={0.5} 
              size="small" 
              readOnly 
              sx={{ 
                '& .MuiRating-icon': {
                  fontSize: '0.85rem' // Slightly smaller stars
                }
              }}
            />
            <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary', fontSize: '0.7rem' }}>
              ({product.numOfReviews || 10})
            </Typography>
          </Box>

          {/* --- Price and View Details Button (Pushed to bottom) --- */}
          <Box sx={{ mt: 'auto', pt: 0.5 }}>
            {/* Price display with original price and discount if applicable */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              flexWrap: 'wrap', 
              gap: 0.5, 
              mb: 0.75,
              height: 24 // Fixed height for price section
            }}>
              {/* Current price */}
              <Typography 
                variant="body1"
                component="div" 
                color="error" 
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: '1rem',
                }}
              >
                {formatPrice(price)}
              </Typography>
              
              {/* Original price (if there's a discount) */}
              {discountPercentage > 0 && (
                <Typography 
                  variant="caption"
                  color="text.secondary" 
                  sx={{ 
                    textDecoration: 'line-through',
                    fontWeight: 'medium',
                    fontSize: '0.75rem',
                  }}
                >
                  {formatPrice(originalPrice)}
                </Typography>
              )}
              
              {/* Discount percentage */}
              {discountPercentage > 0 && (
                <Chip 
                  label={`-${discountPercentage}%`} 
                  color="error" 
                  size="small"
                  sx={{ 
                    fontWeight: 'bold', 
                    height: 16, 
                    fontSize: '0.65rem',
                    '& .MuiChip-label': {
                      px: 0.5 // Reduced horizontal padding inside chip
                    }
                  }}
                />
              )}
            </Box>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              component={Link}
              to={`/product/${product._id}`}
              sx={{
                borderRadius: '4px',
                textTransform: 'none',
                fontWeight: 600,
                py: 0.5, // Reduced vertical padding
                height: 32, // Fixed height button
                fontSize: '0.8125rem',
              }}
            >
              Xem chi tiết
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Quick View Modal */}
      <Modal
        open={openQuickView}
        onClose={handleCloseQuickView}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
          sx: { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
        }}
        aria-labelledby="quick-view-modal-title"
      >
        <Fade in={openQuickView}>
          <Paper sx={modalStyle}>
            {/* Close button */}
            <IconButton
              aria-label="close"
              onClick={handleCloseQuickView}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
                zIndex: 10,
              }}
            >
              <CloseIcon />
            </IconButton>

            <Box sx={{ p: 3 }}>
              {/* Product Image - Smaller size */}
              <Box sx={{ 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mb: 3,
                bgcolor: theme.palette.grey[50],
                p: 2,
                borderRadius: 1,
                height: 200,
                overflow: 'hidden'
              }}>
                <Avatar
                  src={imageUrl}
                  alt={product.name}
                  variant="square"
                  sx={{
                    width: 160,
                    height: 160,
                    objectFit: 'contain',
                    backgroundColor: theme.palette.grey[50],
                    '&.MuiAvatar-root img': {
                      objectFit: 'contain',
                      padding: '8px',
                    }
                  }}
                />
              </Box>
              {/* Product Title */}
              <Typography 
                variant="h6" 
                component="h2" 
                fontWeight="bold" 
                mb={0.5}
              >
                {product.name}
              </Typography>

              {/* Brand & Stock Info */}
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                <span>Thương hiệu: {brandDisplay}</span> | <span>Kho: {stock > 0 ? `${stock} sản phẩm` : 'Hết hàng'}</span>
              </Typography>

              {/* Rating */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Rating value={product.averageRating || 4.5} precision={0.5} size="small" readOnly />
                <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                  ({product.numOfReviews || 10} đánh giá)
                </Typography>
              </Box>

              {/* Price Section */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="h5" color="error" fontWeight="bold">
                  {formatPrice(price)}
                </Typography>
                
                {discountPercentage > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ textDecoration: 'line-through' }}
                    >
                      {formatPrice(originalPrice)}
                    </Typography>
                    <Chip 
                      label={`-${discountPercentage}%`} 
                      color="error" 
                      size="small"
                      sx={{ fontWeight: 'bold', height: 20 }}
                    />
                  </Box>
                )}
              </Box>

              {/* Product Description */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                  Mô tả sản phẩm:
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ 
                  mb: 2,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {product.description || 
                    `CPU AMD Ryzen 9 7950X (16 nhân: 32 luồng, 5.7GHz Boost, 4.5 GHz, 64MB Cache) là bộ vi xử lý của AMD đưa trên kiến trúc Zen 4. Với 16 nhân và 32 luồng, đây là CPU mạnh mẽ cho công việc đa luồng như render và làm game. Phiên bản mới nhất của AMD.`
                  }
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Variant Information */}
              {product.variants && product.variants.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight="medium" mb={1}>
                    Cấu hình / Phiên bản:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {product.variants.map((variant) => (
                      <Chip
                        key={variant._id || variant.name}
                        label={`${variant.name} - ${formatPrice(variant.price)}`}
                        variant={selectedVariant === variant ? "filled" : "outlined"}
                        color={selectedVariant === variant ? "primary" : "default"}
                        size="small"
                        onClick={() => handleVariantSelect(variant)}
                        clickable
                        sx={{ 
                          borderRadius: 1,
                          py: 0.5,
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </Box>
                  {selectedVariant && selectedVariant.stock <= 0 && (
                    <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
                      Phiên bản này hiện đã hết hàng
                    </Typography>
                  )}
                  {selectedVariant && selectedVariant.stock > 0 && (
                    <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                      Còn {selectedVariant.stock} sản phẩm
                    </Typography>
                  )}
                </Box>
              )}

              {/* Quantity Selector - SIMPLIFIED */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="medium" mb={1}>
                  Số lượng:
                </Typography>
                {/* Simplified quantity selector */}
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '120px' }}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={decrementQuantity}
                    disabled={quantity <= 1 || stock <= 0}
                    sx={{ minWidth: '32px', height: '32px', p: 0 }}
                  >
                    <RemoveIcon fontSize="small" />
                  </Button>
                  <Box 
                    sx={{ 
                      flex: 1, 
                      textAlign: 'center', 
                      mx: 1, 
                      border: '1px solid rgba(0, 0, 0, 0.23)', 
                      borderRadius: 1,
                      py: 0.5,
                      px: 1
                    }}
                  >
                    {quantity}
                  </Box>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={incrementQuantity}
                    disabled={quantity >= stock || stock <= 0}
                    sx={{ minWidth: '32px', height: '32px', p: 0 }}
                  >
                    <AddIcon fontSize="small" />
                  </Button>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    color="warning"
                    fullWidth
                    startIcon={<CartIcon />}
                    onClick={() => handleAddToCart(quantity)}
                    disabled={!selectedVariant || selectedVariant.stock <= 0 || quantity < 1}
                    sx={{ 
                      fontWeight: 600, 
                      textTransform: 'none',
                      py: 1,
                      backgroundColor: '#f59e0b',
                      '&:hover': {
                        backgroundColor: '#d97706',
                      },
                    }}
                  >
                    Thêm vào giỏ
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    component={Link}
                    to={`/product/${product._id}`}
                    sx={{ 
                      fontWeight: 600, 
                      textTransform: 'none',
                      py: 1
                    }}
                  >
                    Xem chi tiết
                  </Button>
                </Grid>
              </Grid>

              {/* View Product Details Link */}
              <Link to={`/product/${product._id}`} style={{ textDecoration: 'none', display: 'inline-block' }}>
                <Typography variant="body2" color="primary">
                  Xem chi tiết sản phẩm →
                </Typography>
              </Link>
            </Box>
          </Paper>
        </Fade>
      </Modal>
    </>
  );
};

export default ProductCard; 