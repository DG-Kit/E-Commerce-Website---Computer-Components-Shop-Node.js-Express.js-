import React from 'react';
import { Box, Typography, Grid, Container } from '@mui/material';
import ProductCard from './ProductCard';
import SectionTitle from './SectionTitle';

const ProductSection = ({ title, products = [], viewAllLink, maxItems = 8 }) => {
  // Limit the number of products to display
  const displayProducts = products.slice(0, maxItems);

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="xl">
        {/* Use the new SectionTitle component */}
        <SectionTitle title={title} viewAllLink={viewAllLink} />
        
        {/* Product Grid */}
        <Grid container spacing={2}>
          {displayProducts.map((product) => (
            <Grid item xs={6} sm={4} md={3} key={product._id}>
              <ProductCard product={product} />
            </Grid>
          ))}
          
          {/* Show empty placeholder if fewer than expected products */}
          {displayProducts.length === 0 && (
            <Grid item xs={12}>
              <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                Không có sản phẩm nào trong danh mục này.
              </Typography>
            </Grid>
          )}
        </Grid>
    </Container>
    </Box>
  );
};

export default ProductSection; 