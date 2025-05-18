import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
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
  Tooltip,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  FormHelperText,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  ListItemButton,
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
  Category as CategoryIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Description as DescriptionIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

import { adminApi } from '../../services/api';

const Categories = () => {
  // State for categories data
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    parent: '',
    isActive: true,
  });
  const [categoryFormErrors, setCategoryFormErrors] = useState({});
  
  // Action menu state
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  
  // State for expanded categories (to show children)
  const [expandedCategories, setExpandedCategories] = useState({});
  
  // Fetch categories with hierarchy
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        flat: true, // Get all categories in a flat structure
      };
      
      console.log('Fetching categories with params:', params);
      const response = await adminApi.getCategories(params);
      console.log('Categories API response:', response);
      
      // Response is directly the array of categories
      let categoriesData = response.data;
      console.log('Categories data:', categoriesData);
      
      // Filter by search term if provided
      if (searchTerm) {
        console.log('Filtering by search term:', searchTerm);
        categoriesData = categoriesData.filter(category => 
          category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        console.log('Filtered categories:', categoriesData);
      }
      
      // Sort by level and then by name
      categoriesData.sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return a.name.localeCompare(b.name);
      });
      console.log('Sorted categories:', categoriesData);
      
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      console.error('Error details:', error.response?.data || error.message);
      setError('Không thể tải danh sách danh mục. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch when search term changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCategories();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Toggle expand category
  const handleToggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Action menu handlers
  const handleActionClick = (event, categoryId) => {
    event.stopPropagation();
    setActionMenuAnchorEl(event.currentTarget);
    setSelectedCategoryId(categoryId);
  };

  const handleActionClose = () => {
    setActionMenuAnchorEl(null);
  };

  // Add/Edit category dialog handlers
  const handleAddCategory = () => {
    setCategoryFormData({
      name: '',
      description: '',
      parent: '',
      isActive: true,
    });
    setCategoryFormErrors({});
    setCategoryDialogOpen(true);
    setSelectedCategory(null);
  };

  const handleEditCategory = (category) => {
    setCategoryFormData({
      name: category.name || '',
      description: category.description || '',
      parent: category.parent || '',
      isActive: category.isActive,
    });
    setCategoryFormErrors({});
    setCategoryDialogOpen(true);
    setSelectedCategory(category);
    handleActionClose();
  };

  const handleCategoryDialogClose = () => {
    setCategoryDialogOpen(false);
  };

  // Category form change handlers
  const handleCategoryFormChange = (e) => {
    const { name, value, checked } = e.target;
    setCategoryFormData(prev => ({
      ...prev,
      [name]: name === 'isActive' ? checked : value
    }));
    
    // Clear validation error when field is changed
    if (categoryFormErrors[name]) {
      setCategoryFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate category form
  const validateCategoryForm = () => {
    const errors = {};
    
    if (!categoryFormData.name.trim()) {
      errors.name = 'Tên danh mục không được để trống';
    }
    
    setCategoryFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save category
  const handleSaveCategory = async () => {
    if (!validateCategoryForm()) return;
    
    try {
      setLoading(true);
      
      // Đảm bảo parent là null nếu là chuỗi rỗng
      const dataToSave = { ...categoryFormData };
      if (!dataToSave.parent) {
        dataToSave.parent = null;
      }
      
      if (selectedCategory) {
        // Update existing category
        await adminApi.updateCategory(selectedCategory._id, dataToSave);
      } else {
        // Create new category
        await adminApi.createCategory(dataToSave);
      }
      
      setCategoryDialogOpen(false);
      fetchCategories(); // Refresh the list
    } catch (error) {
      console.error('Error saving category:', error);
      setError(selectedCategory 
        ? 'Không thể cập nhật danh mục. Vui lòng thử lại sau.' 
        : 'Không thể tạo danh mục. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Delete dialog handlers
  const handleDeleteClick = (category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
    handleActionClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;

    try {
      setLoading(true);
      await adminApi.deleteCategory(selectedCategory._id);
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
      fetchCategories(); // Refresh the list
    } catch (error) {
      console.error('Error deleting category:', error);
      setError('Không thể xóa danh mục. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedCategory(null);
  };

  // Get parent categories for dropdown
  const getParentCategories = () => {
    // Only root and level 1 categories can be parents
    return categories.filter(category => category.level < 2);
  };

  // Get children of a category
  const getCategoryChildren = (categoryId) => {
    return categories.filter(category => 
      category.parent && category.parent === categoryId
    );
  };

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : 'N/A';
  };

  // Calculate display rows with pagination
  const displayedCategories = categories
    .filter(category => category.level === 0) // Only show root categories in main list
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1" fontWeight={600}>
          Quản lý danh mục sản phẩm
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
            onClick={handleAddCategory}
          >
            Thêm danh mục
          </Button>
          <IconButton 
            aria-label="refresh" 
            onClick={() => fetchCategories()}
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
            <TextField
              fullWidth
              placeholder="Tìm kiếm danh mục..."
              value={searchTerm}
              onChange={handleSearchChange}
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
          </Grid>
        </Grid>
      </Card>

      {/* Categories Table */}
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
                <TableCell width="40px"></TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tên danh mục</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Mô tả</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Danh mục cha</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && page === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : displayedCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      {searchTerm ? 'Không tìm thấy danh mục nào phù hợp' : 'Không có danh mục nào'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {displayedCategories.map((category) => {
                    const children = getCategoryChildren(category._id);
                    const hasChildren = children.length > 0;
                    const isExpanded = expandedCategories[category._id];
                    
                    return (
                      <React.Fragment key={category._id}>
                        <TableRow
                          sx={{
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.02)'
                            }
                          }}
                        >
                          <TableCell>
                            {hasChildren && (
                              <IconButton
                                aria-label="expand row"
                                size="small"
                                onClick={() => handleToggleCategory(category._id)}
                              >
                                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </IconButton>
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CategoryIcon sx={{ color: 'primary.main', mr: 1 }} />
                              <Typography variant="body1" fontWeight={500}>
                                {category.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                              {category.description || 'Không có mô tả'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {category.parent ? getCategoryName(category.parent) : 'Danh mục gốc'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={category.isActive ? 'Hoạt động' : 'Vô hiệu'}
                              size="small"
                              sx={{
                                backgroundColor: category.isActive ? '#ECFDF5' : '#F3F4F6',
                                color: category.isActive ? '#10B981' : '#6B7280',
                                fontWeight: 500,
                                fontSize: '0.75rem'
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={(event) => handleActionClick(event, category._id)}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                        
                        {/* Children categories */}
                        {hasChildren && isExpanded && (
                          <TableRow>
                            <TableCell colSpan={6} sx={{ py: 0, border: 0 }}>
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <Box sx={{ py: 2, px: 5 }}>
                                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                    Danh mục {category.name}
                                  </Typography>
                                  <Divider sx={{ mb: 2 }} />
                                  
                                  <List component="div" disablePadding>
                                    {children.map((child) => (
                                      <ListItem
                                        key={child._id}
                                        sx={{ 
                                          py: 1, 
                                          px: 2, 
                                          borderRadius: 1,
                                          '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } 
                                        }}
                                        secondaryAction={
                                          <IconButton
                                            edge="end"
                                            size="small"
                                            onClick={(event) => handleActionClick(event, child._id)}
                                          >
                                            <MoreVertIcon fontSize="small" />
                                          </IconButton>
                                        }
                                      >
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                          <CategoryIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText 
                                          primary={child.name} 
                                          secondary={child.description || 'Không có mô tả'} 
                                          primaryTypographyProps={{ fontWeight: 500 }}
                                        />
                                        <Chip
                                          label={child.isActive ? 'Hoạt động' : 'Vô hiệu'}
                                          size="small"
                                          sx={{
                                            ml: 2,
                                            backgroundColor: child.isActive ? '#ECFDF5' : '#F3F4F6',
                                            color: child.isActive ? '#10B981' : '#6B7280',
                                            fontWeight: 500,
                                            fontSize: '0.75rem'
                                          }}
                                        />
                                      </ListItem>
                                    ))}
                                  </List>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={categories.filter(category => category.level === 0).length}
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
          const category = categories.find(c => c._id === selectedCategoryId);
          if (category) {
            handleEditCategory(category);
          }
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Chỉnh sửa
        </MenuItem>
        <MenuItem 
          onClick={() => {
            const category = categories.find(c => c._id === selectedCategoryId);
            if (category) {
              handleDeleteClick(category);
            }
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          Xóa danh mục
        </MenuItem>
      </Menu>

      {/* Add/Edit Category Dialog */}
      <Dialog
        open={categoryDialogOpen}
        onClose={handleCategoryDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Tên danh mục"
                fullWidth
                value={categoryFormData.name}
                onChange={handleCategoryFormChange}
                error={!!categoryFormErrors.name}
                helperText={categoryFormErrors.name}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Mô tả"
                fullWidth
                multiline
                rows={3}
                value={categoryFormData.description}
                onChange={handleCategoryFormChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="parent-category-label">Danh mục cha</InputLabel>
                <Select
                  labelId="parent-category-label"
                  name="parent"
                  value={categoryFormData.parent}
                  onChange={handleCategoryFormChange}
                  input={<OutlinedInput label="Danh mục cha" />}
                >
                  <MenuItem value="">
                    <em>Không có (Danh mục gốc)</em>
                  </MenuItem>
                  {getParentCategories().map((category) => (
                    <MenuItem 
                      key={category._id} 
                      value={category._id}
                      disabled={selectedCategory && selectedCategory._id === category._id}
                    >
                      {category.name} {category.level > 0 ? ` (Cấp ${category.level})` : ''}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Chọn danh mục cha hoặc để trống nếu đây là danh mục cấp cao nhất
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={categoryFormData.isActive}
                    onChange={handleCategoryFormChange}
                    name="isActive"
                    color="primary"
                  />
                }
                label={categoryFormData.isActive ? "Danh mục đang hoạt động" : "Danh mục không hoạt động"}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCategoryDialogClose} color="inherit">
            Hủy bỏ
          </Button>
          <Button 
            onClick={handleSaveCategory} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Lưu danh mục'}
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
          {"Xác nhận xóa danh mục?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Bạn có chắc chắn muốn xóa danh mục "{selectedCategory?.name}"? 
            {getCategoryChildren(selectedCategory?._id).length > 0 && (
              <Typography component="div" color="error" sx={{ mt: 1 }}>
                <strong>Cảnh báo:</strong> Danh mục này đang có danh mục con. Xóa danh mục này sẽ ảnh hưởng đến các danh mục con.
              </Typography>
            )}
            Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="inherit">
            Hủy bỏ
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Xóa danh mục
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Categories; 