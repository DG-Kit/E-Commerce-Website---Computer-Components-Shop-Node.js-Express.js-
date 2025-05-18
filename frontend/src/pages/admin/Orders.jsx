import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Snackbar,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';

import {
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

import { adminApi } from '../../services/api';

const Orders = () => {
  // State for orders data
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  
  // Fetch orders with pagination, search and filter
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: page + 1, // API is 1-indexed
        limit: rowsPerPage,
        search: searchTerm,
        status: filterStatus,
      };
      
      const response = await adminApi.getAllOrders(params);
      
      if (response.data?.data) {
        setOrders(response.data.data.orders || []);
        setTotalOrders(response.data.data.totalOrders || 0);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchOrders();
  }, [page, rowsPerPage, filterStatus]);

  // Handle search form submit
  const handleSearch = (event) => {
    event.preventDefault();
    fetchOrders();
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0đ';
    }
    // Ensure amount is a number
    const numAmount = Number(amount);
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numAmount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Get status color and label
  const getStatusInfo = (status) => {
    switch (status) {
      case 'PENDING':
        return { color: '#FCD34D', textColor: '#92400E', label: 'Chờ xử lý' };
      case 'PROCESSING':
        return { color: '#60A5FA', textColor: '#1E40AF', label: 'Đang xử lý' };
      case 'SHIPPED':
        return { color: '#818CF8', textColor: '#3730A3', label: 'Đang giao hàng' };
      case 'DELIVERED':
        return { color: '#34D399', textColor: '#065F46', label: 'Đã giao hàng' };
      case 'CANCELLED':
        return { color: '#F87171', textColor: '#991B1B', label: 'Đã hủy' };
      default:
        return { color: '#E5E7EB', textColor: '#374151', label: 'Không xác định' };
    }
  };

  // View order detail handler
  const handleViewOrderDetail = (orderId) => {
    // Navigate to order detail page
    window.location.href = `/admin/orders/${orderId}`;
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await adminApi.updateOrderStatus(orderId, newStatus);
      setSnackbar({ open: true, message: 'Cập nhật trạng thái thành công!', severity: 'success' });
      fetchOrders();
    } catch (error) {
      setSnackbar({ open: true, message: 'Cập nhật trạng thái thất bại!', severity: 'error' });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1" fontWeight={600}>
          Quản lý đơn hàng
        </Typography>
        <IconButton 
          aria-label="refresh" 
          onClick={() => fetchOrders()}
        >
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Search and Filter */}
      <Card 
        variant="outlined"
        sx={{ 
          mb: 3, 
          p: 2, 
          borderRadius: 2,
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)' 
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={8}>
            <form onSubmit={handleSearch}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm đơn hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
                size="small"
                sx={{ borderRadius: 2 }}
              />
            </form>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-filter-label">Trạng thái</InputLabel>
              <Select
                labelId="status-filter-label"
                value={filterStatus}
                label="Trạng thái"
                onChange={(e) => setFilterStatus(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <FilterListIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                }
              >
                <MenuItem value="">Tất cả trạng thái</MenuItem>
                <MenuItem value="PENDING">Chờ xử lý</MenuItem>
                <MenuItem value="PROCESSING">Đang xử lý</MenuItem>
                <MenuItem value="SHIPPED">Đang giao hàng</MenuItem>
                <MenuItem value="DELIVERED">Đã giao hàng</MenuItem>
                <MenuItem value="CANCELLED">Đã hủy</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* Orders Table */}
      <Card 
        variant="outlined"
        sx={{ 
          borderRadius: 2, 
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)' 
        }}
      >
        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        <TableContainer component={Paper} elevation={0}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600 }}>Mã đơn hàng</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Khách hàng</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Ngày đặt</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tổng tiền</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Thanh toán</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      Không tìm thấy đơn hàng nào
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const statusInfo = getStatusInfo(order.status);
                  
                  return (
                    <TableRow
                      key={order._id}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.02)'
                        }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          #{order._id.slice(-6).toUpperCase()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {order.shippingAddress?.fullName || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.shippingAddress?.phoneNumber || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {formatCurrency(order.totalAmount)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.items?.length || 0} sản phẩm
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusInfo.label}
                          size="small"
                          sx={{
                            backgroundColor: `${statusInfo.color}20`,
                            color: statusInfo.textColor,
                            fontWeight: 500,
                            fontSize: '0.75rem'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                          size="small"
                          sx={{
                            backgroundColor: order.isPaid ? '#ECFDF5' : '#FEF2F2',
                            color: order.isPaid ? '#10B981' : '#EF4444',
                            fontWeight: 500,
                            fontSize: '0.75rem'
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleViewOrderDetail(order._id)}
                          aria-label="Xem chi tiết đơn hàng"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        {order.status === 'PENDING' && (
                          <Button
                            size="small"
                            color="primary"
                            variant="contained"
                            sx={{ ml: 1 }}
                            disabled={updatingOrderId === order._id}
                            onClick={() => handleUpdateOrderStatus(order._id, 'PROCESSING')}
                          >
                            Xác nhận đơn
                          </Button>
                        )}
                        {order.status === 'PROCESSING' && (
                          <Button
                            size="small"
                            color="info"
                            variant="contained"
                            sx={{ ml: 1 }}
                            disabled={updatingOrderId === order._id}
                            onClick={() => handleUpdateOrderStatus(order._id, 'SHIPPED')}
                          >
                            Xác nhận đang giao
                          </Button>
                        )}
                        {order.status === 'SHIPPED' && (
                          <Button
                            size="small"
                            color="success"
                            variant="contained"
                            sx={{ ml: 1 }}
                            disabled={updatingOrderId === order._id}
                            onClick={() => handleUpdateOrderStatus(order._id, 'DELIVERED')}
                          >
                            Xác nhận đã giao
                          </Button>
                        )}
                        {order.status === 'DELIVERED' && !order.isPaid && (
                          <Button
                            size="small"
                            color="success"
                            variant="contained"
                            sx={{ ml: 1 }}
                            disabled={updatingOrderId === order._id}
                            onClick={() => handleUpdateOrderStatus(order._id, 'DELIVERED')}
                          >
                            Xác nhận đã thanh toán
                          </Button>
                        )}
                        {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            sx={{ ml: 1 }}
                            disabled={updatingOrderId === order._id}
                            onClick={() => handleUpdateOrderStatus(order._id, 'CANCELLED')}
                          >
                            Hủy đơn
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={totalOrders}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Hiển thị:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`}
        />
      </Card>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <MuiAlert elevation={6} variant="filled" onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default Orders; 