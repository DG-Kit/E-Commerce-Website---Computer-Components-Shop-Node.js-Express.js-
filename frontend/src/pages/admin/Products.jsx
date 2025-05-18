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
  Avatar,
  ListItemIcon,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Inventory as InventoryIcon,
  LocalOffer as LocalOfferIcon,
} from '@mui/icons-material';
import { adminApi } from '../../services/api';

const Products = () => {
  // State for products data
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  
  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Action menu state
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);

  // State for expanded rows (to show variants)
  const [expandedRows, setExpandedRows] = useState({});
  
  // Toggle expand row function
  const handleToggleRow = (productId) => {
    setExpandedRows(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: page + 1, // API is 1-indexed
        limit: rowsPerPage,
        search: searchTerm,
        category: filterCategory,
      };
      
      const response = await adminApi.getProducts(params);
      
      if (response.data?.data) {
        setProducts(response.data.data.products || []);
        setTotalProducts(response.data.data.totalProducts || 0);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories for filter
  const fetchCategories = async () => {
    try {
      const response = await adminApi.getCategories();
      if (response.data?.data) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Fetch when page, rowsPerPage, or filters change
  useEffect(() => {
    fetchProducts();
  }, [page, rowsPerPage, filterCategory]);

  // Handle search form submit
  const handleSearch = (event) => {
    event.preventDefault();
    fetchProducts();
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter handlers
  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterSelect = (categoryId) => {
    setFilterCategory(categoryId);
    setFilterAnchorEl(null);
    setPage(0); // Reset to first page
  };

  const clearFilter = () => {
    setFilterCategory('');
    setFilterAnchorEl(null);
    setPage(0); // Reset to first page
  };

  // Action menu handlers
  const handleActionClick = (event, productId) => {
    setActionMenuAnchorEl(event.currentTarget);
    setSelectedProductId(productId);
  };

  const handleActionClose = () => {
    setActionMenuAnchorEl(null);
  };

  // Delete dialog handlers
  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
    handleActionClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;

    try {
      setLoading(true);
      await adminApi.deleteProduct(selectedProduct._id);
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
      fetchProducts(); // Refresh the list
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Không thể xóa sản phẩm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedProduct(null);
  };

  // Edit product handler
  const handleEditClick = (productId) => {
    handleActionClose();
    // Navigate to edit page
    window.location.href = `/admin/products/edit/${productId}`;
  };

  // View product handler
  const handleViewClick = (productId) => {
    handleActionClose();
    // Open new tab with product detail page
    window.open(`/product/${productId}`, '_blank');
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0đ';
    }
    // Đảm bảo amount là số
    const numAmount = Number(amount);
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numAmount);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1" fontWeight={600}>
          Quản lý sản phẩm
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
            onClick={() => window.location.href = '/admin/products/add'}
          >
            Thêm sản phẩm
          </Button>
          <IconButton 
            aria-label="refresh" 
            onClick={() => fetchProducts()}
            sx={{ ml: 1 }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
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
                placeholder="Tìm kiếm sản phẩm..."
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
          <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={handleFilterClick}
              sx={{ 
                borderRadius: '8px',
                textTransform: 'none'
              }}
            >
              Lọc theo danh mục
              {filterCategory && (
                <Chip 
                  label={categories.find(c => c._id === filterCategory)?.name || 'Danh mục'} 
                  size="small" 
                  onDelete={clearFilter} 
                  sx={{ ml: 1 }}
                />
              )}
            </Button>
            <Menu
              anchorEl={filterAnchorEl}
              open={Boolean(filterAnchorEl)}
              onClose={handleFilterClose}
            >
              {categories.map((category) => (
                <MenuItem 
                  key={category._id} 
                  onClick={() => handleFilterSelect(category._id)}
                  selected={filterCategory === category._id}
                >
                  {category.name}
                </MenuItem>
              ))}
              {filterCategory && (
                <MenuItem onClick={clearFilter}>
                  <Typography color="primary">Xóa bộ lọc</Typography>
                </MenuItem>
              )}
            </Menu>
          </Grid>
        </Grid>
      </Card>

      {/* Products Table */}
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
                <TableCell sx={{ fontWeight: 600 }}>Sản phẩm</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Danh mục</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Giá</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tồn kho</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && page === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      Không tìm thấy sản phẩm nào
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <React.Fragment key={product._id}>
                    <TableRow
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.02)'
                        }
                      }}
                    >
                      <TableCell>
                        {product.variants && product.variants.length > 0 && (
                          <IconButton
                            aria-label="expand row"
                            size="small"
                            onClick={() => handleToggleRow(product._id)}
                          >
                            {expandedRows[product._id] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                          </IconButton>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            src={product.images && product.images.length > 0 ? product.images[0] : ''}
                            alt={product.name}
                            variant="rounded"
                            sx={{ width: 40, height: 40, mr: 2, backgroundColor: '#E5E7EB' }}
                          />
                          <Box>
                            <Typography variant="body1" fontWeight={500}>
                              {product.name}
                            </Typography>
                            {product.variants && product.variants.length > 0 && (
                              <Typography variant="body2" color="text.secondary">
                                {product.variants.length > 1 
                                  ? `${product.variants.length} biến thể` 
                                  : '1 biến thể'}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {product.category?.name || 'Chưa phân loại'}
                      </TableCell>
                      <TableCell>
                        {product.variants && product.variants.length > 0 ? (
                          product.variants.length === 1 ? (
                            formatCurrency(product.variants[0].price)
                          ) : (
                            <>
                              {(() => {
                                const variantPrices = product.variants.map(v => v.price);
                                const minPrice = Math.min(...variantPrices);
                                const maxPrice = Math.max(...variantPrices);
                                return minPrice === maxPrice
                                  ? formatCurrency(minPrice)
                                  : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
                              })()}
                            </>
                          )
                        ) : (
                          formatCurrency(product.price || 0)
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${product.stock} sản phẩm`}
                          size="small"
                          sx={{
                            backgroundColor: product.stock > 10 ? '#ECFDF5' : product.stock > 0 ? '#FFFBEB' : '#FEF2F2',
                            color: product.stock > 10 ? '#10B981' : product.stock > 0 ? '#F59E0B' : '#EF4444',
                            fontWeight: 500,
                            fontSize: '0.75rem'
                          }}
                        />
                        {product.variants && product.variants.length > 0 && (
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                            {product.variants.reduce((total, v) => total + (Number(v.stock) || 0), 0)} trong tất cả biến thể
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.isActive ? 'Đang bán' : 'Ngừng bán'}
                          size="small"
                          sx={{
                            backgroundColor: product.isActive ? '#ECFDF5' : '#F3F4F6',
                            color: product.isActive ? '#10B981' : '#6B7280',
                            fontWeight: 500,
                            fontSize: '0.75rem'
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(event) => handleActionClick(event, product._id)}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    
                    {/* Variants dropdown */}
                    {product.variants && product.variants.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ py: 0, border: 0 }}>
                          <Collapse in={expandedRows[product._id]} timeout="auto" unmountOnExit>
                            <Box sx={{ py: 2, px: 5 }}>
                              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                Biến thể sản phẩm
                              </Typography>
                              <Divider sx={{ mb: 2 }} />
                              
                              <Grid container spacing={2}>
                                {product.variants.map((variant, index) => (
                                  <Grid item xs={12} md={6} lg={4} key={index}>
                                    <Paper 
                                      variant="outlined" 
                                      sx={{ 
                                        p: 2, 
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        bgcolor: 'background.default' 
                                      }}
                                    >
                                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                        {variant.name || 'Biến thể mặc định'}
                                      </Typography>
                                      
                                      <Grid container spacing={1}>
                                        <Grid item xs={6}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <LocalOfferIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                            <Typography variant="body2">
                                              {formatCurrency(variant.price)}
                                            </Typography>
                                          </Box>
                                        </Grid>
                                        
                                        <Grid item xs={6}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <InventoryIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                            <Typography variant="body2">
                                              {variant.stock} trong kho
                                            </Typography>
                                          </Box>
                                        </Grid>
                                      </Grid>
                                      
                                      {variant.discountPercentage > 0 && (
                                        <Chip 
                                          label={`Giảm ${variant.discountPercentage}%`}
                                          size="small"
                                          color="secondary"
                                          sx={{ alignSelf: 'flex-start', mt: 1 }}
                                        />
                                      )}
                                    </Paper>
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={totalProducts}
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
        <MenuItem onClick={() => handleViewClick(selectedProductId)}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          Xem chi tiết
        </MenuItem>
        <MenuItem onClick={() => handleEditClick(selectedProductId)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Chỉnh sửa
        </MenuItem>
        <MenuItem 
          onClick={() => {
            const product = products.find(p => p._id === selectedProductId);
            if (product) {
              handleDeleteClick(product);
            }
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          Xóa sản phẩm
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Xác nhận xóa sản phẩm?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Bạn có chắc chắn muốn xóa sản phẩm "{selectedProduct?.name}"? 
            Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="inherit">
            Hủy bỏ
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Xóa sản phẩm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products; 