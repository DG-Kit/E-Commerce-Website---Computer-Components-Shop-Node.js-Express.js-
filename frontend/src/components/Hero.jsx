import React from 'react';
import { Box, Button, Container, Grid, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Computer as ComputerIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';

// Styled component for the gradient background
const HeroBackground = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
  color: 'white',
  padding: theme.spacing(10, 0),
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(6, 0),
  },
}));

// Styled component for the hero button
const HeroButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#f59e0b',
  color: 'white',
  fontWeight: 'bold',
  padding: theme.spacing(1.2, 3),
  borderRadius: theme.shape.borderRadius,
  '&:hover': {
    backgroundColor: '#d97706',
  },
}));

const Hero = () => {
  return (
    <HeroBackground>
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography 
              variant="h2" 
              component="h1" 
              fontWeight="bold"
              sx={{ 
                mb: 2,
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              Xây dựng PC trong mơ của bạn
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Cửa hàng linh kiện máy tính với đầy đủ các sản phẩm chất lượng cao, từ CPU, GPU đến các phụ kiện gaming
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <HeroButton 
                component={Link} 
                to="/products"
                variant="contained" 
                size="large"
                startIcon={<ComputerIcon />}
              >
                Khám phá ngay
              </HeroButton>
              <Button 
                component={Link}
                to="/build-pc"
                variant="outlined" 
                size="large" 
                sx={{ 
                  borderColor: 'white', 
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  } 
                }}
              >
                Tự build PC
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box 
              component="img"
              src="/placeholder.svg?height=400&width=500&text=Gaming PC"
              alt="Gaming PC" 
              sx={{ 
                width: '100%', 
                maxWidth: 500,
                height: 'auto',
                filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.3))',
              }}
            />
          </Grid>
        </Grid>
      </Container>
    </HeroBackground>
  );
};

export default Hero; 