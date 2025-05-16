import React, { createContext, useState, useContext, useEffect } from 'react';
import { authApi } from '../services/api';

// Create auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is logged in on page load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authApi.getCurrentUser();
          console.log('Auth check response:', response);
          // Ensure we're setting the user data correctly
          setCurrentUser(response.data);
          setIsAuthenticated(true);
          // Check if user is admin
          setIsAdmin(response.data?.role === 'admin');
        } catch (error) {
          // Handle token expiration or invalid token
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (credentials) => {
    const response = await authApi.login(credentials);
    localStorage.setItem('token', response.data.token);
    
    // Get user details
    const userResponse = await authApi.getCurrentUser();
    console.log('User data after login:', userResponse.data);
    // Ensure we set the complete user object including addresses
    setCurrentUser(userResponse.data);
    setIsAuthenticated(true);
    // Check if user is admin
    setIsAdmin(userResponse.data?.role === 'admin');
    
    return response;
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  // Register function
  const register = async (userData) => {
    const response = await authApi.register(userData);
    return response;
  };

  // Context value
  const value = {
    currentUser,
    isAuthenticated,
    isAdmin,
    loading,
    login,
    logout,
    register
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 