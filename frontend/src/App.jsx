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
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
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
              <Routes>
                {/* Admin Routes */}
                <Route 
                  path="/admin/*"
                  element={
                    <AdminRoute>
                      <AdminLayout>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/users" element={<div>Users Management</div>} />
                          <Route path="/products" element={<div>Products Management</div>} />
                          <Route path="/categories" element={<div>Categories Management</div>} />
                          <Route path="/orders" element={<div>Orders Management</div>} />
                          <Route path="/coupons" element={<div>Coupons Management</div>} />
                          <Route path="/settings" element={<div>Settings</div>} />
                        </Routes>
                      </AdminLayout>
                    </AdminRoute>
                  }
                />
              
                {/* Public routes */}
                <Route path="/" element={
                  <>
                    <Header />
                    <main style={{ flexGrow: 1 }}>
                      <Home />
                    </main>
                    <Footer />
                  </>
                } />
                
                <Route path="/products" element={
                  <>
                    <Header />
                    <main style={{ flexGrow: 1 }}>
                      <ProductsPage />
                    </main>
                    <Footer />
                  </>
                } />
                
                <Route path="/product/:id" element={
                  <>
                    <Header />
                    <main style={{ flexGrow: 1 }}>
                      <ProductDetail />
                    </main>
                    <Footer />
                  </>
                } />
                
                <Route path="/category/:slug" element={
                  <>
                    <Header />
                    <main style={{ flexGrow: 1 }}>
                      <CategoryPage />
                    </main>
                    <Footer />
                  </>
                } />
                
                <Route path="/login" element={
                  <>
                    <Header />
                    <main style={{ flexGrow: 1 }}>
                      <Login />
                    </main>
                    <Footer />
                  </>
                } />
                
                <Route path="/register" element={
                  <>
                    <Header />
                    <main style={{ flexGrow: 1 }}>
                      <Register />
                    </main>
                    <Footer />
                  </>
                } />
                
                <Route path="/forgot-password" element={
                  <>
                    <Header />
                    <main style={{ flexGrow: 1 }}>
                      <ForgotPassword />
                    </main>
                    <Footer />
                  </>
                } />
                
                <Route path="/reset-password" element={
                  <>
                    <Header />
                    <main style={{ flexGrow: 1 }}>
                      <ResetPassword />
                    </main>
                    <Footer />
                  </>
                } />
                
                {/* Protected routes */}
                <Route path="/cart" element={
                  <ProtectedRoute>
                    <Header />
                    <main style={{ flexGrow: 1 }}>
                      <CartPage />
                    </main>
                    <Footer />
                  </ProtectedRoute>
                } />
                
                <Route path="/checkout" element={
                  <ProtectedRoute>
                    <Header />
                    <main style={{ flexGrow: 1 }}>
                      <CheckoutPage />
                    </main>
                    <Footer />
                  </ProtectedRoute>
                } />
                
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Header />
                    <main style={{ flexGrow: 1 }}>
                      <Profile />
                    </main>
                    <Footer />
                  </ProtectedRoute>
                } />
                
                <Route path="/orders" element={
                  <ProtectedRoute>
                    <Header />
                    <main style={{ flexGrow: 1 }}>
                      <Orders />
                    </main>
                    <Footer />
                  </ProtectedRoute>
                } />
                
                <Route path="/orders/:id" element={
                  <ProtectedRoute>
                    <Header />
                    <main style={{ flexGrow: 1 }}>
                      <OrderDetail />
                    </main>
                    <Footer />
                  </ProtectedRoute>
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