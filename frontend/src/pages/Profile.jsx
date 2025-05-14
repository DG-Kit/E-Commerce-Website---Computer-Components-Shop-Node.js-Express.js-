import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardActions,
  FormControlLabel,
  Checkbox,
  Stack,
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { addressApi } from '../services/api';
import { authApi } from '../services/api';

// Sample shipping addresses for demonstration
const sampleAddresses = [
  {
    id: 1,
    name: 'Nhà riêng',
    recipient: 'Nguyễn Văn A',
    phone: '0987654321',
    address: '123 Đường Nguyễn Văn Linh, Phường Bình Thuận, Quận 7',
    city: 'TP Hồ Chí Minh',
    isDefault: true,
    type: 'home'
  },
  {
    id: 2,
    name: 'Văn phòng',
    recipient: 'Nguyễn Văn A',
    phone: '0987654322',
    address: '456 Đường Lê Lợi, Phường Bến Nghé, Quận 1',
    city: 'TP Hồ Chí Minh',
    isDefault: false,
    type: 'office'
  }
];

const Profile = () => {
  console.log("Rendering Profile component");
  const { currentUser, loading } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // States for password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // States for shipping addresses
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [addressFormData, setAddressFormData] = useState({
    id: null,
    name: '',
    recipient: '',
    phone: '',
    address: '',
    district: '',
    city: '',
    isDefault: false,
    type: 'home',
    customType: ''
  });
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressErrors, setAddressErrors] = useState({});
  const [processingAddress, setProcessingAddress] = useState(false);
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);

  // Initialize form data when user data is loaded
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address || ''
      });
    }
  }, [currentUser]);
  
  // Fetch addresses when component mounts
  useEffect(() => {
    if (currentUser) {
      fetchAddresses();
    }
  }, [currentUser]);
  
  // Format address data for UI display
  const formatAddressForUI = (address) => {
    return {
      id: address._id,
      name: address.name || (address.fullName ? `Địa chỉ của ${address.fullName}` : 'Địa chỉ giao hàng'),
      recipient: address.fullName || '',
      phone: address.phoneNumber || '',
      address: address.street || '',
      district: address.district || '',
      city: address.city || '',
      isDefault: address.isDefault || false,
      type: address.type || 'home', // Added type from database
      customType: address.customType || '' // Custom type value
    };
  };

  // Format addresses when they're loaded
  useEffect(() => {
    if (currentUser && currentUser.addresses) {
      const formattedAddresses = currentUser.addresses.map(formatAddressForUI);
      setAddresses(formattedAddresses);
    }
  }, [currentUser]);

  // Updated fetchAddresses to format addresses
  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const response = await authApi.getCurrentUser();
      const addressesFromAPI = response.data.addresses || [];
      const formattedAddresses = addressesFromAPI.map(formatAddressForUI);
      setAddresses(formattedAddresses);
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
      setError('Không thể tải danh sách địa chỉ. Vui lòng thử lại sau.');
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    console.log("Tab changed to:", newValue);
    setActiveTab(newValue);
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
    // Reset form data if canceling edit
    if (editMode) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address || ''
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      // Here you would update the user profile with an API call
      // For now, we'll just simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Thông tin tài khoản đã được cập nhật thành công!');
      setEditMode(false);
    } catch (err) {
      setError('Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại sau.');
    } finally {
      setUpdating(false);
    }
  };
  
  // Password change handlers
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
    
    // Clear specific error when typing
    if (passwordErrors[name]) {
      setPasswordErrors({
        ...passwordErrors,
        [name]: ''
      });
    }
  };
  
  const validatePasswordForm = () => {
    const errors = {};
    let isValid = true;
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
      isValid = false;
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới';
      isValid = false;
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
      isValid = false;
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
      isValid = false;
    } else if (passwordData.confirmPassword !== passwordData.newPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      isValid = false;
    }
    
    setPasswordErrors(errors);
    return isValid;
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    setChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');
    
    try {
      // Here you would update the password with an API call
      // For now, we'll just simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPasswordSuccess('Mật khẩu đã được cập nhật thành công!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setPasswordError('Có lỗi xảy ra khi cập nhật mật khẩu. Vui lòng thử lại sau.');
    } finally {
      setChangingPassword(false);
    }
  };
  
  // Address management handlers
  const openAddressDialog = (address = null) => {
    if (address) {
      setAddressFormData({...address});
      setEditingAddressId(address.id);
    } else {
      setAddressFormData({
        id: null, // Backend will generate ID
        name: '',
        recipient: '',
        phone: '',
        address: '',
        district: '',
        city: '',
        isDefault: addresses.length === 0, // Make default if it's the first address
        type: 'home',
        customType: ''
      });
      setEditingAddressId(null);
    }
    setAddressErrors({});
    setAddressDialogOpen(true);
  };
  
  const closeAddressDialog = () => {
    setAddressDialogOpen(false);
    setProcessingAddress(false);
  };
  
  const handleAddressInputChange = (e) => {
    const { name, value, checked } = e.target;
    const val = name === 'isDefault' ? checked : value;
    
    setAddressFormData({
      ...addressFormData,
      [name]: val
    });
    
    // Clear error when typing
    if (addressErrors[name]) {
      setAddressErrors({
        ...addressErrors,
        [name]: ''
      });
    }
  };
  
  const validateAddressForm = () => {
    const errors = {};
    let isValid = true;
    
    const requiredFields = [
      { field: 'name', label: 'Tên địa chỉ' },
      { field: 'recipient', label: 'Người nhận' },
      { field: 'phone', label: 'Số điện thoại' },
      { field: 'address', label: 'Địa chỉ' },
      { field: 'district', label: 'Quận/Huyện' },
      { field: 'city', label: 'Thành phố/Tỉnh' }
    ];
    
    requiredFields.forEach(({ field, label }) => {
      if (!addressFormData[field]) {
        errors[field] = `${label} không được để trống`;
        isValid = false;
      }
    });
    
    // Validate phone number format
    if (addressFormData.phone && !/^\d{10,11}$/.test(addressFormData.phone)) {
      errors.phone = 'Số điện thoại không hợp lệ';
      isValid = false;
    }
    
    // Validate customType when type is 'custom'
    if (addressFormData.type === 'custom' && !addressFormData.customType) {
      errors.customType = 'Vui lòng nhập loại địa chỉ';
      isValid = false;
    }
    
    setAddressErrors(errors);
    return isValid;
  };
  
  const handleSaveAddress = async () => {
    if (!validateAddressForm()) {
      return;
    }
    
    setProcessingAddress(true);
    
    try {
      // Prepare address data for API using the schema fields
      const addressData = {
        name: addressFormData.name, // Custom display name
        fullName: addressFormData.recipient,
        street: addressFormData.address,
        district: addressFormData.district,
        city: addressFormData.city,
        postalCode: '', // Not in UI but in schema
        country: 'Vietnam', // Default value
        phoneNumber: addressFormData.phone,
        isDefault: addressFormData.isDefault,
        type: addressFormData.type, // Address type (home, office, custom)
        customType: addressFormData.type === 'custom' ? addressFormData.customType : '' // Custom type value
      };
      
      if (editingAddressId) {
        // Update existing address
        await addressApi.updateAddress(editingAddressId, addressData);
      } else {
        // Add new address
        await addressApi.addAddress(addressData);
      }
      
      closeAddressDialog();
      setSuccess('Địa chỉ đã được lưu thành công!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Fetch updated addresses from server
      fetchAddresses();
    } catch (err) {
      console.error('Failed to save address:', err);
      setAddressErrors({
        general: 'Có lỗi xảy ra khi lưu địa chỉ. Vui lòng thử lại sau.'
      });
    } finally {
      setProcessingAddress(false);
    }
  };
  
  const confirmDeleteAddress = (addressId) => {
    setAddressToDelete(addressId);
    setConfirmDeleteDialog(true);
  };
  
  const handleDeleteAddress = async () => {
    setProcessingAddress(true);
    
    try {
      // Delete address through API
      await addressApi.deleteAddress(addressToDelete);
      
      setConfirmDeleteDialog(false);
      setAddressToDelete(null);
      setSuccess('Địa chỉ đã được xóa thành công!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Fetch updated addresses
      fetchAddresses();
    } catch (err) {
      console.error('Failed to delete address:', err);
      setError('Có lỗi xảy ra khi xóa địa chỉ. Vui lòng thử lại sau.');
    } finally {
      setProcessingAddress(false);
    }
  };
  
  const setDefaultAddress = async (addressId) => {
    setProcessingAddress(true);
    
    try {
      // Set default address through API
      await addressApi.setDefaultAddress(addressId);
      
      setSuccess('Địa chỉ mặc định đã được cập nhật thành công!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Fetch updated addresses
      fetchAddresses();
    } catch (err) {
      console.error('Failed to set default address:', err);
      setError('Có lỗi xảy ra khi cập nhật địa chỉ mặc định. Vui lòng thử lại sau.');
    } finally {
      setProcessingAddress(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render the address tab content
  const renderAddressTab = () => {
    console.log("Rendering address tab, addresses:", addresses);
    
    if (loadingAddresses) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1" fontWeight={600}>
            Địa chỉ giao hàng
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => openAddressDialog()}
          >
            Thêm địa chỉ mới
          </Button>
        </Box>
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {addresses.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <LocationIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Bạn chưa có địa chỉ giao hàng nào
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Thêm địa chỉ giao hàng để đặt hàng nhanh hơn!
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => openAddressDialog()}
            >
              Thêm địa chỉ mới
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {addresses.map((address) => (
              <Grid item xs={12} md={6} key={address.id}>
                <Card 
                  elevation={1}
                  sx={{ 
                    borderRadius: 2, 
                    height: '100%',
                    border: address.isDefault ? '2px solid #1976d2' : 'none',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {address.type === 'home' ? (
                        <HomeIcon sx={{ color: 'primary.main', mr: 1 }} />
                      ) : address.type === 'office' ? (
                        <BusinessIcon sx={{ color: 'primary.main', mr: 1 }} />
                      ) : (
                        <LocationIcon sx={{ color: 'primary.main', mr: 1 }} />
                      )}
                      <Typography variant="subtitle1" fontWeight={600}>
                        {address.name}
                      </Typography>
                      {address.isDefault && (
                        <Chip 
                          label="Mặc định" 
                          size="small" 
                          color="primary" 
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                    
                    {address.type === 'custom' && address.customType && (
                      <Typography variant="body2" sx={{ mb: 0.5, fontStyle: 'italic', color: 'text.secondary' }}>
                        Loại: {address.customType}
                      </Typography>
                    )}
                    
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Người nhận:</strong> {address.recipient}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Số điện thoại:</strong> {address.phone}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Địa chỉ:</strong> {address.address}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Thành phố/Tỉnh:</strong> {address.city}
                    </Typography>
                  </CardContent>
                  
                  <CardActions sx={{ justifyContent: 'space-between', borderTop: '1px solid #f0f0f0', p: 2 }}>
                    <Box>
                      <Button 
                        startIcon={<EditIcon />} 
                        size="small"
                        onClick={() => openAddressDialog(address)}
                      >
                        Sửa
                      </Button>
                      <Button 
                        startIcon={<DeleteIcon />} 
                        color="error" 
                        size="small"
                        disabled={addresses.length === 1} // Prevent deleting the only address
                        onClick={() => confirmDeleteAddress(address.id)}
                      >
                        Xóa
                      </Button>
                    </Box>
                    
                    {!address.isDefault && (
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => setDefaultAddress(address.id)}
                        disabled={processingAddress}
                      >
                        Đặt làm mặc định
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Grid container spacing={4}>
        {/* Left sidebar with tabs */}
        <Grid item xs={12} md={3}>
          <Paper elevation={1} sx={{ borderRadius: 2 }}>
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                  mb: 2
                }}
              >
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {currentUser?.name || 'User'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentUser?.email || 'user@example.com'}
              </Typography>
            </Box>
            <Divider />
            <Tabs
              orientation="vertical"
              variant="scrollable"
              value={activeTab}
              onChange={handleTabChange}
              sx={{ borderRight: 1, borderColor: 'divider' }}
            >
              <Tab label="Thông tin cá nhân" />
              <Tab label="Đơn hàng của tôi" />
              <Tab label="Địa chỉ giao hàng" />
              <Tab label="Đổi mật khẩu" />
            </Tabs>
          </Paper>
        </Grid>

        {/* Main content area */}
        <Grid item xs={12} md={9}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            {activeTab === 0 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" component="h1" fontWeight={600}>
                    Thông tin cá nhân
                  </Typography>
                  <Button 
                    variant={editMode ? "outlined" : "contained"}
                    color={editMode ? "secondary" : "primary"}
                    startIcon={editMode ? <SaveIcon /> : <EditIcon />}
                    onClick={handleEditToggle}
                    disabled={updating}
                  >
                    {editMode ? 'Hủy' : 'Chỉnh sửa'}
                  </Button>
                </Box>

                {success && (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    {success}
                  </Alert>
                )}

                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Họ tên"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={!editMode || updating}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={true} // Email can't be changed
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Số điện thoại"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={!editMode || updating}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Địa chỉ"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        disabled={!editMode || updating}
                        multiline
                        rows={3}
                      />
                    </Grid>
                    {editMode && (
                      <Grid item xs={12}>
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          fullWidth
                          sx={{ mt: 2, py: 1.2 }}
                          disabled={updating}
                        >
                          {updating ? <CircularProgress size={24} /> : 'Lưu thay đổi'}
                        </Button>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </>
            )}

            {activeTab === 1 && (
              <Box>
                <Typography variant="h5" component="h1" fontWeight={600} sx={{ mb: 3 }}>
                  Đơn hàng của tôi
                </Typography>
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1">
                    Bạn chưa có đơn hàng nào.
                  </Typography>
                </Box>
              </Box>
            )}

            {activeTab === 2 && renderAddressTab()}

            {activeTab === 3 && (
              <Box>
                <Typography variant="h5" component="h1" fontWeight={600} sx={{ mb: 3 }}>
                  Đổi mật khẩu
                </Typography>
                
                {passwordSuccess && (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    {passwordSuccess}
                  </Alert>
                )}

                {passwordError && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {passwordError}
                  </Alert>
                )}
                
                <Box component="form" onSubmit={handlePasswordSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Mật khẩu hiện tại"
                        name="currentPassword"
                        type="password"
                        required
                        value={passwordData.currentPassword}
                        onChange={handlePasswordInputChange}
                        error={!!passwordErrors.currentPassword}
                        helperText={passwordErrors.currentPassword}
                        disabled={changingPassword}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Mật khẩu mới"
                        name="newPassword"
                        type="password"
                        required
                        value={passwordData.newPassword}
                        onChange={handlePasswordInputChange}
                        error={!!passwordErrors.newPassword}
                        helperText={passwordErrors.newPassword}
                        disabled={changingPassword}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Xác nhận mật khẩu mới"
                        name="confirmPassword"
                        type="password"
                        required
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordInputChange}
                        error={!!passwordErrors.confirmPassword}
                        helperText={passwordErrors.confirmPassword}
                        disabled={changingPassword}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={changingPassword}
                      >
                        {changingPassword ? (
                          <CircularProgress size={24} />
                        ) : (
                          'Cập nhật mật khẩu'
                        )}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Address dialog */}
      <Dialog 
        open={addressDialogOpen}
        onClose={!processingAddress ? closeAddressDialog : undefined}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingAddressId ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
        </DialogTitle>
        <DialogContent dividers>
          {addressErrors.general && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {addressErrors.general}
            </Alert>
          )}
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tên địa chỉ"
                name="name"
                placeholder="Ví dụ: Nhà riêng, Văn phòng, Nhà bạn gái..."
                value={addressFormData.name}
                onChange={handleAddressInputChange}
                error={!!addressErrors.name}
                helperText={addressErrors.name}
                disabled={processingAddress}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Người nhận"
                name="recipient"
                value={addressFormData.recipient}
                onChange={handleAddressInputChange}
                error={!!addressErrors.recipient}
                helperText={addressErrors.recipient}
                disabled={processingAddress}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Số điện thoại"
                name="phone"
                value={addressFormData.phone}
                onChange={handleAddressInputChange}
                error={!!addressErrors.phone}
                helperText={addressErrors.phone}
                disabled={processingAddress}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Địa chỉ"
                name="address"
                value={addressFormData.address}
                onChange={handleAddressInputChange}
                error={!!addressErrors.address}
                helperText={addressErrors.address}
                disabled={processingAddress}
                required
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quận/Huyện"
                name="district"
                value={addressFormData.district}
                onChange={handleAddressInputChange}
                error={!!addressErrors.district}
                helperText={addressErrors.district}
                disabled={processingAddress}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Thành phố/Tỉnh"
                name="city"
                value={addressFormData.city}
                onChange={handleAddressInputChange}
                error={!!addressErrors.city}
                helperText={addressErrors.city}
                disabled={processingAddress}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Loại địa chỉ:
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Button
                  variant={addressFormData.type === 'home' ? 'contained' : 'outlined'}
                  startIcon={<HomeIcon />}
                  onClick={() => setAddressFormData({...addressFormData, type: 'home'})}
                  disabled={processingAddress}
                >
                  Nhà riêng
                </Button>
                <Button
                  variant={addressFormData.type === 'office' ? 'contained' : 'outlined'}
                  startIcon={<BusinessIcon />}
                  onClick={() => setAddressFormData({...addressFormData, type: 'office'})}
                  disabled={processingAddress}
                >
                  Văn phòng
                </Button>
                <Button
                  variant={addressFormData.type === 'custom' ? 'contained' : 'outlined'}
                  startIcon={<LocationIcon />}
                  onClick={() => setAddressFormData({...addressFormData, type: 'custom'})}
                  disabled={processingAddress}
                >
                  Khác
                </Button>
              </Stack>
              
              {addressFormData.type === 'custom' && (
                <TextField
                  fullWidth
                  label="Nhập loại địa chỉ"
                  name="customType"
                  value={addressFormData.customType}
                  onChange={handleAddressInputChange}
                  error={!!addressErrors.customType}
                  helperText={addressErrors.customType}
                  disabled={processingAddress}
                  placeholder="Ví dụ: Nhà bạn, Trường học, Cơ quan..."
                  sx={{ mb: 2 }}
                />
              )}
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={addressFormData.isDefault}
                    onChange={handleAddressInputChange}
                    name="isDefault"
                    disabled={processingAddress || (addresses.length === 0)}
                  />
                }
                label="Đặt làm địa chỉ mặc định"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={closeAddressDialog}
            disabled={processingAddress}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveAddress}
            disabled={processingAddress}
          >
            {processingAddress ? <CircularProgress size={24} /> : 'Lưu địa chỉ'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirmation dialog for deleting address */}
      <Dialog
        open={confirmDeleteDialog}
        onClose={() => setConfirmDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Xác nhận xóa địa chỉ</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa địa chỉ này không? Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDeleteDialog(false)}
            disabled={processingAddress}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAddress}
            disabled={processingAddress}
          >
            {processingAddress ? <CircularProgress size={24} /> : 'Xóa địa chỉ'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile; 