import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, Breadcrumbs, Link, CircularProgress, Pagination, Select, MenuItem, FormControl, InputLabel, Divider } from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import ProductCard from '../components/ProductCard';
import { productsApi, categoriesApi } from '../services/api';

const CategoryPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const [category, setCategory] = useState(null);
  const [parentCategories, setParentCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  
  // Fetch category and its products
  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      try {
        setLoading(true);
        
        // First, get all categories to find the current one by slug
        const categoriesResponse = await categoriesApi.getCategories({
          withChildren: 'true', 
          active: 'true'
        });
        
        // Flatten the category tree to find the target category
        const flattenCategories = (categories, parents = []) => {
          let result = [];
          for (const category of categories) {
            // Clone parents array to avoid reference issues
            const categoryWithParents = { ...category, parents: [...parents] };
            result.push(categoryWithParents);
            
            if (category.children && category.children.length > 0) {
              const childrenWithParents = flattenCategories(
                category.children, 
                [...parents, { _id: category._id, name: category.name, slug: category.slug }]
              );
              result = [...result, ...childrenWithParents];
            }
          }
          return result;
        };
        
        const flatCategories = flattenCategories(categoriesResponse.data);
        const currentCategory = flatCategories.find(cat => cat.slug === slug);
        
        if (!currentCategory) {
          throw new Error('Category not found');
        }
        
        setCategory(currentCategory);
        setParentCategories(currentCategory.parents || []);
        
        // Get all subcategories recursively to fetch products from all of them
        const getAllSubcategoryIds = (category) => {
          let ids = [category._id];
          
          if (category.children && category.children.length > 0) {
            // Get all subcategories to display in the UI
            setSubcategories(category.children);
            
            // Add each child ID and its children's IDs recursively
            category.children.forEach(child => {
              ids = [...ids, ...getAllSubcategoryIds(child)];
            });
          }
          
          return ids;
        };
        
        // Get all category IDs to fetch products from
        const categoryIds = getAllSubcategoryIds(currentCategory);
        
        // Get products for this category and all subcategories
        const productsPromises = categoryIds.map(catId => 
          productsApi.getProducts({
            category: catId,
            page: 1,
            limit: 100, // Higher limit to get more products
            sort: getSortValue(sortBy)
          })
        );
        
        const productsResponses = await Promise.all(productsPromises);
        
        // Combine all products from all categories
        let allProducts = [];
        productsResponses.forEach(response => {
          if (response.data && response.data.products) {
            allProducts = [...allProducts, ...response.data.products];
          }
        });
        
        // Sort combined products
        allProducts = sortProducts(allProducts, sortBy);
        
        // Apply manual pagination since we're doing client-side paging
        const itemsPerPage = 12;
        const totalItems = allProducts.length;
        const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedProducts = allProducts.slice(startIndex, endIndex);
        
        setProducts(paginatedProducts);
        setTotalPages(calculatedTotalPages);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching category data:', err);
        setError(err.message || 'Failed to load category data');
        setLoading(false);
      }
    };
    
    fetchCategoryAndProducts();
  }, [slug, page, sortBy]);
  
  // Sort products client-side
  const sortProducts = (products, sortOption) => {
    const productsCopy = [...products];
    
    switch (sortOption) {
      case 'newest':
        return productsCopy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return productsCopy.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'priceAsc':
        return productsCopy.sort((a, b) => (a.minPrice || 0) - (b.minPrice || 0));
      case 'priceDesc':
        return productsCopy.sort((a, b) => (b.minPrice || 0) - (a.minPrice || 0));
      default:
        return productsCopy;
    }
  };
  
  const getSortValue = (sortOption) => {
    switch (sortOption) {
      case 'newest': return 'createdAt:desc';
      case 'oldest': return 'createdAt:asc';
      case 'priceAsc': return 'minPrice:asc';
      case 'priceDesc': return 'minPrice:desc';
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
  
  const handleBreadcrumbClick = (categorySlug) => {
    navigate(`/category/${categorySlug}`);
  };
  
  // Loading state
  if (loading && !category) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Error state
  if (error && !category) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h5" color="error" gutterBottom>
          Error: {error}
        </Typography>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
      >
        <Link 
          color="inherit" 
          href="/" 
          sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          Trang chủ
        </Link>
        
        {parentCategories.map((parent) => (
          <Link
            key={parent._id}
            color="inherit"
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' }, cursor: 'pointer' }}
            onClick={() => handleBreadcrumbClick(parent.slug)}
          >
            {parent.name}
          </Link>
        ))}
        
        <Typography color="text.primary">
          {category?.name || 'Danh mục'}
        </Typography>
      </Breadcrumbs>
      
      {/* Category Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {category?.name || 'Danh mục sản phẩm'}
        </Typography>
        {category?.description && (
          <Typography variant="body1" color="text.secondary">
            {category.description}
          </Typography>
        )}
        <Divider sx={{ mt: 2 }} />
      </Box>
      
      {/* Subcategories */}
      {subcategories.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Các loại sản phẩm
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {subcategories.map(subcat => (
              <Grid item xs={6} sm={4} md={3} key={subcat._id}>
                <Box
                  onClick={() => navigate(`/category/${subcat.slug}`)}
                  sx={{
                    p: 2,
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: 2,
                      bgcolor: '#f5f5f5'
                    }
                  }}
                >
                  <Typography variant="subtitle2" noWrap>
                    {subcat.name}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ mb: 3 }} />
        </Box>
      )}
      
      {/* Controls: Sort and Filter */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="body1">
          Tìm thấy <strong>{products.length > 0 ? `${(page - 1) * 12 + 1}-${Math.min(page * 12, (totalPages - 1) * 12 + products.length)} sản phẩm` : '0 sản phẩm'}</strong>
        </Typography>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
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
          </Select>
        </FormControl>
      </Box>
      
      {/* Product Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : products.length > 0 ? (
        <Grid container spacing={2}>
          {products.map((product) => (
            <Grid item xs={6} sm={4} md={3} key={product._id}>
              <ProductCard product={product} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.secondary">
            Không tìm thấy sản phẩm nào trong danh mục này
          </Typography>
        </Box>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handlePageChange} 
            variant="outlined" 
            shape="rounded" 
            color="primary"
          />
        </Box>
      )}
    </Container>
  );
};

export default CategoryPage; 