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
  useTheme,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Collapse,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Button,
  Slider,
  TextField,
  Stack,
  Popover
} from '@mui/material';
import {
  NavigateNext as NavigateNextIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FilterAlt as FilterAltIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import ProductCard from '../components/ProductCard';
import { productsApi, categoriesApi } from '../services/api';

// Format price to VND
const formatPrice = (price) => {
  if (typeof price !== 'number') return 'N/A';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  
  const featured = searchParams.get('featured') === 'true';
  const newest = searchParams.get('newest') === 'true';
  const categoryParam = searchParams.get('category');
  const brandParam = searchParams.get('brand');
  const minPriceParam = searchParams.get('minPrice');
  const maxPriceParam = searchParams.get('maxPrice');
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState(newest ? 'newest' : 'featured');
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(categoryParam ? [categoryParam] : []);
  const [categoryExpanded, setCategoryExpanded] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({});
  
  // Price filter states
  const [priceRange, setPriceRange] = useState([
    minPriceParam ? parseInt(minPriceParam) : 0,
    maxPriceParam ? parseInt(maxPriceParam) : 50000000
  ]);
  const [priceRangeInput, setPriceRangeInput] = useState([
    minPriceParam ? parseInt(minPriceParam) : 0,
    maxPriceParam ? parseInt(maxPriceParam) : 50000000
  ]);
  const [applyingPrice, setApplyingPrice] = useState(false);
  
  // New states for attribute filters - keep only brand
  const [categoryAttributes, setCategoryAttributes] = useState({});
  const [selectedAttributes, setSelectedAttributes] = useState({
    brand: brandParam ? [brandParam] : []
  });
  
  // Popover states for horizontal filters
  const [categoryAnchorEl, setCategoryAnchorEl] = useState(null);
  const [priceAnchorEl, setPriceAnchorEl] = useState(null);
  const [brandAnchorEl, setBrandAnchorEl] = useState(null);
  
  // Get page title based on query params
  const getPageTitle = () => {
    if (featured) return 'Sản phẩm nổi bật';
    if (newest) return 'Sản phẩm mới';
    return 'Tất cả sản phẩm';
  };
  
  // Fetch categories and their attributes
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesApi.getCategories({ active: 'true', withChildren: 'true' });
        
        // Store the full category tree for hierarchical display
        setCategories(response.data || []);
        
        // Process category attributes - only extract brands
        const attributes = {};
        
        // Helper function to extract attributes from categories recursively
        const extractAttributes = (categoryList) => {
          if (!Array.isArray(categoryList)) return;
          
          categoryList.forEach(category => {
            if (category.attributes && Array.isArray(category.attributes) && category.attributes.length > 0) {
              category.attributes.forEach(attr => {
                if (attr.name === 'Thương hiệu' && Array.isArray(attr.values) && attr.values.length > 0) {
                  // Create attribute group if it doesn't exist
                  if (!attributes[attr.name]) {
                    attributes[attr.name] = [];
                  }
                  
                  // Add unique values
                  attr.values.forEach(value => {
                    if (!attributes[attr.name].includes(value)) {
                      attributes[attr.name].push(value);
                    }
                  });
                }
              });
            }
            
            // Process children categories
            if (category.children && Array.isArray(category.children) && category.children.length > 0) {
              extractAttributes(category.children);
            }
          });
        };
        
        extractAttributes(response.data || []);
        console.log("Extracted attributes:", attributes);
        setCategoryAttributes(attributes);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories. Please try again later.');
      }
    };
    
    fetchCategories();
  }, []);
  
  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Set up query parameters
        const queryParams = {
          page,
          limit: 10,
          sort: getSortValue(sortBy)
        };
        
        // Add featured flag if needed
        if (featured) {
          queryParams.featured = true;
        }
        
        // Add category filter if selected - combine both approaches
        if (selectedCategories.length > 0) {
          // Process each selected category
          let allCategoryIds = [];
          
          selectedCategories.forEach(categoryId => {
            // Find the category in the tree
            const category = findCategoryById(categoryId, categories);
            
            if (category) {
              // For parent categories (with children), include all child category IDs
              if (category.children && Array.isArray(category.children) && category.children.length > 0) {
                const allIds = getAllSubcategoryIds(category);
                allCategoryIds = [...allCategoryIds, ...allIds];
              } else {
                // For child categories (without children), just add the ID itself
                allCategoryIds.push(categoryId);
              }
            } else {
              // If category not found, just add the ID
              allCategoryIds.push(categoryId);
            }
          });
          
          // Remove duplicates
          allCategoryIds = [...new Set(allCategoryIds)];
          
          console.log("Effective category IDs for filtering:", allCategoryIds);
          queryParams.category = allCategoryIds.join(',');
        }
        
        // Add brand filter
        if (selectedAttributes.brand && selectedAttributes.brand.length > 0) {
          queryParams.brand = selectedAttributes.brand.join(',');
        }
        
        // Add price range filter
        if (priceRange[0] > 0) {
          queryParams.minPrice = priceRange[0];
        }
        
        if (priceRange[1] < 50000000) {
          queryParams.maxPrice = priceRange[1];
        }
        
        console.log("Fetching products with params:", queryParams);
        const response = await productsApi.getProducts(queryParams);
        console.log("API Response:", response);
        
        setProducts(response.data.products || []);
        setTotalPages(response.data.totalPages || 1);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Failed to load products');
        setProducts([]); // Reset products on error
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [page, sortBy, featured, newest, selectedCategories, selectedAttributes, categories, priceRange]);
  
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
  
  // Handle category expansion
  const handleCategoryExpand = (categoryId) => {
    setExpandedCategories({
      ...expandedCategories,
      [categoryId]: !expandedCategories[categoryId]
    });
  };
  
  const handleCategoryToggle = (categoryId) => {
    try {
      console.log("Toggling category:", categoryId);
      
      const currentIndex = selectedCategories.indexOf(categoryId);
      const newSelected = [...selectedCategories];
      
      if (currentIndex === -1) {
        newSelected.push(categoryId);
      } else {
        newSelected.splice(currentIndex, 1);
      }
      
      console.log("New selected categories:", newSelected);
      setSelectedCategories(newSelected);
      setPage(1); // Reset to first page when category changes
      
      // Update URL params
      updateUrlParams('category', newSelected);
    } catch (err) {
      console.error("Error in handleCategoryToggle:", err);
      setError("Error selecting category. Please try again.");
    }
  };

  // Helper function to get all subcategory IDs for a category
  const getAllSubcategoryIds = (category) => {
    if (!category) return [];
    
    let ids = [category._id];
    
    if (category.children && Array.isArray(category.children) && category.children.length > 0) {
      category.children.forEach(child => {
        ids = [...ids, ...getAllSubcategoryIds(child)];
      });
    }
    
    return ids;
  };
  
  // Find a category by ID in the category tree
  const findCategoryById = (categoryId, categoryList) => {
    if (!Array.isArray(categoryList)) return null;
    
    for (const category of categoryList) {
      if (category._id === categoryId) {
        return category;
      }
      
      if (category.children && Array.isArray(category.children) && category.children.length > 0) {
        const foundInChildren = findCategoryById(categoryId, category.children);
        if (foundInChildren) return foundInChildren;
      }
    }
    
    return null;
  };
  
  // Handle attribute filter changes (for brand only)
  const handleAttributeToggle = (attrName, value) => {
    try {
      console.log(`Toggling attribute: ${attrName}, value: ${value}`);
      
      // Make sure selectedAttributes[attrName] exists
      if (!selectedAttributes[attrName]) {
        selectedAttributes[attrName] = [];
      }
      
      const currentValues = [...selectedAttributes[attrName]];
      const currentIndex = currentValues.indexOf(value);
      
      if (currentIndex === -1) {
        currentValues.push(value);
      } else {
        currentValues.splice(currentIndex, 1);
      }
      
      const newSelectedAttributes = {
        ...selectedAttributes,
        [attrName]: currentValues
      };
      
      console.log("New selected attributes:", newSelectedAttributes);
      setSelectedAttributes(newSelectedAttributes);
      setPage(1); // Reset to first page
      
      // Update URL params
      updateUrlParams(attrName, currentValues);
    } catch (err) {
      console.error("Error in handleAttributeToggle:", err);
      setError("Error applying filter. Please try again.");
    }
  };
  
  // Handle price range changes
  const handlePriceRangeChange = (event, newValue) => {
    setPriceRangeInput(newValue);
  };
  
  const handlePriceRangeInputChange = (index, value) => {
    const newInputs = [...priceRangeInput];
    newInputs[index] = value === '' ? 0 : Number(value);
    setPriceRangeInput(newInputs);
  };
  
  const handleApplyPriceRange = () => {
    setApplyingPrice(true);
    
    // Apply the price range filter
    setPriceRange(priceRangeInput);
    
    // Update URL params for price
    const params = new URLSearchParams(searchParams);
    
    if (priceRangeInput[0] > 0) {
      params.set('minPrice', priceRangeInput[0]);
    } else {
      params.delete('minPrice');
    }
    
    if (priceRangeInput[1] < 50000000) {
      params.set('maxPrice', priceRangeInput[1]);
    } else {
      params.delete('maxPrice');
    }
    
    setSearchParams(params);
    setPage(1); // Reset to first page
    
    setTimeout(() => {
      setApplyingPrice(false);
      setPriceAnchorEl(null); // Close price popover
    }, 500);
  };
  
  // Helper function to update URL parameters
  const updateUrlParams = (paramName, values) => {
    try {
      const params = new URLSearchParams(searchParams);
      
      if (values && values.length > 0) {
        params.set(paramName, values.join(','));
      } else {
        params.delete(paramName);
      }
      
      setSearchParams(params);
    } catch (err) {
      console.error("Error in updateUrlParams:", err);
    }
  };
  
  // Helper function to check if an attribute value is selected
  const isAttributeSelected = (attrName, value) => {
    return selectedAttributes[attrName] && selectedAttributes[attrName].includes(value);
  };
  
  // Count active filters
  const getActiveFiltersCount = () => {
    let count = selectedCategories.length;
    
    Object.values(selectedAttributes).forEach(values => {
      if (Array.isArray(values)) {
        count += values.length;
      }
    });
    
    // Add price filter if applied
    if (priceRange[0] > 0 || priceRange[1] < 50000000) {
      count += 1;
    }
    
    return count;
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedAttributes({ brand: [] });
    setPriceRange([0, 50000000]);
    setPriceRangeInput([0, 50000000]);
    setPage(1);
    
    // Update URL by removing filter params
    const params = new URLSearchParams(searchParams);
    params.delete('category');
    params.delete('brand');
    params.delete('minPrice');
    params.delete('maxPrice');
    setSearchParams(params);
  };
  
  // Handlers for filter popovers
  const handleCategoryClick = (event) => {
    setCategoryAnchorEl(event.currentTarget);
  };
  
  const handlePriceClick = (event) => {
    setPriceAnchorEl(event.currentTarget);
  };
  
  const handleBrandClick = (event) => {
    setBrandAnchorEl(event.currentTarget);
  };
  
  const handleClosePopovers = () => {
    setCategoryAnchorEl(null);
    setPriceAnchorEl(null);
    setBrandAnchorEl(null);
  };

  // Loading state
  if (loading && products.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
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
      
      {/* Horizontal Filter Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterAltIcon fontSize="small" color="action" />
            <Typography variant="subtitle1">Lọc:</Typography>
          </Box>
          
          {/* Category Filter */}
          <Button 
            variant={selectedCategories.length > 0 ? "contained" : "outlined"} 
            onClick={handleCategoryClick}
              size="small"
            color={selectedCategories.length > 0 ? "primary" : "inherit"}
          >
            Danh mục {selectedCategories.length > 0 && `(${selectedCategories.length})`}
          </Button>
          
          <Popover
            open={Boolean(categoryAnchorEl)}
            anchorEl={categoryAnchorEl}
            onClose={() => setCategoryAnchorEl(null)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            PaperProps={{
              sx: { width: 320, maxHeight: 400, overflow: 'auto', p: 1 }
            }}
          >
            <List dense>
              {categories.map((parentCategory) => (
                <React.Fragment key={parentCategory._id}>
                  {/* Parent category */}
                  <ListItem 
                    dense
                    button 
                    onClick={() => handleCategoryToggle(parentCategory._id)}
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: selectedCategories.indexOf(parentCategory._id) !== -1 ? 'rgba(25, 118, 210, 0.08)' : 'transparent'
                    }}
                  >
                    <Checkbox
                      edge="start"
                      checked={selectedCategories.indexOf(parentCategory._id) !== -1}
                      tabIndex={-1}
                      disableRipple
              size="small"
                    />
                    <ListItemText primary={parentCategory.name} />
                    {parentCategory.children && parentCategory.children.length > 0 && (
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCategoryExpand(parentCategory._id);
                        }}
                      >
                        {expandedCategories[parentCategory._id] ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                      </IconButton>
          )}
                  </ListItem>
          
                  {/* Child categories */}
                  {parentCategory.children && 
                   parentCategory.children.length > 0 && 
                   (expandedCategories[parentCategory._id] || selectedCategories.indexOf(parentCategory._id) !== -1) && (
                    <List dense component="div" disablePadding>
                      {parentCategory.children.map((childCategory) => (
                        <ListItem
                          key={childCategory._id}
                          dense
                          button
                          onClick={() => handleCategoryToggle(childCategory._id)}
                          sx={{
                            pl: 4,
                            backgroundColor: selectedCategories.indexOf(childCategory._id) !== -1 ? 'rgba(25, 118, 210, 0.08)' : 'transparent'
                          }}
                        >
                          <Checkbox
                            edge="start"
                            checked={selectedCategories.indexOf(childCategory._id) !== -1}
                            tabIndex={-1}
                            disableRipple
              size="small"
                          />
                          <ListItemText primary={childCategory.name} />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </React.Fragment>
              ))}
            </List>
          </Popover>
          
          {/* Price Filter */}
          <Button 
            variant={(priceRange[0] > 0 || priceRange[1] < 50000000) ? "contained" : "outlined"} 
            onClick={handlePriceClick}
            size="small"
            color={(priceRange[0] > 0 || priceRange[1] < 50000000) ? "primary" : "inherit"}
          >
            Giá {(priceRange[0] > 0 || priceRange[1] < 50000000) && "(1)"}
          </Button>
          
          <Popover
            open={Boolean(priceAnchorEl)}
            anchorEl={priceAnchorEl}
            onClose={() => setPriceAnchorEl(null)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            PaperProps={{
              sx: { width: 300, p: 2 }
            }}
          >
            <Box sx={{ px: 1 }}>
              <Slider
                value={priceRangeInput}
                onChange={handlePriceRangeChange}
                valueLabelDisplay="off"
                min={0}
                max={50000000}
                step={500000}
                sx={{ mb: 2 }}
              />
              
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <TextField
                  label="Từ"
                  value={priceRangeInput[0]}
                  onChange={(e) => handlePriceRangeInputChange(0, e.target.value)}
                  type="number"
                  size="small"
                  fullWidth
                  InputProps={{
                    inputProps: { min: 0, max: priceRangeInput[1] }
                  }}
                />
                <Typography variant="body2" color="text.secondary">-</Typography>
                <TextField
                  label="Đến"
                  value={priceRangeInput[1]}
                  onChange={(e) => handlePriceRangeInputChange(1, e.target.value)}
                  type="number"
                  size="small"
                  fullWidth
                  InputProps={{
                    inputProps: { min: priceRangeInput[0], max: 50000000 }
                  }}
                />
              </Stack>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {formatPrice(priceRangeInput[0])}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatPrice(priceRangeInput[1])}
                </Typography>
        </Box>
              
              <Button
                variant="contained"
                fullWidth
                onClick={handleApplyPriceRange}
                sx={{ mt: 2 }}
                disabled={applyingPrice}
              >
                Áp dụng
              </Button>
            </Box>
          </Popover>
          
          {/* Brand Filter */}
          {categoryAttributes['Thương hiệu'] && categoryAttributes['Thương hiệu'].length > 0 && (
            <>
            <Button
                variant={selectedAttributes.brand && selectedAttributes.brand.length > 0 ? "contained" : "outlined"} 
                onClick={handleBrandClick}
              size="small"
                color={selectedAttributes.brand && selectedAttributes.brand.length > 0 ? "primary" : "inherit"}
            >
                Thương hiệu {selectedAttributes.brand && selectedAttributes.brand.length > 0 && `(${selectedAttributes.brand.length})`}
            </Button>
              
              <Popover
                open={Boolean(brandAnchorEl)}
                anchorEl={brandAnchorEl}
                onClose={() => setBrandAnchorEl(null)}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                PaperProps={{
                  sx: { width: 250, maxHeight: 300, overflow: 'auto', p: 1 }
                }}
              >
                <List dense>
                  {categoryAttributes['Thương hiệu'].map((brand) => (
                    <ListItem 
                      key={brand}
                      dense
                      button 
                      onClick={() => handleAttributeToggle('brand', brand)}
                    >
                      <Checkbox
                        edge="start"
                        checked={isAttributeSelected('brand', brand)}
                        tabIndex={-1}
                        disableRipple
                        size="small"
                      />
                      <ListItemText primary={brand} />
                    </ListItem>
                  ))}
                </List>
              </Popover>
            </>
          )}
          
          {/* Sorting control */}
          <Box sx={{ display: 'flex', marginLeft: 'auto' }}>
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
        </Box>
        
        {/* Active Filter Chips */}
        {getActiveFiltersCount() > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, alignItems: 'center' }}>
            {selectedCategories.map(catId => {
              const category = findCategoryById(catId, categories);
              return category ? (
                <Chip
                  key={catId}
                  label={category.name}
                  onDelete={() => handleCategoryToggle(catId)}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ) : null;
            })}
            
            {selectedAttributes.brand && 
             Array.isArray(selectedAttributes.brand) && 
             selectedAttributes.brand.map(value => (
              <Chip
                key={`brand-${value}`}
                label={`Thương hiệu: ${value}`}
                onDelete={() => handleAttributeToggle('brand', value)}
                color="primary"
                variant="outlined"
                size="small"
              />
            ))}
            
            {/* Price range chip */}
            {(priceRange[0] > 0 || priceRange[1] < 50000000) && (
              <Chip
                key="price-range"
                label={`Giá: ${formatPrice(priceRange[0])} - ${formatPrice(priceRange[1])}`}
                onDelete={() => {
                  setPriceRange([0, 50000000]);
                  setPriceRangeInput([0, 50000000]);
                  
                  // Update URL params
                  const params = new URLSearchParams(searchParams);
                  params.delete('minPrice');
                  params.delete('maxPrice');
                  setSearchParams(params);
                }}
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
            
            {/* Clear all button */}
            <Button 
              variant="text" 
              color="primary" 
              size="small" 
              onClick={clearAllFilters}
              startIcon={<ClearIcon />}
              sx={{ ml: 1 }}
            >
              Xóa tất cả
            </Button>
          </Box>
        )}
      </Paper>
      
      {/* Error display */}
      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" color="error">
            {error}
          </Typography>
        </Box>
      )}
      
      {/* Product Grid */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : products.length > 0 ? (
            <Grid container spacing={2}>
              {products.map((product) => (
                <Grid item xs={12} sm={6} md={3} lg={3} key={product._id}>
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
      {totalPages > 0 && (
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
    </Container>
  );
};

export default ProductsPage; 