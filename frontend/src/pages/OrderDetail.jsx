import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Breadcrumbs,
  Link,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Payment as PaymentIcon,
  Store as StoreIcon,
  Home as HomeIcon,
  Print as PrintIcon,
  Assignment as OrderIcon
} from '@mui/icons-material';
import { orderApi } from '../services/api';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await orderApi.getOrderById(id);
        console.log('Order API response:', response.data); // Debug response structure
        
        // Transform data if needed to match component expectations
        let orderData = response.data;
        
        // If data is nested in a 'data' property
        if (response.data?.data && !response.data.items && !response.data.orderItems) {
          orderData = response.data.data;
        }
        
        // Ensure we have a valid order structure
        const processedOrder = {
          ...orderData,
          // Default values for missing properties
          status: orderData.status || 'PENDING',
          createdAt: orderData.createdAt || new Date().toISOString(),
          updatedAt: orderData.updatedAt || orderData.createdAt || new Date().toISOString(),
          totalAmount: orderData.totalAmount || 0,
          subtotal: orderData.subtotal || 0,
          shippingFee: orderData.shippingFee || 0,
          discount: orderData.discount || 0,
          isPaid: !!orderData.isPaid,
          paymentMethod: orderData.paymentMethod || 'COD',
          shippingAddress: orderData.shippingAddress || {}
        };
        
        setOrder(processedOrder);
      } catch (err) {
        console.error('Failed to fetch order details:', err);
        setError('Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  // Format price in VND
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get order status information
  const getOrderStatus = (status) => {
    const statusMap = {
      'PENDING': { 
        color: 'warning', 
        label: 'Chờ xác nhận', 
        icon: <ReceiptIcon fontSize="small" />,
        step: 0
      },
      'PROCESSING': { 
        color: 'info', 
        label: 'Đang xử lý', 
        icon: <ShippingIcon fontSize="small" />,
        step: 1
      },
      'DELIVERED': { 
        color: 'success', 
        label: 'Đã giao hàng', 
        icon: <CheckCircleIcon fontSize="small" />,
        step: 2
      },
      'CANCELLED': { 
        color: 'error', 
        label: 'Đã hủy', 
        icon: <CancelIcon fontSize="small" />,
        step: -1
      }
    };
    
    return statusMap[status] || { 
      color: 'default', 
      label: status, 
      icon: <ReceiptIcon fontSize="small" />,
      step: 0
    };
  };

  // Get payment method label
  const getPaymentMethod = (method) => {
    const methodMap = {
      'COD': 'Thanh toán khi nhận hàng',
      'VNPAY': 'Thanh toán qua VNPay',
      'WALLET': 'Ví điện tử'
    };
    
    return methodMap[method] || method;
  };

  // Handle cancel order
  const handleCancelOrder = async () => {
    try {
      setLoading(true);
      await orderApi.cancelOrder(id);
      // Refresh order data after cancellation
      const response = await orderApi.getOrderById(id);
      setOrder(response.data);
    } catch (err) {
      console.error('Failed to cancel order:', err);
      setError('Không thể hủy đơn hàng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Handle print invoice
  const handlePrintInvoice = () => {
    window.print();
  };

  // Ensure we have valid items array to map over
  const orderItems = order?.items || order?.orderItems || [];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/profile')}
        >
          Quay lại
        </Button>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Không tìm thấy đơn hàng
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/profile')}
        >
          Quay lại
        </Button>
      </Container>
    );
  }

  const orderStatus = getOrderStatus(order.status);

  return (
    <Container maxWidth="lg" sx={{ py: 6 }} className="print-content">
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }} className="no-print">
        <Link underline="hover" color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer' }}>
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Trang chủ
        </Link>
        <Link 
          underline="hover" 
          color="inherit" 
          onClick={() => navigate('/profile')} 
          sx={{ cursor: 'pointer' }}
        >
          <OrderIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Đơn hàng
        </Link>
        <Typography color="text.primary">
          Chi tiết đơn hàng
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }} className="no-print">
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/profile')} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1" fontWeight={600}>
            Chi tiết đơn hàng #{id.substring(id.length - 8)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="In hóa đơn">
            <IconButton 
              color="primary" 
              onClick={handlePrintInvoice}
            >
              <PrintIcon />
            </IconButton>
          </Tooltip>
          {order.status === 'PENDING' && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={handleCancelOrder}
            >
              Hủy đơn hàng
            </Button>
          )}
        </Box>
      </Box>

      {/* Order status and progress */}
      <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Trạng thái đơn hàng
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Chip
                icon={orderStatus.icon}
                label={orderStatus.label}
                color={orderStatus.color}
                sx={{ mr: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Cập nhật lần cuối: {formatDate(order.updatedAt || order.createdAt)}
              </Typography>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Tổng tiền
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="primary">
              {formatPrice(order.totalAmount || 0)}
            </Typography>
          </Box>
        </Box>

        {order.status !== 'CANCELLED' && (
          <Stepper activeStep={orderStatus.step} alternativeLabel>
            <Step key="pending">
              <StepLabel>Chờ xác nhận</StepLabel>
            </Step>
            <Step key="processing">
              <StepLabel>Đang xử lý</StepLabel>
            </Step>
            <Step key="delivered">
              <StepLabel>Đã giao hàng</StepLabel>
            </Step>
          </Stepper>
        )}
      </Paper>

      {/* Main content grid */}
      <Grid container spacing={4}>
        {/* Left column - Order items */}
        <Grid item xs={12} md={8}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Sản phẩm đã mua
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sản phẩm</TableCell>
                    <TableCell align="center">Đơn giá</TableCell>
                    <TableCell align="center">Số lượng</TableCell>
                    <TableCell align="right">Thành tiền</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orderItems.length > 0 ? (
                    orderItems.map((item) => (
                      <TableRow key={item._id || `item-${Math.random()}`}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {item.product?.images?.[0] && (
                              <Box 
                                component="img" 
                                src={item.product.images[0]} 
                                alt={item.product.name}
                                sx={{ width: 50, height: 50, objectFit: 'contain', mr: 2 }}
                              />
                            )}
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {item.product?.name || 'Sản phẩm không xác định'}
                              </Typography>
                              {item.variant && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Phiên bản: {item.variant.name}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          {formatPrice(item.price || item.variant?.price || 0)}
                        </TableCell>
                        <TableCell align="center">
                          {item.quantity}
                        </TableCell>
                        <TableCell align="right">
                          {formatPrice((item.price || item.variant?.price || 0) * (item.quantity || 1))}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography color="text.secondary">
                          Không có thông tin sản phẩm
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '250px', mb: 1 }}>
                <Typography>Tạm tính:</Typography>
                <Typography>{formatPrice(order.subtotal || 0)}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '250px', mb: 1 }}>
                <Typography>Phí vận chuyển:</Typography>
                <Typography>{formatPrice(order.shippingFee || 0)}</Typography>
              </Box>

              {(order.discount || 0) > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '250px', mb: 1 }}>
                  <Typography>Giảm giá:</Typography>
                  <Typography color="error">-{formatPrice(order.discount)}</Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '250px', mt: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">Tổng cộng:</Typography>
                <Typography variant="subtitle1" fontWeight="bold" color="primary">
                  {formatPrice(order.totalAmount || 0)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Right column - Order and shipping info */}
        <Grid item xs={12} md={4}>
          {/* Order Info Card */}
          <Card elevation={1} sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <OrderIcon sx={{ mr: 1 }} />
                Thông tin đơn hàng
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Mã đơn hàng:</Typography>
                <Typography variant="body2" fontWeight={500}>#{id.substring(id.length - 8)}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Ngày đặt hàng:</Typography>
                <Typography variant="body2">{formatDate(order.createdAt)}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Phương thức thanh toán:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PaymentIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2">{getPaymentMethod(order.paymentMethod)}</Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Trạng thái thanh toán:</Typography>
                <Chip
                  size="small"
                  label={order.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                  color={order.isPaid ? "success" : "warning"}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Shipping Address Card */}
          <Card elevation={1} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <HomeIcon sx={{ mr: 1 }} />
                Địa chỉ giao hàng
              </Typography>
              
              {order.shippingAddress ? (
                <>
                  <Typography variant="body1" fontWeight={500} gutterBottom>
                    {order.shippingAddress.fullName}
                  </Typography>
                  
                  <Typography variant="body2" gutterBottom>
                    Số điện thoại: {order.shippingAddress.phoneNumber}
                  </Typography>
                  
                  <Typography variant="body2" component="div">
                    Địa chỉ: {order.shippingAddress.address || ''}{order.shippingAddress.district ? `, ${order.shippingAddress.district}` : ''}{order.shippingAddress.city ? `, ${order.shippingAddress.city}` : ''}
                  </Typography>
                  
                  {order.shippingAddress.notes && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Ghi chú: {order.shippingAddress.notes}
                      </Typography>
                    </Box>
                  )}
                </>
              ) : (
                <Typography color="text.secondary">
                  Không có thông tin địa chỉ giao hàng
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom actions */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }} className="no-print">
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/products')}
          startIcon={<StoreIcon />}
        >
          Tiếp tục mua sắm
        </Button>
      </Box>

      {/* Add some print styling */}
      <style jsx="true">{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-content {
            padding: 0 !important;
          }
        }
      `}</style>
    </Container>
  );
};

export default OrderDetail; 