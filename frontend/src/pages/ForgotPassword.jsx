import React, { useState } from 'react';
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

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate email
    if (!email) {
      setError('Vui lòng nhập địa chỉ email');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Địa chỉ email không hợp lệ');
      return;
    }

    setLoading(true);

    try {
      await authApi.forgotPassword(email);
      setEmailSent(true);
      setSuccess('Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.');
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(
        err.response?.data?.msg || 
        'Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại sau.'
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
            Quên mật khẩu
          </Typography>

          {!emailSent ? (
            <>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                Nhập địa chỉ email của bạn, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu qua email.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Địa chỉ email"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, py: 1.2 }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Gửi yêu cầu'}
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Alert severity="success" sx={{ width: '100%', mb: 3 }}>
                {success}
              </Alert>
              <Typography variant="body2" color="text.secondary" paragraph>
                Vui lòng kiểm tra hộp thư đến của bạn và làm theo hướng dẫn để đặt lại mật khẩu.
                Nếu bạn không nhận được email trong vòng vài phút, hãy kiểm tra thư mục spam hoặc thử lại.
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                sx={{ mt: 2 }}
              >
                Thử lại với email khác
              </Button>
            </>
          )}

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

export default ForgotPassword; 