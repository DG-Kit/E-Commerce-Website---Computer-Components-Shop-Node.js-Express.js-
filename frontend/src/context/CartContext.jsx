import React, { createContext, useState, useContext, useEffect } from 'react';
import { cartApi } from '../services/api';
import { useAuth } from './AuthContext';
import { Snackbar, Alert } from '@mui/material';

// Create cart context
const CartContext = createContext();

// Custom hook to use the cart context
export const useCart = () => {
  return useContext(CartContext);
};

// Cart provider component
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  
  // Add notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success', // success, error, warning, info
  });

  // Function to show notification
  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  // Function to hide notification
  const hideNotification = () => {
    setNotification(prev => ({
      ...prev,
      open: false,
    }));
  };

  // Fetch cart items when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCartItems();
    } else {
      setCartItems([]);
    }
  }, [isAuthenticated]);

  // Fetch cart items from API
  const fetchCartItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.getCart();
      setCartItems(response.data.cart || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setError('Không thể tải giỏ hàng');
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (productId, variantId, quantity) => {
    if (!isAuthenticated) {
      setError('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      showNotification('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng', 'error');
      return { success: false, message: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng' };
    }

    try {
      setLoading(true);
      setError(null);
      
      // Đảm bảo chuyển đổi ID sang string
      const data = {
        productId: productId.toString(),
        variantId: variantId.toString(),
        quantity: Number(quantity)
      };
      
      const response = await cartApi.addToCart(data);
      
      // Cập nhật state giỏ hàng sau khi thêm thành công
      await fetchCartItems();
      
      // Show success notification
      showNotification('Đã thêm sản phẩm vào giỏ hàng');
      
      return { 
        success: true, 
        message: 'Đã thêm vào giỏ hàng', 
        data: response.data 
      };
    } catch (error) {
      console.error('Error adding to cart:', error);
      
      let errorMessage = 'Không thể thêm vào giỏ hàng';
      if (error.response && error.response.data && error.response.data.msg) {
        errorMessage = error.response.data.msg;
      }
      
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update cart item quantity
  const updateCartItem = async (productId, variantId, quantity) => {
    if (!isAuthenticated) {
      setError('Vui lòng đăng nhập để cập nhật giỏ hàng');
      showNotification('Vui lòng đăng nhập để cập nhật giỏ hàng', 'error');
      return { success: false, message: 'Vui lòng đăng nhập để cập nhật giỏ hàng' };
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = {
        productId: productId.toString(),
        variantId: variantId.toString(),
        quantity: Number(quantity)
      };
      
      const response = await cartApi.updateCartItem(data);
      
      // Cập nhật state giỏ hàng sau khi cập nhật thành công
      await fetchCartItems();
      
      // Show success notification
      showNotification('Đã cập nhật giỏ hàng');
      
      return { 
        success: true, 
        message: 'Đã cập nhật giỏ hàng', 
        data: response.data 
      };
    } catch (error) {
      console.error('Error updating cart:', error);
      
      let errorMessage = 'Không thể cập nhật giỏ hàng';
      if (error.response && error.response.data && error.response.data.msg) {
        errorMessage = error.response.data.msg;
      }
      
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId, variantId) => {
    if (!isAuthenticated) {
      setError('Vui lòng đăng nhập để xóa sản phẩm khỏi giỏ hàng');
      showNotification('Vui lòng đăng nhập để xóa sản phẩm khỏi giỏ hàng', 'error');
      return { success: false, message: 'Vui lòng đăng nhập để xóa sản phẩm khỏi giỏ hàng' };
    }

    // Check if productId or variantId are undefined
    if (!productId || !variantId) {
      console.error('Error: productId or variantId is undefined', { productId, variantId });
      
      // Log detailed information about available cart items to help debug
      console.log('Current cart items:', cartItems.map(item => ({
        productId: item.product?._id,
        variantId: item.variant?._id,
        product: item.product?.name,
        variant: item.variant?.name
      })));
      
      setError('Không thể xóa sản phẩm. Thông tin sản phẩm không hợp lệ.');
      showNotification('Không thể xóa sản phẩm. Thông tin sản phẩm không hợp lệ.', 'error');
      return { success: false, message: 'Thông tin sản phẩm không hợp lệ' };
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Removing cart item with:', { productId, variantId });
      
      const data = {
        productId: productId.toString(),
        variantId: variantId.toString()
      };
      
      const response = await cartApi.removeFromCart(data);
      
      // Cập nhật state giỏ hàng sau khi xóa thành công
      await fetchCartItems();
      
      // Show success notification
      showNotification('Đã xóa sản phẩm khỏi giỏ hàng');
      
      return { 
        success: true, 
        message: 'Đã xóa sản phẩm khỏi giỏ hàng', 
        data: response.data 
      };
    } catch (error) {
      console.error('Error removing from cart:', error);
      
      let errorMessage = 'Không thể xóa sản phẩm khỏi giỏ hàng';
      if (error.response && error.response.data && error.response.data.msg) {
        errorMessage = error.response.data.msg;
      }
      
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Get cart count
  const getCartCount = () => {
    return cartItems.length;
  };

  // Get cart total
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      // Tìm giá từ variant
      const variant = item.variant;
      const price = variant ? variant.price : 0;
      return total + (price * item.quantity);
    }, 0);
  };

  // Context value
  const value = {
    cartItems,
    loading,
    error,
    addToCart,
    updateCartItem,
    removeFromCart,
    getCartCount,
    getCartTotal,
    fetchCartItems,
    showNotification
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      <Snackbar 
        open={notification.open}
        autoHideDuration={3000}
        onClose={hideNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={hideNotification} 
          severity={notification.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </CartContext.Provider>
  );
};

export default CartContext; 