import React, { useState } from 'react';
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
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Form validation errors
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user types
    setErrors({
      ...errors,
      [name]: ''
    });
  };
  
  const validateForm = () => {
    const newErrors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
    let isValid = true;
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Tên không được để trống';
      isValid = false;
    }
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email không được để trống';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
      isValid = false;
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Mật khẩu không được để trống';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      isValid = false;
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      isValid = false;
    }
    
    setErrors(newErrors);
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
      // Extract name, email, and password for registration
      const { name, email, password } = formData;
      
      // Use register function from auth context
      await register({ name, email, password });
      
      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Đăng ký thành công. Vui lòng đăng nhập.' 
          } 
        });
      }, 2000);
      
    } catch (err) {
      console.error('Registration error:', err);
      setError(
        err.response?.data?.message || 
        'Đăng ký thất bại. Vui lòng thử lại sau.'
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
            Đăng ký
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Tạo tài khoản để mua sắm dễ dàng hơn
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Họ tên"
              name="name"
              autoComplete="name"
              autoFocus
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              disabled={loading || success}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              disabled={loading || success}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Mật khẩu"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              disabled={loading || success}
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
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              disabled={loading || success}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading || success}
            >
              {loading ? <CircularProgress size={24} /> : 'Đăng ký'}
            </Button>
          </Box>
          
          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Hoặc
            </Typography>
          </Divider>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              Đã có tài khoản?{' '}
              <Link component={RouterLink} to="/login" variant="body2" fontWeight="bold">
                Đăng nhập
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register; 