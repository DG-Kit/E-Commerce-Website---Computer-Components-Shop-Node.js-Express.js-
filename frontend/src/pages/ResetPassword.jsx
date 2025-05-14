import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Link
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { authApi } from '../services/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Extract token from URL query params
    const query = new URLSearchParams(location.search);
    const tokenFromUrl = query.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError('Không tìm thấy token đặt lại mật khẩu. Vui lòng thử lại từ đầu.');
    }
  }, [location]);

  const validateForm = () => {
    if (!newPassword) {
      setError('Vui lòng nhập mật khẩu mới');
      return false;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword(token, newPassword);
      setSuccess('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới.');
      // Clear form fields after successful reset
      setNewPassword('');
      setConfirmPassword('');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Reset password error:', err);
      setError(
        err.response?.data?.msg || 
        'Có lỗi xảy ra khi đặt lại mật khẩu. Token có thể đã hết hạn hoặc không hợp lệ.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 8, md: 12 } }}>
      <Paper elevation={2} sx={{ p: { xs: 3, md: 5 }, borderRadius: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h5" fontWeight={600} gutterBottom>
            Đặt lại mật khẩu
          </Typography>

          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Nhập mật khẩu mới để hoàn tất quá trình đặt lại mật khẩu.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="newPassword"
              label="Mật khẩu mới"
              type="password"
              id="newPassword"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading || success}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading || success}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.2 }}
              disabled={loading || success || !token}
            >
              {loading ? <CircularProgress size={24} /> : 'Đặt lại mật khẩu'}
            </Button>
          </Box>

          <Box mt={3} display="flex" justifyContent="center">
            <Link component={RouterLink} to="/login" variant="body2">
              Quay lại đăng nhập
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ResetPassword; 