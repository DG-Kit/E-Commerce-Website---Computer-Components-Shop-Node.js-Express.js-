import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  TextField,
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  Alert,
  Snackbar,
  IconButton,
  Collapse,
  InputAdornment,
  MenuItem,
  Select
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CreditCard as CreditCardIcon,
  LocalShipping as ShippingIcon,
  ReceiptLong as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderApi, couponApi, paymentApi, authApi } from '../services/api';

// Format price to VND
const formatPrice = (price) => {
  if (typeof price !== 'number') return 'N/A';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// Steps for checkout
const steps = ['Thông tin giao hàng', 'Thanh toán', 'Xác nhận đơn hàng'];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, loading: cartLoading } = useCart();
  const { currentUser, isAuthenticated } = useAuth();
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderCreated, setOrderCreated] = useState(false);
  const [orderId, setOrderId] = useState(null);
  
  // User addresses
  const [userAddresses, setUserAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [useNewAddress, setUseNewAddress] = useState(true);
  
  // Shipping information
  const [shippingInfo, setShippingInfo] = useState({
    fullName: currentUser?.fullName || '',
    phoneNumber: currentUser?.phoneNumber || '',
    address: '',
    city: '',
    district: '',
    notes: ''
  });
  
  // Payment method
  const [paymentMethod, setPaymentMethod] = useState('COD');
  
  // Coupon code
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(false);
  const [couponInfo, setCouponInfo] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  
  // Points
  const [pointsToUse, setPointsToUse] = useState(0);
  const [maxPointsCanUse, setMaxPointsCanUse] = useState(0);
  
  // Cart summary
  const [subtotal, setSubtotal] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Notification
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Initialize data
  useEffect(() => {
    if (cartItems.length === 0 && !cartLoading) {
      navigate('/cart');
    }
    
    // Calculate initial values
    const cartTotal = getCartTotal();
    setSubtotal(cartTotal);
    
    // Set shipping fee (could be dynamic based on location, weight, etc.)
    setShippingFee(cartTotal > 2000000 ? 0 : 30000);
    
    // Calculate max points the user can use (10% of subtotal, 1 point = 1000 VND)
    const userPoints = currentUser?.points || 0;
    const maxPointsValue = Math.min(userPoints, Math.floor(cartTotal / 1000));
    setMaxPointsCanUse(maxPointsValue);
    
    // Calculate total
    updateTotalAmount(cartTotal, 0, 0);
    
    // Debugging user object and addresses
    console.log('User object in CheckoutPage:', currentUser);
    console.log('User addresses:', currentUser?.addresses);
    
    // Load user addresses from API if user is logged in
    const loadUserAddresses = async () => {
      if (isAuthenticated) {
        try {
          // Get fresh user data to ensure we have the latest addresses
          const response = await authApi.getCurrentUser();
          const userData = response.data;
          console.log('User data from API:', userData);
          
          if (userData && userData.addresses && userData.addresses.length > 0) {
            const formattedAddresses = userData.addresses.map(address => ({
              id: address._id,
              name: address.name || (address.fullName ? `Địa chỉ của ${address.fullName}` : 'Địa chỉ giao hàng'),
              fullName: address.fullName || '',
              phoneNumber: address.phoneNumber || '',
              street: address.street || '',
              district: address.district || '',
              city: address.city || '',
              isDefault: address.isDefault || false,
              type: address.type || 'home'
            }));
            
            console.log('Formatted addresses:', formattedAddresses);
            setUserAddresses(formattedAddresses);
            
            // Set default address if available
            const defaultAddress = formattedAddresses.find(addr => addr.isDefault);
            if (defaultAddress) {
              setSelectedAddressId(defaultAddress.id);
              setUseNewAddress(false);
              
              // Pre-fill shipping info with default address
              setShippingInfo({
                fullName: defaultAddress.fullName,
                phoneNumber: defaultAddress.phoneNumber,
                address: defaultAddress.street,
                city: defaultAddress.city,
                district: defaultAddress.district,
                notes: ''
              });
            }
          }
        } catch (error) {
          console.error('Error loading user addresses:', error);
        }
      }
    };
    
    loadUserAddresses();
  }, [cartItems, currentUser, getCartTotal, cartLoading, navigate, isAuthenticated]);
  
  // Update total amount when discount or points change
  const updateTotalAmount = (subtotalValue, discountValue, pointsValue) => {
    const newTotal = Math.max(subtotalValue + shippingFee - discountValue - pointsValue, 0);
    setTotalAmount(newTotal);
  };
  
  // Handle shipping info change
  const handleShippingInfoChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo({
      ...shippingInfo,
      [name]: value
    });
  };
  
  // Handle payment method change
  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
  };
  
  // Verify coupon code
  const handleVerifyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Vui lòng nhập mã giảm giá');
      return;
    }
    
    try {
      setCouponLoading(true);
      setCouponError('');
      setCouponSuccess(false);
      
      const response = await couponApi.verifyCoupon({
        code: couponCode,
        amount: subtotal
      });
      
      setCouponInfo(response.data.data);
      setCouponSuccess(true);
      setDiscountAmount(response.data.data.discountAmount);
      
      // Update total amount
      updateTotalAmount(subtotal, response.data.data.discountAmount, pointsToUse * 1000);
      
      setNotification({
        open: true,
        message: 'Mã giảm giá hợp lệ!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error verifying coupon:', error);
      setCouponInfo(null);
      setCouponSuccess(false);
      setDiscountAmount(0);
      
      // Update total without discount
      updateTotalAmount(subtotal, 0, pointsToUse * 1000);
      
      let errorMessage = 'Không thể xác thực mã giảm giá';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      setCouponError(errorMessage);
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setCouponLoading(false);
    }
  };
  
  // Handle points to use change
  const handlePointsChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    
    // Validate points
    if (value < 0) {
      setPointsToUse(0);
    } else if (value > maxPointsCanUse) {
      setPointsToUse(maxPointsCanUse);
    } else {
      setPointsToUse(value);
    }
    
    // Update total amount
    updateTotalAmount(subtotal, discountAmount, value * 1000);
  };
  
  // Remove coupon
  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponInfo(null);
    setCouponSuccess(false);
    setDiscountAmount(0);
    
    // Update total without discount
    updateTotalAmount(subtotal, 0, pointsToUse * 1000);
  };
  
  // Handle step navigation
  const handleNext = () => {
    // Validate current step
    if (activeStep === 0 && !validateShippingInfo()) {
      return;
    }
    
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  // Validate shipping information
  const validateShippingInfo = () => {
    const required = ['fullName', 'phoneNumber', 'address', 'city', 'district'];
    console.log('Current shipping info:', shippingInfo);
    
    // Check which fields are empty
    const emptyFields = required.filter(field => !shippingInfo[field]);
    console.log('Empty fields:', emptyFields);
    
    const isEmpty = emptyFields.length > 0;
    
    if (isEmpty) {
      setError('Vui lòng điền đầy đủ thông tin giao hàng');
      setNotification({
        open: true,
        message: 'Vui lòng điền đầy đủ thông tin giao hàng',
        severity: 'error'
      });
      return false;
    }
    
    // Validate phone number (simple validation)
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    if (!phoneRegex.test(shippingInfo.phoneNumber)) {
      setError('Số điện thoại không hợp lệ');
      setNotification({
        open: true,
        message: 'Số điện thoại không hợp lệ',
        severity: 'error'
      });
      return false;
    }
    
    setError('');
    console.log('Validation passed');
    return true;
  };
  
  // Handle address selection
  const handleAddressSelection = (event) => {
    const value = event.target.value;
    
    if (value === 'new') {
      setUseNewAddress(true);
      setSelectedAddressId('');
      
      // Reset shipping info to user defaults
      setShippingInfo({
        fullName: currentUser?.fullName || '',
        phoneNumber: currentUser?.phoneNumber || '',
        address: '',
        city: '',
        district: '',
        notes: ''
      });
    } else {
      setUseNewAddress(false);
      setSelectedAddressId(value);
      
      // Find the selected address
      const selectedAddress = userAddresses.find(addr => addr.id === value);
      if (selectedAddress) {
        // Update shipping info with selected address
        setShippingInfo({
          fullName: selectedAddress.fullName,
          phoneNumber: selectedAddress.phoneNumber,
          address: selectedAddress.street,
          city: selectedAddress.city,
          district: selectedAddress.district,
          notes: ''
        });
        
        // Log the selected address for debugging
        console.log('Selected address for checkout:', selectedAddress);
      }
    }
  };
  
  // Place order
  const handlePlaceOrder = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Format cart items to match backend expectations
      const items = cartItems.map(item => ({
        productId: item.product._id,
        variantId: item.variant._id,
        quantity: item.quantity
      }));
      
      const orderData = {
        items: items,
        shippingAddress: {
          ...shippingInfo
        },
        paymentMethod,
        discountCode: couponSuccess ? couponCode : null,
        pointsUsed: pointsToUse
      };
      
      const response = await orderApi.createOrder(orderData);
      
      setOrderId(response.data.data._id);
      setOrderCreated(true);
      
      // If payment method is VNPAY, redirect to VNPay
      if (paymentMethod === 'VNPAY') {
        // Create payment URL
        const paymentResponse = await paymentApi.createVNPayUrl({
          orderId: response.data.data._id
        });
        
        // Redirect to VNPay payment page
        window.location.href = paymentResponse.data.data.paymentUrl;
      } else {
        // Move to confirmation step for COD or other payment methods
        setActiveStep(3);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      
      let errorMessage = 'Không thể đặt hàng';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle notification close
  const handleNotificationClose = () => {
    setNotification({
      ...notification,
      open: false
    });
  };
  
  // Go to home
  const handleGoToHome = () => {
    navigate('/');
  };
  
  // Go to order details
  const handleViewOrder = () => {
    navigate(`/orders/${orderId}`);
  };
  
  // Render shipping form
  const renderShippingForm = () => (
    <Box component={Paper} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Thông tin giao hàng
      </Typography>
      
      {isAuthenticated && userAddresses.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Chọn địa chỉ giao hàng
          </Typography>
          
          <RadioGroup
            value={useNewAddress ? 'new' : selectedAddressId}
            onChange={handleAddressSelection}
          >
            {userAddresses.map((address) => (
              <FormControlLabel
                key={address.id}
                value={address.id}
                control={<Radio />}
                label={
                  <Box sx={{ ml: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {address.type === 'home' ? (
                        <HomeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      ) : address.type === 'office' ? (
                        <BusinessIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      ) : (
                        <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      )}
                      <Typography variant="subtitle2">
                        {address.name} {address.isDefault && ' (Mặc định)'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {address.fullName} | {address.phoneNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {address.street}, {address.district}, {address.city}
                    </Typography>
                  </Box>
                }
                sx={{ 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 1,
                  mb: 1,
                  py: 1,
                  '&.Mui-checked': {
                    border: '1px solid #1976d2'
                  }
                }}
              />
            ))}
            
            <FormControlLabel
              value="new"
              control={<Radio />}
              label={
                <Box sx={{ ml: 1 }}>
                  <Typography variant="subtitle2">
                    Thêm địa chỉ mới
                  </Typography>
                </Box>
              }
              sx={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 1,
                py: 1
              }}
            />
          </RadioGroup>
        </Box>
      )}
      
      {(useNewAddress || userAddresses.length === 0) && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Họ và tên"
              name="fullName"
              value={shippingInfo.fullName}
              onChange={handleShippingInfoChange}
              placeholder="Nguyễn Văn A"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Số điện thoại"
              name="phoneNumber"
              value={shippingInfo.phoneNumber}
              onChange={handleShippingInfoChange}
              placeholder="0901234567"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Địa chỉ"
              name="address"
              value={shippingInfo.address}
              onChange={handleShippingInfoChange}
              placeholder="Số nhà, tên đường"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Tỉnh/Thành phố"
              name="city"
              value={shippingInfo.city}
              onChange={handleShippingInfoChange}
              placeholder="Hồ Chí Minh"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Quận/Huyện"
              name="district"
              value={shippingInfo.district}
              onChange={handleShippingInfoChange}
              placeholder="Quận 1"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Ghi chú"
              name="notes"
              value={shippingInfo.notes}
              onChange={handleShippingInfoChange}
              multiline
              rows={3}
              placeholder="Thông tin thêm về đơn hàng (tùy chọn)"
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
  
  // Render payment methods
  const renderPaymentMethods = () => (
    <Box component={Paper} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Phương thức thanh toán
      </Typography>
      
      <FormControl component="fieldset">
        <RadioGroup 
          name="paymentMethod" 
          value={paymentMethod} 
          onChange={handlePaymentMethodChange}
        >
          <FormControlLabel 
            value="COD" 
            control={<Radio />} 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box component="img" src="/icons/cod.svg" alt="COD" sx={{ width: 32, mr: 1 }} />
                <Box>
                  <Typography variant="body1">Thanh toán khi nhận hàng (COD)</Typography>
                  <Typography variant="body2" color="text.secondary">Thanh toán bằng tiền mặt khi nhận hàng</Typography>
                </Box>
              </Box>
            } 
          />
          
          <FormControlLabel 
            value="VNPAY" 
            control={<Radio />} 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box component="img" src="/icons/vnpay.svg" alt="VNPay" sx={{ width: 32, mr: 1 }} />
                <Box>
                  <Typography variant="body1">Thanh toán qua VNPay</Typography>
                  <Typography variant="body2" color="text.secondary">Thanh toán qua cổng VNPay bằng QR code hoặc thẻ ngân hàng</Typography>
                </Box>
              </Box>
            } 
          />
        </RadioGroup>
      </FormControl>
    </Box>
  );
  
  // Render order summary
  const renderOrderSummary = (showDetails = false) => (
    <Box component={Paper} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Tóm tắt đơn hàng
      </Typography>
      
      {showDetails && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Sản phẩm ({cartItems.length})
          </Typography>
          
          {cartItems.map((item) => (
            <Box 
              key={`${item.product._id}-${item.variant._id}`}
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                py: 1,
                borderBottom: '1px solid #f0f0f0'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box component="img" 
                  src={item.product?.images?.[0] || '/placeholder.svg'}
                  alt={item.product?.name}
                  sx={{ width: 40, height: 40, mr: 1 }}
                />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {item.product?.name} ({item.variant?.name})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {`SL: ${item.quantity}`}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {formatPrice(item.variant?.price * item.quantity)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
      
      {activeStep === 1 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Mã giảm giá
          </Typography>
          
          <Box sx={{ display: 'flex', mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Nhập mã giảm giá"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              disabled={couponLoading || couponSuccess}
              error={!!couponError}
              helperText={couponError}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {couponLoading ? (
                      <CircularProgress size={20} />
                    ) : couponSuccess ? (
                      <IconButton size="small" onClick={handleRemoveCoupon}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    ) : null}
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              variant="outlined"
              sx={{ ml: 1, whiteSpace: 'nowrap' }}
              onClick={handleVerifyCoupon}
              disabled={couponLoading || couponSuccess || !couponCode.trim()}
            >
              Áp dụng
            </Button>
          </Box>
          
          {couponSuccess && couponInfo && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Mã giảm giá {couponInfo.type === 'PERCENTAGE' ? 
                  `${couponInfo.value}%` : 
                  formatPrice(couponInfo.value)
                } đã được áp dụng!
              </Typography>
            </Alert>
          )}
          
          {isAuthenticated && currentUser?.points > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Sử dụng điểm tích lũy
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  Bạn có {currentUser.points} điểm (tương đương {formatPrice(currentUser.points * 1000)})
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                  type="number"
                  size="small"
                  label="Điểm sử dụng"
                  value={pointsToUse}
                  onChange={handlePointsChange}
                  InputProps={{
                    inputProps: { min: 0, max: maxPointsCanUse }
                  }}
                  sx={{ width: 150 }}
                />
                
                <Typography variant="body2" sx={{ ml: 2 }}>
                  = {formatPrice(pointsToUse * 1000)}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      )}
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ mb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body1">
            Tạm tính
          </Typography>
          <Typography variant="body1">
            {formatPrice(subtotal)}
          </Typography>
        </Box>
        
        {shippingFee > 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body1">
              Phí vận chuyển
            </Typography>
            <Typography variant="body1">
              {formatPrice(shippingFee)}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body1">
              Phí vận chuyển
            </Typography>
            <Typography variant="body1" color="success.main">
              Miễn phí
            </Typography>
          </Box>
        )}
        
        {discountAmount > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body1">
              Giảm giá (mã {couponCode})
            </Typography>
            <Typography variant="body1" color="error.main">
              -{formatPrice(discountAmount)}
            </Typography>
          </Box>
        )}
        
        {pointsToUse > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body1">
              Điểm sử dụng ({pointsToUse} điểm)
            </Typography>
            <Typography variant="body1" color="error.main">
              -{formatPrice(pointsToUse * 1000)}
            </Typography>
          </Box>
        )}
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Tổng cộng
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }} color="primary">
          {formatPrice(totalAmount)}
        </Typography>
      </Box>
      
      {activeStep === 1 && (
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handlePlaceOrder}
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Đặt hàng'}
        </Button>
      )}
    </Box>
  );
  
  // Render order confirmation
  const renderOrderConfirmation = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
      
      <Typography variant="h5" gutterBottom>
        Đặt hàng thành công!
      </Typography>
      
      <Typography variant="body1" paragraph>
        Cảm ơn bạn đã đặt hàng. Mã đơn hàng của bạn là <strong>#{orderId}</strong>.
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Chúng tôi sẽ gửi email xác nhận đơn hàng cho bạn và cập nhật trạng thái đơn hàng.
      </Typography>
      
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={handleGoToHome}
        >
          Tiếp tục mua sắm
        </Button>
        
        <Button
          variant="contained"
          onClick={handleViewOrder}
        >
          Xem đơn hàng
        </Button>
      </Box>
    </Box>
  );
  
  // Render current step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              {renderShippingForm()}
            </Grid>
            <Grid item xs={12} md={4}>
              {renderOrderSummary()}
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              {renderPaymentMethods()}
            </Grid>
            <Grid item xs={12} md={4}>
              {renderOrderSummary()}
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Box component={Paper} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Thông tin giao hàng
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Họ và tên
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {shippingInfo.fullName}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Số điện thoại
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {shippingInfo.phoneNumber}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Địa chỉ giao hàng
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {`${shippingInfo.address}, ${shippingInfo.district}, ${shippingInfo.city}`}
                    </Typography>
                  </Grid>
                  
                  {shippingInfo.notes && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Ghi chú
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {shippingInfo.notes}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
              
              <Box component={Paper} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Phương thức thanh toán
                </Typography>
                
                <Typography variant="body1">
                  {paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán qua VNPay'}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              {renderOrderSummary(true)}
              
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handlePlaceOrder}
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Xác nhận đặt hàng'}
              </Button>
            </Grid>
          </Grid>
        );
      case 3:
        return renderOrderConfirmation();
      default:
        return 'Unknown step';
    }
  };
  
  // If no cart items, redirect to cart page
  if (cartItems.length === 0 && !cartLoading) {
    return null; // Already redirecting in useEffect
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/cart')}
          sx={{ mr: 2 }}
          disabled={orderCreated}
        >
          Quay lại giỏ hàng
        </Button>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
          Thanh toán
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {!orderCreated && (
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}
      
      {getStepContent(activeStep)}
      
      {!orderCreated && activeStep !== 3 && (
        <Box sx={{ display: 'flex', mt: 4 }}>
          {activeStep !== 0 && (
            <Button
              variant="outlined"
              onClick={handleBack}
              sx={{ mr: 1 }}
              disabled={loading}
            >
              Quay lại
            </Button>
          )}
          
          {activeStep !== 2 && (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
            >
              Tiếp theo
            </Button>
          )}
        </Box>
      )}
      
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleNotificationClose} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CheckoutPage; 