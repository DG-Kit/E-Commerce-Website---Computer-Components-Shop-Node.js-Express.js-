import React, { useState, useEffect } from 'react';
import { 
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link,
  Divider,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');
  
  // Get auth context
  const { login } = useAuth();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form validation
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Clear location state after reading the message
  useEffect(() => {
    if (location.state?.message) {
      // Clear the message from location state
      window.history.replaceState({}, document.title);
    }
  }, [location]);
  
  const validateForm = () => {
    let isValid = true;
    
    // Email validation
    if (!email) {
      setEmailError('Email không được để trống');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email không hợp lệ');
      isValid = false;
    } else {
      setEmailError('');
    }
    
    // Password validation
    if (!password) {
      setPasswordError('Mật khẩu không được để trống');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Mật khẩu phải có ít nhất 6 ký tự');
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    return isValid;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Use login function from auth context
      await login({ email, password });
      
      // Redirect to previous page or home
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message || 
        'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập của bạn.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 8
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2
          }}
        >
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Đăng nhập
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Vui lòng đăng nhập để tiếp tục
          </Typography>
          
          {successMessage && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {successMessage}
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!emailError}
              helperText={emailError}
              disabled={loading}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Mật khẩu"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!passwordError}
              helperText={passwordError}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Đăng nhập'}
            </Button>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Link component={RouterLink} to="/forgot-password" variant="body2">
                Quên mật khẩu?
              </Link>
            </Box>
          </Box>
          
          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Hoặc
            </Typography>
          </Divider>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              Chưa có tài khoản?{' '}
              <Link component={RouterLink} to="/register" variant="body2" fontWeight="bold">
                Đăng ký ngay
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 