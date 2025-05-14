import axios from 'axios';

// Create an axios instance with the base URL
const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Products API
export const productsApi = {
  // Get all products
  getProducts: (params) => api.get('/products', { params }),
  
  // Get product by ID
  getProductById: (id) => api.get(`/products/${id}`),
};

// Categories API
export const categoriesApi = {
  // Get all categories
  getCategories: (params) => api.get('/categories', { params }),
};

// Auth API
export const authApi = {
  // Login
  login: (data) => api.post('/auth/login', data),
  
  // Register
  register: (data) => api.post('/auth/register', data),
  
  // Get current user
  getCurrentUser: () => api.get('/auth/me'),
  
  // Forgot password - request reset
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  
  // Reset password with token
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  
  // Change password (for logged-in users)
  changePassword: (data) => api.put('/auth/change-password', data),
};

// User Address API
export const addressApi = {
  // Get all addresses for current user
  getAddresses: () => api.get('/auth/me'),
  
  // Add a new address
  addAddress: (data) => api.post('/auth/add-address', data),
  
  // Update an existing address
  updateAddress: (addressId, data) => api.put('/auth/update-address', { 
    addressId, 
    ...data 
  }),
  
  // Delete an address
  deleteAddress: (addressId) => api.delete('/auth/delete-address', { 
    data: { addressId } 
  }),
  
  // Set address as default
  setDefaultAddress: (addressId) => api.put('/auth/update-address', { 
    addressId, 
    isDefault: true 
  }),
};

// Cart API
export const cartApi = {
  // Get cart
  getCart: () => api.get('/cart'),
  
  // Add to cart
  addToCart: (data) => api.post('/cart/add', data),
  
  // Update cart item
  updateCartItem: (data) => api.put('/cart/update', data),
  
  // Remove from cart
  removeFromCart: (productId) => api.delete(`/cart/remove/${productId}`),
};

export default api;