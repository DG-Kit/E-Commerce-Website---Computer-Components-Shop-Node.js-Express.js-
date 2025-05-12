import React from 'react';
import { Box, Typography, Divider, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';

const SectionTitle = ({ title, viewAllLink, viewAllText = "Xem tất cả" }) => {
  return (
    <>
      {/* Section Header with Title and View All Button */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2,
          position: 'relative'
        }}
      >
        {/* Title Container - Styled to be more compact */}
        <Box 
          sx={{ 
            display: 'inline-flex',
            position: 'relative',
            mb: 1,
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: '100%',
              height: 2,
              backgroundColor: 'primary.main',
              borderRadius: 1
            }
          }}
        >
          <Typography 
            variant="h5" 
            component="h2" 
            fontWeight="bold"
            sx={{
              display: 'inline-block',
              position: 'relative',
              px: 1,
              py: 0.5,
              color: 'text.primary',
            }}
          >
            {title}
          </Typography>
        </Box>
        
        {/* View All Button */}
        {viewAllLink && (
          <Button 
            component={Link} 
            to={viewAllLink} 
            endIcon={<ArrowForwardIcon />}
            sx={{ 
              textTransform: 'none',
              fontWeight: 'medium'
            }}
          >
            {viewAllText}
          </Button>
        )}
      </Box>
      
      {/* Thin divider below the section header */}
      <Divider sx={{ mb: 3, opacity: 0.7 }} />
    </>
  );
};

export default SectionTitle;