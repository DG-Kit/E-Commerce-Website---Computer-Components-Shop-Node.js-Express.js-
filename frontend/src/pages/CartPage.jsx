import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  TextField,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Stack,
  Tooltip
} from '@mui/material';
import {
  DeleteOutline as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ArrowBack as ArrowBackIcon,
  ShoppingCartOutlined as CartIcon,
  ErrorOutline as ErrorIcon
} from '@mui/icons-material';
import { useCart } from '../context/CartContext';

// Format price to VND
const formatPrice = (price) => {
  if (typeof price !== 'number') return 'N/A';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const CartPage = () => {
  const { cartItems, loading, error: cartError, updateCartItem, removeFromCart, getCartTotal, showNotification } = useCart();
  const [quantities, setQuantities] = useState({});
  const [updatingItems, setUpdatingItems] = useState({});
  const [removingItems, setRemovingItems] = useState({});
  const [error, setError] = useState('');
  const [stockErrors, setStockErrors] = useState({});
  const [availableStock, setAvailableStock] = useState({});
  const updateTimeoutRef = useRef({});
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Calculate cart total based on local quantities state
  const getLocalCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const key = `${item.product._id}-${item.variant._id}`;
      const quantity = quantities[key] || item.quantity;
      const price = item.variant?.price || 0;
      return total + (price * quantity);
    }, 0);
  };

  // Initialize quantities from cartItems
  useEffect(() => {
    const initialQuantities = {};
    const initialStockLimits = {};
    
    cartItems.forEach(item => {
      const key = `${item.product._id}-${item.variant._id}`;
      initialQuantities[key] = item.quantity;
      
      // If we have stock information in the variant, set it as the available stock
      if (item.variant && item.variant.stock !== undefined) {
        initialStockLimits[key] = item.variant.stock;
      }
    });
    
    setQuantities(initialQuantities);
    setAvailableStock(initialStockLimits);
  }, [cartItems]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts when component unmounts
      Object.values(updateTimeoutRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  // Handle quantity change
  const handleQuantityChange = (productId, variantId, value) => {
    const key = `${productId}-${variantId}`;
    const newValue = parseInt(value);
    
    // Clear any existing timeout for this item
    if (updateTimeoutRef.current[key]) {
      clearTimeout(updateTimeoutRef.current[key]);
    }
    
    if (isNaN(newValue) || newValue < 1) {
      setQuantities(prev => ({ ...prev, [key]: 1 }));
      // Clear any stock errors
      setStockErrors(prev => ({ ...prev, [key]: null }));
      
      // Update immediately with minimum quantity
      handleUpdateCartItem(productId, variantId, 1);
    } else {
      // Check against available stock
      const maxStock = availableStock[key] || 999;
      
      if (newValue > maxStock) {
        // Set quantity to available stock and show error
        setQuantities(prev => ({ ...prev, [key]: maxStock }));
        setStockErrors(prev => ({ 
          ...prev, 
          [key]: `Chỉ còn ${maxStock} sản phẩm trong kho` 
        }));
        showNotification(`Chỉ còn ${maxStock} sản phẩm trong kho`, 'warning');
        
        // Update to max allowed quantity
        handleUpdateCartItem(productId, variantId, maxStock);
      } else {
        // Quantity is valid, clear any stock errors
        setQuantities(prev => ({ ...prev, [key]: newValue }));
        setStockErrors(prev => ({ ...prev, [key]: null }));
        
        // Update immediately
        handleUpdateCartItem(productId, variantId, newValue);
      }
    }
  };

  // Handle update cart item
  const handleUpdateCartItem = async (productId, variantId, quantityToUpdate) => {
    const key = `${productId}-${variantId}`;
    const quantity = quantityToUpdate || quantities[key];
    
    // Skip update if quantity is not changed
    const currentItem = cartItems.find(item => 
      item.product._id === productId && item.variant._id === variantId
    );
    
    if (currentItem && currentItem.quantity === quantity) {
      return;
    }

    try {
      setUpdatingItems({ ...updatingItems, [key]: true });
      const result = await updateCartItem(productId, variantId, quantity);
      // Notification handled in CartContext
      
      // Clear any stock errors if successful
      setStockErrors(prev => ({ ...prev, [key]: null }));
    } catch (error) {
      console.error('Error updating cart item:', error);
      
      // Check if error is related to stock limits
      if (error.response && error.response.data) {
        const { msg, availableStock: stockLimit } = error.response.data;
        if (stockLimit !== undefined) {
          // Update available stock state
          setAvailableStock(prev => ({ ...prev, [key]: stockLimit }));
          
          // Set stock error message
          setStockErrors(prev => ({ ...prev, [key]: msg }));
          
          // Update quantity to match available stock
          setQuantities(prev => ({ ...prev, [key]: stockLimit }));
          
          // Show notification about stock limit
          showNotification(msg, 'warning');
        } else {
          showNotification('Không thể cập nhật giỏ hàng', 'error');
        }
      } else {
        showNotification('Không thể cập nhật giỏ hàng', 'error');
      }
    } finally {
      setUpdatingItems({ ...updatingItems, [key]: false });
    }
  };

  // Handle remove cart item
  const handleRemoveCartItem = async (productId, variantId) => {
    const key = `${productId}-${variantId}`;
    
    // Check for valid IDs
    if (!productId || !variantId) {
      console.error('Cannot remove item: Invalid product or variant ID', { productId, variantId });
      setError('Không thể xóa sản phẩm do thông tin sản phẩm không hợp lệ');
      showNotification('Không thể xóa sản phẩm do thông tin không hợp lệ', 'error');
      return;
    }
    
    try {
      setRemovingItems({ ...removingItems, [key]: true });
      await removeFromCart(productId, variantId);
      // Notification handled in CartContext
    } catch (error) {
      console.error('Error removing cart item:', error);
      showNotification('Không thể xóa sản phẩm khỏi giỏ hàng', 'error');
    } finally {
      setRemovingItems({ ...removingItems, [key]: false });
    }
  };

  // Handle increment quantity
  const handleIncrementQuantity = (productId, variantId) => {
    const key = `${productId}-${variantId}`;
    const currentQty = quantities[key] || 1;
    const maxStock = availableStock[key] || 999;
    
    // Don't increment if we're already at max stock
    if (currentQty >= maxStock) {
      setStockErrors(prev => ({ 
        ...prev, 
        [key]: `Chỉ còn ${maxStock} sản phẩm trong kho` 
      }));
      showNotification(`Chỉ còn ${maxStock} sản phẩm trong kho`, 'warning');
      return;
    }
    
    const newQuantity = currentQty + 1;
    setQuantities(prev => ({ ...prev, [key]: newQuantity }));
    
    // Clear stock error if no longer at limit
    if (stockErrors[key]) {
      setStockErrors(prev => ({ ...prev, [key]: null }));
    }
    
    // Update immediately with the new quantity
    handleUpdateCartItem(productId, variantId, newQuantity);
  };

  // Handle decrement quantity
  const handleDecrementQuantity = (productId, variantId) => {
    const key = `${productId}-${variantId}`;
    if (quantities[key] > 1) {
      const newQuantity = quantities[key] - 1;
      setQuantities(prev => ({ ...prev, [key]: newQuantity }));
      // Update immediately with the new quantity
      handleUpdateCartItem(productId, variantId, newQuantity);
    }
  };

  // Render cart items for desktop
  const renderDesktopCart = () => (
    <TableContainer component={Paper} elevation={0}>
      <Table sx={{ minWidth: 650 }} aria-label="shopping cart">
        <TableHead>
          <TableRow>
            <TableCell>Sản phẩm</TableCell>
            <TableCell align="right">Giá</TableCell>
            <TableCell align="center">Số lượng</TableCell>
            <TableCell align="right">Tổng</TableCell>
            <TableCell align="center">Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cartItems.map((item) => {
            const key = `${item.product._id}-${item.variant._id}`;
            const quantity = quantities[key] || item.quantity;
            const price = item.variant?.price || 0;
            const totalPrice = price * quantity;
            
            // Debug variant information to identify issues
            console.log('Rendering cart item:', { 
              productId: item.product?._id,
              productName: item.product?.name,
              variantId: item.variant?._id,
              variantName: item.variant?.name,
              price: price
            });

            return (
              <TableRow key={key} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box 
                      component="img" 
                      src={item.product?.images?.[0] || '/placeholder.svg'} 
                      alt={item.product?.name}
                      sx={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 1 }}
                    />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {item.product?.name || 'Sản phẩm không xác định'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Phiên bản: {item.variant?.name || 'Không xác định'}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body1" fontWeight="medium">
                    {formatPrice(item.variant?.price || 0)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDecrementQuantity(item.product._id, item.variant._id)}
                      disabled={quantity <= 1 || updatingItems[key]}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <TextField
                      variant="outlined"
                      size="small"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(item.product._id, item.variant._id, e.target.value)}
                      inputProps={{ 
                        min: 1, 
                        style: { textAlign: 'center', width: '40px' }
                      }}
                      sx={{ mx: 1 }}
                      disabled={updatingItems[key]}
                    />
                    {stockErrors[key] && (
                      <Tooltip title={stockErrors[key]}>
                        <ErrorIcon fontSize="small" color="warning" sx={{ ml: 1 }} />
                      </Tooltip>
                    )}
                    <IconButton 
                      size="small" 
                      onClick={() => handleIncrementQuantity(item.product._id, item.variant._id)}
                      disabled={updatingItems[key] || quantity >= (availableStock[key] || 999)}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                    {updatingItems[key] && (
                      <CircularProgress size={16} sx={{ ml: 1 }} />
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body1" fontWeight="bold" color="primary">
                    {formatPrice(totalPrice)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  {removingItems[key] ? (
                    <CircularProgress size={20} />
                  ) : (
                    <IconButton 
                      color="error" 
                      onClick={() => handleRemoveCartItem(item.product._id, item.variant._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Render cart items for mobile
  const renderMobileCart = () => (
    <Stack spacing={2}>
      {cartItems.map((item) => {
        const key = `${item.product._id}-${item.variant._id}`;
        const quantity = quantities[key] || item.quantity;
        const price = item.variant?.price || 0;
        const totalPrice = price * quantity;
        
        // Debug variant information in mobile view
        console.log('Mobile cart item:', { 
          productId: item.product?._id,
          variantId: item.variant?._id,
          variantName: item.variant?.name,
          price: item.variant?.price || 0
        });

        return (
          <Paper key={key} elevation={1} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Box 
                component="img" 
                src={item.product?.images?.[0] || '/placeholder.svg'} 
                alt={item.product?.name}
                sx={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 1 }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {item.product?.name || 'Sản phẩm không xác định'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Phiên bản: {item.variant?.name || 'Không xác định'}
                </Typography>
                <Typography variant="body1" fontWeight="medium" sx={{ mt: 1 }}>
                  {formatPrice(item.variant?.price || 0)}
                </Typography>
              </Box>
              {removingItems[key] ? (
                <CircularProgress size={20} />
              ) : (
                <IconButton 
                  color="error" 
                  onClick={() => handleRemoveCartItem(item.product._id, item.variant._id)}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton 
                  size="small" 
                  onClick={() => handleDecrementQuantity(item.product._id, item.variant._id)}
                  disabled={quantity <= 1 || updatingItems[key]}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <TextField
                  variant="outlined"
                  size="small"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(item.product._id, item.variant._id, e.target.value)}
                  inputProps={{ 
                    min: 1, 
                    style: { textAlign: 'center', width: '40px' }
                  }}
                  sx={{ mx: 1 }}
                  disabled={updatingItems[key]}
                />
                {stockErrors[key] && (
                  <Tooltip title={stockErrors[key]}>
                    <ErrorIcon fontSize="small" color="warning" sx={{ ml: 1 }} />
                  </Tooltip>
                )}
                <IconButton 
                  size="small" 
                  onClick={() => handleIncrementQuantity(item.product._id, item.variant._id)}
                  disabled={updatingItems[key] || quantity >= (availableStock[key] || 999)}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
                {updatingItems[key] && (
                  <CircularProgress size={16} sx={{ ml: 1 }} />
                )}
              </Box>
              
              <Typography variant="body1" fontWeight="bold" color="primary">
                {formatPrice(totalPrice)}
              </Typography>
            </Box>
          </Paper>
        );
      })}
    </Stack>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/products')}
          sx={{ mr: 2 }}
        >
          Tiếp tục mua sắm
        </Button>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
          Giỏ hàng
        </Typography>
      </Box>

      {loading && cartItems.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {(error || cartError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || cartError}
        </Alert>
      )}

      {!loading && cartItems.length === 0 && (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <CartIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Giỏ hàng của bạn đang trống
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Hãy thêm sản phẩm vào giỏ hàng để tiến hành mua sắm
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/products')} 
            sx={{ mt: 2 }}
          >
            Khám phá sản phẩm
          </Button>
        </Paper>
      )}

      {cartItems.length > 0 && (
        <>
          <Box sx={{ width: '100%', mb: 3 }}>
            {isMobile ? renderMobileCart() : renderDesktopCart()}
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: { xs: 'center', md: 'flex-end' } 
          }}>
            <Card 
              elevation={1} 
              sx={{ 
                width: { xs: '100%', sm: '100%', md: '33.33%' },
                maxWidth: { xs: '100%', sm: '500px', md: '100%' }
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Tóm tắt đơn hàng
                </Typography>
                
                <Box sx={{ my: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">
                      Tạm tính ({cartItems.length} sản phẩm)
                    </Typography>
                    <Typography variant="body1">
                      {formatPrice(getLocalCartTotal())}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">
                      Phí vận chuyển
                    </Typography>
                    <Typography variant="body1">
                      {formatPrice(0)}
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Tổng cộng
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }} color="primary">
                    {formatPrice(getLocalCartTotal())}
                  </Typography>
                </Box>
                
                <Button 
                  variant="contained" 
                  color="warning" 
                  fullWidth 
                  size="large"
                  onClick={() => navigate('/checkout')}
                  sx={{ 
                    fontWeight: 'bold',
                    bgcolor: '#f59e0b',
                    '&:hover': {
                      bgcolor: '#d97706',
                    },
                  }}
                >
                  Tiến hành thanh toán
                </Button>
              </CardContent>
            </Card>
          </Box>
        </>
      )}
    </Container>
  );
};

export default CartPage; 