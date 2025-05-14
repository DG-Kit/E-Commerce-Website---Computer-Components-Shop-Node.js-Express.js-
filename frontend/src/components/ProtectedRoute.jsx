import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

/**
 * A wrapper for routes that require authentication
 * If user is not authenticated, redirects to login with the current location saved in state
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
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

  // If authenticated, render the children components
  return children;
};

export default ProtectedRoute; 