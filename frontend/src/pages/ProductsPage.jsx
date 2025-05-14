import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Breadcrumbs,
  Link,
  CircularProgress,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Paper,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import ProductCard from '../components/ProductCard';
import { productsApi } from '../services/api';

// Format price to VND
const formatPrice = (price) => {
  if (typeof price !== 'number') return 'N/A';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  
  const featured = searchParams.get('featured') === 'true';
  const newest = searchParams.get('newest') === 'true';
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState(newest ? 'newest' : 'featured');
  
  // Get page title based on query params
  const getPageTitle = () => {
    if (featured) return 'Sản phẩm nổi bật';
    if (newest) return 'Sản phẩm mới';
    return 'Tất cả sản phẩm';
  };
  
  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Set up query parameters
        const queryParams = {
          page,
          limit: 12,
          sort: getSortValue(sortBy)
        };
        
        // Add featured flag if needed
        if (featured) {
          queryParams.featured = true;
        }
        
        const response = await productsApi.getProducts(queryParams);
        
        setProducts(response.data.products || []);
        setTotalPages(response.data.totalPages || 1);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Failed to load products');
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [page, sortBy, featured, newest]);
  
  const getSortValue = (sortOption) => {
    switch (sortOption) {
      case 'newest': return 'createdAt:desc';
      case 'oldest': return 'createdAt:asc';
      case 'priceAsc': return 'minPrice:asc';
      case 'priceDesc': return 'minPrice:desc';
      case 'featured': return 'featured:desc';
      default: return 'createdAt:desc';
    }
  };
  
  const handlePageChange = (event, value) => {
    setPage(value);
    // Scroll to top when changing page
    window.scrollTo(0, 0);
  };
  
  const handleSortChange = (event) => {
    setSortBy(event.target.value);
    setPage(1); // Reset to first page when sorting changes
  };
  
  // Loading state
  if (loading && products.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Error state
  if (error && products.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h5" color="error" gutterBottom>
          Error: {error}
        </Typography>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 2 }}
      >
        <Link
          color="inherit"
          href="/"
          sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          Trang chủ
        </Link>
        
        <Typography color="text.primary">
          {getPageTitle()}
        </Typography>
      </Breadcrumbs>
      
      {/* Page Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {getPageTitle()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {featured && 'Những sản phẩm được khách hàng đánh giá cao và mua nhiều nhất.'}
          {newest && 'Những sản phẩm mới nhất vừa được cập nhật trên hệ thống.'}
          {!featured && !newest && 'Tất cả sản phẩm hiện có trên hệ thống.'}
        </Typography>
        <Divider sx={{ mt: 1, mb: 2 }} />
      </Box>
      
      {/* Controls: Sort */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2">
            Tìm thấy <strong>{products.length > 0 ? `${(page - 1) * 12 + 1}-${Math.min(page * 12, (totalPages - 1) * 12 + products.length)} sản phẩm` : '0 sản phẩm'}</strong>
          </Typography>
        </Box>
        
        <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="sort-select-label">Sắp xếp theo</InputLabel>
          <Select
            labelId="sort-select-label"
            id="sort-select"
            value={sortBy}
            onChange={handleSortChange}
            label="Sắp xếp theo"
          >
            <MenuItem value="newest">Mới nhất</MenuItem>
            <MenuItem value="oldest">Cũ nhất</MenuItem>
            <MenuItem value="priceAsc">Giá tăng dần</MenuItem>
            <MenuItem value="priceDesc">Giá giảm dần</MenuItem>
            {featured && <MenuItem value="featured">Nổi bật nhất</MenuItem>}
          </Select>
        </FormControl>
      </Box>
      
      {/* Product Grid */}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : products.length > 0 ? (
            <Grid container spacing={2}>
              {products.map((product) => (
                <Grid item xs={6} sm={4} md={3} lg={3} key={product._id}>
                  <ProductCard product={product} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary">
                Không tìm thấy sản phẩm nào
              </Typography>
            </Box>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                variant="outlined"
                shape="rounded"
                color="primary"
                size="medium"
              />
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProductsPage; 