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
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
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
  FormControlLabel,
  InputLabel,
  Select,
  Switch,
  OutlinedInput,
  FormHelperText,
  ListItemIcon,
} from '@mui/material';

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  LocalOffer as LocalOfferIcon,
  ToggleOff as ToggleOffIcon,
  ToggleOn as ToggleOnIcon,
} from '@mui/icons-material';

import { adminApi } from '../../services/api';

const Coupons = () => {
  // State for coupons data
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCoupons, setTotalCoupons] = useState(0);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [couponFormData, setCouponFormData] = useState({
    code: '',
    value: '',
    type: 'PERCENTAGE',
    maxUses: 1,
    isActive: true,
  });
  const [couponFormErrors, setCouponFormErrors] = useState({});
  
  // Action menu state
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
  const [selectedCouponId, setSelectedCouponId] = useState(null);
  
  // Fetch coupons with pagination and search
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: page + 1, // API is 1-indexed
        limit: rowsPerPage,
        search: searchTerm,
      };
      
      const response = await adminApi.getAllCoupons(params);
      
      if (response.data?.data) {
        setCoupons(response.data.data.coupons || []);
        setTotalCoupons(response.data.data.totalCoupons || 0);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setError('Không thể tải danh sách mã giảm giá. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCoupons();
  }, [page, rowsPerPage]);

  // Handle search
  const handleSearch = (event) => {
    event.preventDefault();
    setPage(0); // Reset to first page
    fetchCoupons();
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Action menu handlers
  const handleActionClick = (event, couponId) => {
    setActionMenuAnchorEl(event.currentTarget);
    setSelectedCouponId(couponId);
  };

  const handleActionClose = () => {
    setActionMenuAnchorEl(null);
  };

  // Add/Edit coupon dialog handlers
  const handleAddCoupon = () => {
    setCouponFormData({
      code: '',
      value: '',
      type: 'PERCENTAGE',
      maxUses: 1,
      isActive: true,
    });
    setCouponFormErrors({});
    setCouponDialogOpen(true);
    setSelectedCoupon(null);
  };

  const handleEditCoupon = (coupon) => {
    setCouponFormData({
      code: coupon.code || '',
      value: coupon.value || '',
      type: coupon.type || 'PERCENTAGE',
      maxUses: coupon.maxUses || 1,
      isActive: coupon.isActive,
    });
    setCouponFormErrors({});
    setCouponDialogOpen(true);
    setSelectedCoupon(coupon);
    handleActionClose();
  };

  const handleCouponDialogClose = () => {
    setCouponDialogOpen(false);
  };

  // Coupon form change handlers
  const handleCouponFormChange = (e) => {
    const { name, value, checked } = e.target;
    
    if (name === 'code') {
      // Convert to uppercase
      setCouponFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase()
      }));
    } else if (name === 'isActive') {
      setCouponFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setCouponFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear validation error when field is changed
    if (couponFormErrors[name]) {
      setCouponFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate coupon form
  const validateCouponForm = () => {
    const errors = {};
    
    if (!couponFormData.code.trim()) {
      errors.code = 'Mã giảm giá không được để trống';
    } else if (!/^[A-Z0-9]{5}$/.test(couponFormData.code)) {
      errors.code = 'Mã giảm giá phải gồm 5 ký tự chữ hoa hoặc số';
    }
    
    if (!couponFormData.value || couponFormData.value <= 0) {
      errors.value = 'Giá trị giảm giá phải lớn hơn 0';
    } else if (couponFormData.type === 'PERCENTAGE' && couponFormData.value > 100) {
      errors.value = 'Giá trị phần trăm không được vượt quá 100%';
    }
    
    if (!couponFormData.maxUses || couponFormData.maxUses <= 0) {
      errors.maxUses = 'Số lần sử dụng tối đa phải lớn hơn 0';
    } else if (couponFormData.maxUses > 10) {
      errors.maxUses = 'Số lần sử dụng tối đa không được vượt quá 10';
    }
    
    setCouponFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save coupon
  const handleSaveCoupon = async () => {
    if (!validateCouponForm()) return;
    
    try {
      setLoading(true);
      
      if (selectedCoupon) {
        // Update existing coupon
        await adminApi.updateCoupon(selectedCoupon._id, couponFormData);
      } else {
        // Create new coupon
        await adminApi.createCoupon(couponFormData);
      }
      
      setCouponDialogOpen(false);
      fetchCoupons(); // Refresh the list
    } catch (error) {
      console.error('Error saving coupon:', error);
      setError(selectedCoupon 
        ? 'Không thể cập nhật mã giảm giá. Vui lòng thử lại sau.' 
        : 'Không thể tạo mã giảm giá. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Delete dialog handlers
  const handleDeleteClick = (coupon) => {
    setSelectedCoupon(coupon);
    setDeleteDialogOpen(true);
    handleActionClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCoupon) return;

    try {
      setLoading(true);
      await adminApi.deleteCoupon(selectedCoupon._id);
      setDeleteDialogOpen(false);
      setSelectedCoupon(null);
      fetchCoupons(); // Refresh the list
    } catch (error) {
      console.error('Error deleting coupon:', error);
      setError('Không thể xóa mã giảm giá. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedCoupon(null);
  };

  // Toggle coupon status
  const handleToggleStatus = async (couponId, isActive) => {
    try {
      setLoading(true);
      await adminApi.updateCouponStatus(couponId, { isActive: !isActive });
      fetchCoupons(); // Refresh the list
      handleActionClose();
    } catch (error) {
      console.error('Error updating coupon status:', error);
      setError('Không thể cập nhật trạng thái mã giảm giá. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0đ';
    }
    
    const numAmount = Number(amount);
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numAmount);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1" fontWeight={600}>
          Quản lý mã giảm giá
        </Typography>
        <Box>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              mr: 1
            }}
            onClick={handleAddCoupon}
          >
            Tạo mã giảm giá
          </Button>
          <IconButton 
            aria-label="refresh" 
            onClick={() => fetchCoupons()}
            sx={{ ml: 1 }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Search Bar */}
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
          <Grid item xs={12}>
            <form onSubmit={handleSearch}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm mã giảm giá..."
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
        </Grid>
      </Card>

      {/* Coupons Table */}
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
                <TableCell sx={{ fontWeight: 600 }}>Mã giảm giá</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Giá trị</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Loại</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Sử dụng</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      Không tìm thấy mã giảm giá nào
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon) => (
                  <TableRow
                    key={coupon._id}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.02)'
                      }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocalOfferIcon sx={{ color: 'primary.main', mr: 1 }} />
                        <Typography variant="body2" fontWeight={600}>
                          {coupon.code}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {coupon.type === 'PERCENTAGE' ? (
                        <Typography variant="body2">
                          {coupon.value}%
                        </Typography>
                      ) : (
                        <Typography variant="body2">
                          {formatCurrency(coupon.value)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={coupon.type === 'PERCENTAGE' ? 'Phần trăm' : 'Số tiền cố định'}
                        size="small"
                        sx={{
                          backgroundColor: coupon.type === 'PERCENTAGE' ? '#EFF6FF' : '#F0FDF4',
                          color: coupon.type === 'PERCENTAGE' ? '#1D4ED8' : '#16A34A',
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {coupon.currentUses} / {coupon.maxUses}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {coupon.currentUses >= coupon.maxUses ? "Đã hết lượt sử dụng" : "Còn lượt sử dụng"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={coupon.isActive ? 'Đang hoạt động' : 'Vô hiệu'}
                        size="small"
                        sx={{
                          backgroundColor: coupon.isActive ? '#ECFDF5' : '#F3F4F6',
                          color: coupon.isActive ? '#10B981' : '#6B7280',
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(event) => handleActionClick(event, coupon._id)}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={totalCoupons}
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

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchorEl}
        open={Boolean(actionMenuAnchorEl)}
        onClose={handleActionClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => {
          const coupon = coupons.find(c => c._id === selectedCouponId);
          if (coupon) {
            handleEditCoupon(coupon);
          }
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Chỉnh sửa
        </MenuItem>
        <MenuItem onClick={() => {
          const coupon = coupons.find(c => c._id === selectedCouponId);
          if (coupon) {
            handleToggleStatus(selectedCouponId, coupon.isActive);
          }
        }}>
          <ListItemIcon>
            {coupons.find(c => c._id === selectedCouponId)?.isActive 
              ? <ToggleOffIcon fontSize="small" color="error" />
              : <ToggleOnIcon fontSize="small" color="success" />
            }
          </ListItemIcon>
          {coupons.find(c => c._id === selectedCouponId)?.isActive 
            ? 'Vô hiệu hóa'
            : 'Kích hoạt'
          }
        </MenuItem>
        <MenuItem 
          onClick={() => {
            const coupon = coupons.find(c => c._id === selectedCouponId);
            if (coupon) {
              handleDeleteClick(coupon);
            }
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          Xóa mã giảm giá
        </MenuItem>
      </Menu>

      {/* Add/Edit Coupon Dialog */}
      <Dialog
        open={couponDialogOpen}
        onClose={handleCouponDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedCoupon ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="code"
                label="Mã giảm giá"
                fullWidth
                value={couponFormData.code}
                onChange={handleCouponFormChange}
                error={!!couponFormErrors.code}
                helperText={couponFormErrors.code || "Nhập 5 ký tự chữ hoa, số (VD: SALE5, GIAMGIA, ABC12)"}
                inputProps={{ maxLength: 5 }}
                disabled={selectedCoupon != null} // Không cho phép sửa mã khi đang edit
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="value"
                label="Giá trị"
                fullWidth
                type="number"
                value={couponFormData.value}
                onChange={handleCouponFormChange}
                error={!!couponFormErrors.value}
                helperText={couponFormErrors.value}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {couponFormData.type === 'PERCENTAGE' ? '%' : 'đ'}
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="coupon-type-label">Loại giảm giá</InputLabel>
                <Select
                  labelId="coupon-type-label"
                  name="type"
                  value={couponFormData.type}
                  onChange={handleCouponFormChange}
                  input={<OutlinedInput label="Loại giảm giá" />}
                >
                  <MenuItem value="PERCENTAGE">Phần trăm (%)</MenuItem>
                  <MenuItem value="FIXED">Số tiền cố định (VND)</MenuItem>
                </Select>
                <FormHelperText>
                  {couponFormData.type === 'PERCENTAGE' 
                    ? 'Giảm giá theo phần trăm trên tổng hóa đơn' 
                    : 'Giảm giá theo số tiền cố định'}
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="maxUses"
                label="Số lần sử dụng tối đa"
                fullWidth
                type="number"
                value={couponFormData.maxUses}
                onChange={handleCouponFormChange}
                error={!!couponFormErrors.maxUses}
                helperText={couponFormErrors.maxUses || "Tối đa 10 lần sử dụng"}
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={couponFormData.isActive}
                    onChange={handleCouponFormChange}
                    name="isActive"
                    color="primary"
                  />
                }
                label={couponFormData.isActive ? "Mã đang hoạt động" : "Mã không hoạt động"}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCouponDialogClose} color="inherit">
            Hủy bỏ
          </Button>
          <Button 
            onClick={handleSaveCoupon} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Lưu mã giảm giá'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Xác nhận xóa mã giảm giá?"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Bạn có chắc chắn muốn xóa mã giảm giá <b>{selectedCoupon?.code}</b>?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Hành động này không thể hoàn tác và sẽ làm mã giảm giá không còn hiệu lực.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="inherit">
            Hủy bỏ
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Xóa mã giảm giá
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Coupons; 