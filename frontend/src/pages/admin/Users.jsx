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
  ListItemIcon,
  Avatar,
} from '@mui/material';

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

import { adminApi } from '../../services/api';

const Users = () => {
  // State for users data
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Action menu state
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  
  // Fetch users with pagination and search
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: page + 1, // API is 1-indexed
        limit: rowsPerPage,
        search: searchTerm,
      };
      
      const response = await adminApi.getAllUsers(params);
      
      if (response.data?.data) {
        setUsers(response.data.data.users || []);
        setTotalUsers(response.data.data.totalUsers || 0);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Không thể tải danh sách người dùng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage]);

  // Handle search form submit
  const handleSearch = (event) => {
    event.preventDefault();
    fetchUsers();
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
  const handleActionClick = (event, userId) => {
    setActionMenuAnchorEl(event.currentTarget);
    setSelectedUserId(userId);
  };

  const handleActionClose = () => {
    setActionMenuAnchorEl(null);
  };

  // User role functions
  const getUserRoleChip = (role) => {
    if (role === 'admin') {
      return (
        <Chip
          label="Quản trị viên"
          size="small"
          color="primary"
          sx={{ fontWeight: 500 }}
        />
      );
    }
    return (
      <Chip
        label="Khách hàng"
        size="small"
        sx={{ 
          backgroundColor: '#F3F4F6', 
          color: '#374151',
          fontWeight: 500 
        }}
      />
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };

  // Delete user functions
  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
    handleActionClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      await adminApi.deleteUser(selectedUser._id);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Không thể xóa người dùng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  // Toggle user account status
  const handleToggleStatus = async (userId, isActive) => {
    try {
      setLoading(true);
      await adminApi.updateUserStatus(userId, { isActive: !isActive });
      fetchUsers(); // Refresh the list
      handleActionClose();
    } catch (error) {
      console.error('Error updating user status:', error);
      setError('Không thể cập nhật trạng thái người dùng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Generate user avatar
  const generateUserAvatar = (user) => {
    if (!user.fullName) return <PersonIcon />;
    
    const initials = user.fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
    
    return initials;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1" fontWeight={600}>
          Quản lý người dùng
        </Typography>
        <Box>
          <IconButton 
            aria-label="refresh" 
            onClick={() => fetchUsers()}
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
                placeholder="Tìm kiếm người dùng theo tên, email..."
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

      {/* Users Table */}
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
                <TableCell sx={{ fontWeight: 600 }}>Người dùng</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Ngày đăng ký</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Vai trò</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Địa chỉ</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Điểm tích lũy</TableCell>
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
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      Không tìm thấy người dùng nào
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow
                    key={user._id}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.02)'
                      }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          sx={{ 
                            bgcolor: user.role === 'admin' ? 'primary.main' : 'secondary.main',
                            width: 40,
                            height: 40,
                            mr: 2
                          }}
                        >
                          {generateUserAvatar(user)}
                        </Avatar>
                        <Typography variant="body2" fontWeight={500}>
                          {user.fullName || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.email}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.provider !== 'local' && `Đăng nhập qua ${user.provider}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      {getUserRoleChip(user.role)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.addresses && user.addresses.length > 0 
                          ? `${user.addresses.length} địa chỉ`
                          : 'Chưa có địa chỉ'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${user.points || 0} điểm`}
                        size="small"
                        sx={{
                          backgroundColor: '#EFF6FF',
                          color: '#1D4ED8',
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(event) => handleActionClick(event, user._id)}
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
          count={totalUsers}
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
          const user = users.find(u => u._id === selectedUserId);
          if (user) {
            // Toggle user status
            handleToggleStatus(selectedUserId, user.isActive);
          }
        }}>
          <ListItemIcon>
            {users.find(u => u._id === selectedUserId)?.isActive 
              ? <BlockIcon fontSize="small" color="error" />
              : <CheckCircleIcon fontSize="small" color="success" />
            }
          </ListItemIcon>
          {users.find(u => u._id === selectedUserId)?.isActive 
            ? 'Khóa tài khoản'
            : 'Mở khóa tài khoản'
          }
        </MenuItem>
        {users.find(u => u._id === selectedUserId)?.role !== 'admin' && (
          <MenuItem 
            onClick={() => {
              const user = users.find(u => u._id === selectedUserId);
              if (user) {
                handleDeleteClick(user);
              }
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            Xóa người dùng
          </MenuItem>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Xác nhận xóa người dùng?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Bạn có chắc chắn muốn xóa người dùng "{selectedUser?.fullName}" ({selectedUser?.email})?
            Hành động này không thể hoàn tác và sẽ xóa toàn bộ dữ liệu của người dùng này.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="inherit">
            Hủy bỏ
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Xóa người dùng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users; 