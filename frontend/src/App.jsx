import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import CategoryPage from './pages/CategoryPage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import ProductAdd from './pages/admin/ProductAdd';
import ProductEdit from './pages/admin/ProductEdit';
import Categories from './pages/admin/Categories';
import AdminOrders from './pages/admin/Orders';
import Users from './pages/admin/Users';
import Coupons from './pages/admin/Coupons';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#9c27b0',
    },
    warning: {
      main: '#f59e0b',
    },
    success: {
      main: '#10b981',
    }
  },
  typography: {
    fontFamily: [
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <CartProvider>
          <Router>
            <ScrollToTop />
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              {/* Main routes with header and footer */}
              <Routes>
                {/* Admin routes */}
                <Route 
                  path="/admin/*" 
                  element={
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  {/* Admin routes */}
                  <Route path="products" element={<Products />} />
                  <Route path="products/add" element={<ProductAdd />} />
                  <Route path="products/edit/:id" element={<ProductEdit />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="orders/:id" element={<OrderDetail />} />
                  <Route path="users" element={<Users />} />
                  <Route path="coupons" element={<Coupons />} />
                  <Route path="settings" element={<div>Cài đặt hệ thống</div>} />
                </Route>
                
                {/* Regular routes with header and footer */}
                <Route path="/*" element={
                  <>
                    <Header />
                    <main style={{ flexGrow: 1 }}>
                      <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<Home />} />
                        <Route path="/products" element={<ProductsPage />} />
                        <Route path="/product/:id" element={<ProductDetail />} />
                        <Route path="/category/:slug" element={<CategoryPage />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        
                        {/* Protected routes */}
                        <Route 
                          path="/cart" 
                          element={
                            <ProtectedRoute>
                              <CartPage />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/checkout" 
                          element={
                            <ProtectedRoute>
                              <CheckoutPage />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/build-pc" 
                          element={
                            <ProtectedRoute>
                              <div>Build PC Page</div>
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/profile" 
                          element={
                            <ProtectedRoute>
                              <Profile />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/orders" 
                          element={
                            <ProtectedRoute>
                              <Orders />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/orders/:id" 
                          element={
                            <ProtectedRoute>
                              <OrderDetail />
                            </ProtectedRoute>
                          } 
                        />
                      </Routes>
                    </main>
                    <Footer />
                  </>
                } />
              </Routes>
            </div>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;