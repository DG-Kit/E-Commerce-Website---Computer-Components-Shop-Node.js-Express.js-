import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * A wrapper for routes that require admin authentication
 * If user is not authenticated or not an admin, redirects to appropriate page
 */
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  // If authentication is still being checked, show loading spinner
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // If not authenticated, redirect to login and save current location
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated but not admin, show unauthorized message
  if (!isAdmin) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
          p: 3,
          textAlign: 'center'
        }}
      >
        <Typography variant="h4" color="error" gutterBottom>
          Truy cập bị từ chối
        </Typography>
        <Typography variant="body1">
          Bạn không có quyền truy cập vào trang quản trị.
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Navigate to="/" replace />
        </Box>
      </Box>
    );
  }

  // If authenticated and admin, render the children components
  return children;
};

export default AdminRoute; 