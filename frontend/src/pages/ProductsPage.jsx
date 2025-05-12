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
  Drawer,
  IconButton,
  Button,
  Slider,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Paper,
  useMediaQuery,
  Chip,
  useTheme,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  NavigateNext as NavigateNextIcon,
  Close as CloseIcon,
  Tune as TuneIcon
} from '@mui/icons-material';
import ProductCard from '../components/ProductCard';
import { productsApi } from '../services/api';

// Format price to VND
const formatPrice = (price) => {
  if (typeof price !== 'number') return 'N/A';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// Helper function to extract brand from a product
const extractBrandFromProduct = (product) => {
  if (!product) return null;
  
  // Common brand names in computer components
  const commonBrands = [
    'Intel', 'AMD', 'NVIDIA', 'ASUS', 'MSI', 'Gigabyte', 'ASRock',
    'Kingston', 'Corsair', 'G.Skill', 'Crucial', 'Samsung', 'Western Digital',
    'Seagate', 'SanDisk', 'EVGA', 'Zotac', 'Palit', 'Sapphire', 'Logitech', 'Razer'
  ];
  
  // Check category name first
  if (product.category && product.category.name) {
    for (const brand of commonBrands) {
      if (product.category.name.includes(brand)) {
        return brand;
      }
    }
  }
  
  // Check product name next
  if (product.name) {
    for (const brand of commonBrands) {
      if (product.name.includes(brand)) {
        return brand;
      }
    }
  }
  
  return null;
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

  // Filter state
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 50000000]); // 0 to 50 million VND
  const [tempPriceRange, setTempPriceRange] = useState([0, 50000000]); // For the slider
  const [inStock, setInStock] = useState(false);
  const [brands, setBrands] = useState([
    'Intel', 'AMD', 'NVIDIA', 'ASUS', 'MSI', 'Gigabyte', 'ASRock',
    'Kingston', 'Corsair', 'G.Skill', 'Crucial', 'Samsung', 'Western Digital',
    'Seagate', 'SanDisk', 'EVGA', 'Zotac', 'Palit', 'Sapphire', 'Logitech', 'Razer'
  ]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [activeFilters, setActiveFilters] = useState(0);
  
  // Calculate active filters
  useEffect(() => {
    let count = 0;
    if (priceRange[0] > 0 || priceRange[1] < 50000000) count++;
    if (inStock) count++;
    if (selectedBrands.length > 0) count++;
    setActiveFilters(count);
  }, [priceRange, inStock, selectedBrands]);
  
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
        
        // Add price range filter
        if (priceRange[0] > 0) {
          queryParams.minPrice = priceRange[0];
        }
        if (priceRange[1] < 50000000) {
          queryParams.maxPrice = priceRange[1];
        }
        
        // Add in-stock filter
        if (inStock) {
          queryParams.inStock = true;
        }
        
        console.log("Fetching with params:", queryParams); // Debug log
        
        const response = await productsApi.getProducts(queryParams);
        
        // Filter by brands if any selected (client-side filtering as example)
        let filteredProducts = response.data.products || [];
        if (selectedBrands.length > 0) {
          filteredProducts = filteredProducts.filter(product => {
            // Extract the brand from the product
            const productBrand = extractBrandFromProduct(product);
            
            // Check if the extracted brand is in the selected brands
            return productBrand && selectedBrands.includes(productBrand);
          });
        }
        
        setProducts(filteredProducts);
        setTotalPages(response.data.totalPages || 1);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Failed to load products');
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [page, sortBy, featured, newest, priceRange, inStock, selectedBrands]);
  
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
  
  const handleFilterToggle = () => {
    setFilterDrawerOpen(!filterDrawerOpen);
  };

  // IMPROVED: Handle slider change with immediate visual feedback
  const handlePriceRangeChange = (event, newValue) => {
    setTempPriceRange(newValue);
  };
  
  // IMPROVED: Apply filter when slider interaction ends
  const handlePriceRangeChangeCommitted = (event, newValue) => {
    console.log("Price range committed:", newValue); // Debug log
    setPriceRange(newValue);
    setPage(1); // Reset to first page when filter changes
  };

  // IMPROVED: Handle text input changes for price range
  const handlePriceInputChange = (index, e) => {
    const inputValue = e.target.value;
    // Remove non-numeric characters
    const numericValue = parseInt(inputValue.replace(/\D/g, ''));
    
    if (isNaN(numericValue)) return;

    const newRange = [...tempPriceRange];
    
    if (index === 0) {
      // Min price - ensure it's not greater than max price
      if (numericValue >= 0 && numericValue <= tempPriceRange[1]) {
        newRange[0] = numericValue;
      }
    } else {
      // Max price - ensure it's not less than min price
      if (numericValue >= tempPriceRange[0] && numericValue <= 50000000) {
        newRange[1] = numericValue;
      }
    }
    
    setTempPriceRange(newRange);
  };

  // IMPROVED: Apply filter when input field loses focus
  const handlePriceInputBlur = () => {
    console.log("Price input blur, applying:", tempPriceRange); // Debug log
    setPriceRange(tempPriceRange);
    setPage(1); // Reset to first page when filter changes
  };
  
  const handleBrandToggle = (brand) => {
    setSelectedBrands(prev => {
      if (prev.includes(brand)) {
        return prev.filter(b => b !== brand);
      } else {
        return [...prev, brand];
      }
    });
    setPage(1); // Reset to first page
  };
  
  const handleInStockToggle = (event) => {
    setInStock(event.target.checked);
    setPage(1); // Reset to first page
  };
  
  const handleClearFilters = () => {
    setPriceRange([0, 50000000]);
    setTempPriceRange([0, 50000000]);
    setInStock(false);
    setSelectedBrands([]);
    setPage(1);
  };
  
  const removeFilter = (filterType, value) => {
    if (filterType === 'price') {
      setPriceRange([0, 50000000]);
      setTempPriceRange([0, 50000000]);
    } else if (filterType === 'brand') {
      setSelectedBrands(prev => prev.filter(brand => brand !== value));
    } else if (filterType === 'stock') {
      setInStock(false);
    }
    setPage(1);
  };
  
  // Filter component - used in both sidebar and drawer
  const FilterContent = () => (
    <Box>
      {/* Filter header only shows in drawer mode */}
      {!isDesktop && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5 }}>
            <Typography variant="subtitle1" fontWeight="bold">Bộ lọc</Typography>
            <IconButton onClick={handleFilterToggle} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Divider />
        </>
      )}
      
      <Box sx={{ p: isDesktop ? 1 : 1.5, display: 'flex', flexDirection: isDesktop ? 'row' : 'column', flexWrap: 'wrap', gap: 2 }}>
        {/* Price Range Filter */}
        <Box sx={{ width: isDesktop ? '300px' : '100%' }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Khoảng giá
          </Typography>
          
          {/* IMPROVED: Slider with better styling and interaction */}
          <Slider
            value={tempPriceRange}
            onChange={handlePriceRangeChange}
            onChangeCommitted={handlePriceRangeChangeCommitted}
            valueLabelDisplay="auto"
            min={0}
            max={50000000}
            step={500000}
            valueLabelFormat={(value) => formatPrice(value)}
            sx={{
              mt: 1,
              mb: 1,
              '& .MuiSlider-thumb': {
                height: 20,
                width: 20,
                backgroundColor: '#fff',
                border: '2px solid currentColor',
                '&:focus, &:hover, &.Mui-active': {
                  boxShadow: '0px 0px 0px 8px rgba(25, 118, 210, 0.16)'
                },
              },
              '& .MuiSlider-track': {
                height: 6,
                borderRadius: 3
              },
              '& .MuiSlider-rail': {
                height: 6,
                borderRadius: 3,
                opacity: 0.5,
                backgroundColor: '#bfbfbf',
              },
              '& .MuiSlider-valueLabel': {
                lineHeight: 1.2,
                fontSize: 12,
                background: 'unset',
                padding: 0,
                width: 'auto',
                height: 'auto',
                backgroundColor: 'transparent',
                transformOrigin: 'bottom left',
                transform: 'translate(50%, -100%) rotate(-45deg) scale(0)',
                '&:before': { display: 'none' },
                '&.MuiSlider-valueLabelOpen': {
                  transform: 'translate(50%, -100%) rotate(0deg) scale(1)',
                },
                '& > *': {
                  transform: 'rotate(0deg)',
                },
              },
              }}
            />
          
          {/* IMPROVED: Input fields for price range */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <TextField
              size="small"
              label="Từ"
              value={tempPriceRange[0].toLocaleString('vi-VN')}
              onChange={(e) => handlePriceInputChange(0, e)}
              onBlur={handlePriceInputBlur}
              InputProps={{
                startAdornment: <InputAdornment position="start">₫</InputAdornment>,
              }}
              sx={{ width: '45%' }}
            />
            <TextField
                    size="small"
              label="Đến"
              value={tempPriceRange[1].toLocaleString('vi-VN')}
              onChange={(e) => handlePriceInputChange(1, e)}
              onBlur={handlePriceInputBlur}
              InputProps={{
                startAdornment: <InputAdornment position="start">₫</InputAdornment>,
              }}
              sx={{ width: '45%' }}
              />
          </Box>
          </Box>
          {/* In Stock Filter */}
        <Box sx={{ width: isDesktop ? 'auto' : '100%' }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Tình trạng
          </Typography>
          <FormControlLabel
            control={<Checkbox checked={inStock} onChange={handleInStockToggle} size="small" />}
            label={<Typography variant="body2">Còn hàng</Typography>}
              />
            </Box>
      
        {/* Brand Filter */}
        <Box sx={{ width: isDesktop ? 'auto' : '100%' }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Thương hiệu
          </Typography>
          <Box sx={{
            maxHeight: isDesktop ? '50px' : '180px',
            overflowY: 'auto',
            pr: 1,
            display: isDesktop ? 'flex' : 'block',
            flexWrap: 'wrap',
            gap: 1
          }}>
            {brands.slice(0, isDesktop ? 5 : brands.length).map((brand) => (
              <FormControlLabel
                key={brand}
                control={
                  <Checkbox
                    checked={selectedBrands.includes(brand)}
                    onChange={() => handleBrandToggle(brand)}
                    size="small"
                  />
                }
                label={<Typography variant="body2">{brand}</Typography>}
                sx={{ my: 0, py: 0.3, mr: 1 }}
              />
            ))}
            {isDesktop && brands.length > 5 && (
              <Button
                size="small"
                onClick={handleFilterToggle}
                variant="text"
      >
                +{brands.length - 5} thêm
              </Button>
            )}
          </Box>
        </Box>
      
        {/* Clear Filters button */}
        <Box sx={{ display: 'flex', alignItems: 'flex-end', pb: 0.5 }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleClearFilters}
            disabled={activeFilters === 0}
            size="small"
          >
            Xóa bộ lọc {activeFilters > 0 && `(${activeFilters})`}
          </Button>
        </Box>
      </Box>
    </Box>
  );

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
      
      {/* Filters - Desktop horizontal */}
      {isDesktop && (
        <Paper sx={{ mb: 3 }}>
          <FilterContent />
        </Paper>
      )}
      
      {/* Active Filters */}
      {activeFilters > 0 && (
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="body2" sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
            Bộ lọc:
          </Typography>
          
          {/* Price Range Filter */}
          {(priceRange[0] > 0 || priceRange[1] < 50000000) && (
            <Chip
              label={`Giá: ${formatPrice(priceRange[0])} - ${formatPrice(priceRange[1])}`}
              onDelete={() => removeFilter('price')}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          
          {/* In Stock Filter */}
          {inStock && (
            <Chip
              label="Còn hàng"
              onDelete={() => removeFilter('stock')}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          
          {/* Brand Filters */}
          {selectedBrands.map(brand => (
            <Chip
              key={brand}
              label={`Thương hiệu: ${brand}`}
              onDelete={() => removeFilter('brand', brand)}
              size="small"
              color="primary"
              variant="outlined"
            />
          ))}
          
          {/* Clear All */}
          <Chip
            label="Xóa tất cả"
            onClick={handleClearFilters}
            size="small"
            color="error"
            variant="outlined"
          />
        </Box>
      )}
      
      {/* Controls: Sort and Filter */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Tìm thấy <strong>{products.length > 0 ? `${(page - 1) * 12 + 1}-${Math.min(page * 12, (totalPages - 1) * 12 + products.length)} sản phẩm` : '0 sản phẩm'}</strong>
          </Typography>
          
          {/* Filter button for mobile */}
          {!isDesktop && (
            <Button
              startIcon={<TuneIcon />}
              onClick={handleFilterToggle}
              variant="outlined"
              color="primary"
              size="small"
              sx={{ mr: 1 }}
            >
              Bộ lọc {activeFilters > 0 && `(${activeFilters})`}
            </Button>
          )}
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
      
      {/* Filter Drawer - Mobile only */}
      <Drawer
        anchor="left"
        open={filterDrawerOpen && !isDesktop}
        onClose={handleFilterToggle}
        PaperProps={{
          sx: { width: '85%', maxWidth: '320px' }
        }}
      >
        <FilterContent />
      </Drawer>
    </Container>
  );
};

export default ProductsPage; 