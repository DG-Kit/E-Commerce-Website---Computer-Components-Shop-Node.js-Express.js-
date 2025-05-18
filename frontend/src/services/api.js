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
      console.log(`Adding token to ${config.url}`);
    } else {
      console.warn(`No token for request to ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API Error Response:", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
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
  removeFromCart: (data) => api.delete('/cart/remove', { data }),
};

// Order API
export const orderApi = {
  // Create a new order
  createOrder: (data) => api.post('/orders', data),
  
  // Get order by ID
  getOrderById: (id) => api.get(`/orders/${id}`),
  
  // Get current user's orders
  getUserOrders: (params) => api.get('/orders/user', { params }),
  
  // Get user order history (with pagination)
  getOrderHistory: (page = 1, limit = 10) => 
    api.get('/orders/user', { params: { page, limit, sort: 'createdAt:desc' } }),
  
  // Cancel an order
  cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
};

// Coupon API
export const couponApi = {
  // Verify coupon
  verifyCoupon: (data) => api.post('/coupons/verify', data),
};

// Payment API
export const paymentApi = {
  // Create payment URL (VNPay)
  createVNPayUrl: (data) => api.post('/payment/create-vnpay-url', data),
  
  // Get payment history
  getPaymentHistory: () => api.get('/payment/history'),
};

// Admin API
export const adminApi = {
  // Get dashboard statistics
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  
  // Get recent orders
  getRecentOrders: (limit = 5) => api.get('/admin/dashboard/recent-orders', { params: { limit } }),
  
  // Get best selling products
  getBestSellingProducts: (limit = 5, timeFrame = 'all') => api.get('/admin/dashboard/best-sellers', { params: { limit, timeFrame } }),
  
  // Get revenue data by time range (week, month, year)
  getRevenueData: (timeRange) => api.get('/admin/dashboard/revenue', { params: { timeRange } }),
  
  // Get all products (admin)
  getAllProducts: (params) => api.get('/admin/products', { params }),
  
  // Get products with pagination, search and filter (admin)
  getProducts: (params) => api.get('/admin/products', { params }),
  
  // Get single product (admin)
  getProduct: (id) => api.get(`/admin/products/${id}`),
  
  // Create new product (admin)
  createProduct: (data) => api.post('/admin/products', data),
  
  // Update product (admin)
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  
  // Delete product (admin)
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  
  // Toggle product active status
  toggleProductStatus: (id) => api.put(`/admin/products/${id}/toggle-status`),

  // Upload product image
  uploadProductImage: (formData) => {
    return api.post('/admin/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Categories API
  getCategories: (params) => api.get('/categories', { params }),
  getCategoryById: (id) => api.get(`/categories/${id}`),
  createCategory: (data) => api.post('/categories/add', data),
  updateCategory: (id, data) => api.put('/categories/update', { categoryId: id, updates: data }),
  deleteCategory: (id) => api.delete('/categories/delete', { data: { categoryId: id } }),
  
  // Orders API
  getAllOrders: (params) => api.get('/orders/admin/all', { params }),
  getOrderById: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  deleteOrder: (id) => api.delete(`/orders/${id}`),
  
  // Users API
  getAllUsers: (params) => api.get('/auth/all-users', { params }),
  getUserById: (id) => api.get(`/auth/users/${id}`),
  updateUser: (id, data) => api.put('/auth/update-user', { ...data, userId: id }),
  deleteUser: (id) => api.delete('/auth/delete-user', { data: { userId: id } }),
  updateUserStatus: (id, data) => api.put('/auth/update-user', { ...data, userId: id }),
  
  // Coupons API
  getAllCoupons: (params) => api.get('/coupons/all', { params }),
  getCouponById: (id) => api.get(`/coupons/${id}`),
  createCoupon: (data) => api.post('/coupons/create', data),
  updateCoupon: (id, data) => api.put(`/coupons/${id}`, data),
  deleteCoupon: (id) => api.delete(`/coupons/${id}`),
  updateCouponStatus: (id, data) => api.patch(`/coupons/${id}/status`, data),
};

export default api;