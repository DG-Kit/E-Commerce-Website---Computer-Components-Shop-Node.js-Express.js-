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