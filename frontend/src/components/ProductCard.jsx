import React, { useState } from 'react';
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
  Paper
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
  const theme = useTheme();

  // Handle missing images or variants with default values
  const imageUrl = product.images && product.images.length > 0
    ? product.images[0]
    : '/placeholder.svg?height=200&width=200';

  // Determine price: Use variant price if available, else minPrice, else 0
  const price = product.variants && product.variants.length > 0 && product.variants[0].price
    ? product.variants[0].price
    : product.minPrice || 0;

  // Determine discount percentage
  const discountPercentage = product.variants && product.variants.length > 0 && product.variants[0].discountPercentage
    ? product.variants[0].discountPercentage
    : product.discountPercentage || 0;

  // Calculate original price based on current price and discount percentage
  const originalPrice = discountPercentage > 0
    ? Math.round(price / (1 - discountPercentage / 100))
    : price;

  // Determine stock: Use variant stock if available, else product stock, else 0
  const stock = product.variants && product.variants.length > 0 && typeof product.variants[0].stock === 'number'
    ? product.variants[0].stock
    : typeof product.stock === 'number' ? product.stock : 0;

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

  const handleAddToCart = (qty = 1) => {
    console.log(`Adding ${qty} of ${product.name} (ID: ${product._id}) to cart.`);
  };

  const handlePayNow = (qty = 1) => {
    console.log(`Proceeding to pay for ${qty} of ${product.name} (ID: ${product._id}).`);
  };

  return (
    <>
      <Card
        sx={{
          height: '100%',
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
        {/* Wrap image in a Box with fixed aspect ratio */}
        <Link to={`/product/${product._id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1 / 1', // Enforce square aspect ratio for the container
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 0.5, // Reduced padding
            }}
          >
            <CardMedia
              component="img"
              image={imageUrl}
              alt={product.name}
              sx={{
                objectFit: 'contain',
                width: 'auto',
                height: 'auto',
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'block',
                transition: 'transform 0.3s ease-in-out',
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
          <Typography variant="caption" color="text.secondary" gutterBottom noWrap>
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
                minHeight: '38px', // Reduced from 40px
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
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
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

          {/* --- Price and Add to Cart Button (Pushed to bottom) --- */}
          <Box sx={{ mt: 'auto', pt: 0.5 }}>
            {/* Price display with original price and discount if applicable */}
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5, mb: 0.75 }}>
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
              color="warning"
              fullWidth
              startIcon={<CartIcon sx={{ fontSize: '1rem' }} />}
              onClick={() => handleAddToCart(1)}
              disabled={stock <= 0}
              sx={{
                borderRadius: '4px',
                textTransform: 'none',
                fontWeight: 600,
                backgroundColor: '#f59e0b',
                '&:hover': {
                  backgroundColor: '#d97706',
                },
                py: 0.5, // Reduced vertical padding
                minHeight: '30px', // Ensure minimum height
                fontSize: '0.8125rem',
                '& .MuiButton-startIcon': {
                  mr: 0.5 // Reduced margin for icon
                }
              }}
            >
              Thêm vào giỏ
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* --- Quick View Modal --- */}
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
                mb: 3,
                bgcolor: theme.palette.grey[50],
                p: 2,
                borderRadius: 1
                }}>
                  <img
                    src={imageUrl}
                    alt={product.name}
                  style={{ 
                    maxWidth: '180px',
                    maxHeight: '180px',
                    objectFit: 'contain'
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
                    disabled={stock <= 0 || quantity < 1}
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
                    onClick={() => handlePayNow(quantity)}
                    disabled={stock <= 0 || quantity < 1}
                    sx={{ 
                      fontWeight: 600, 
                      textTransform: 'none',
                      py: 1
                    }}
                  >
                    Mua ngay
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