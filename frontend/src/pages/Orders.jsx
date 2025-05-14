import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';
import { ShoppingBag as OrderIcon, ArrowForward as ArrowIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

// Sample order status colors
const statusColors = {
  'pending': 'warning',
  'processing': 'info',
  'shipped': 'primary',
  'delivered': 'success',
  'cancelled': 'error'
};

// Sample order data for demonstration
const sampleOrders = [
  {
    id: 'ORD-1001',
    date: '2023-06-15',
    status: 'delivered',
    total: 12500000,
    items: [
      { id: 1, name: 'CPU Intel Core i5-12400F', price: 4500000, quantity: 1 },
      { id: 2, name: 'RAM Corsair Vengeance 16GB', price: 1800000, quantity: 2 }
    ]
  },
  {
    id: 'ORD-1002',
    date: '2023-07-20',
    status: 'processing',
    total: 27800000,
    items: [
      { id: 3, name: 'VGA NVIDIA RTX 3070', price: 16000000, quantity: 1 },
      { id: 4, name: 'SSD Samsung 1TB', price: 2800000, quantity: 1 },
      { id: 5, name: 'Mainboard Gigabyte Z690', price: 9000000, quantity: 1 }
    ]
  }
];

const Orders = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // In a real app, you would fetch orders from your API
        // For now, we'll use the sample data after a delay to simulate an API call
        await new Promise(resolve => setTimeout(resolve, 800));
        setOrders(sampleOrders);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError('Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchOrders();
    }
  }, [currentUser]);

  // Format price in VND
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  if (authLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography variant="h4" component="h1" fontWeight={600} sx={{ mb: 4 }}>
        Đơn hàng của tôi
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {orders.length === 0 ? (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <OrderIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Bạn chưa có đơn hàng nào
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Khám phá các sản phẩm và bắt đầu mua sắm ngay!
          </Typography>
          <Button 
            variant="contained" 
            component={Link} 
            to="/products"
            endIcon={<ArrowIcon />}
          >
            Xem sản phẩm
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {orders.map((order) => (
            <Grid item xs={12} key={order.id}>
              <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Đơn hàng #{order.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ngày đặt: {formatDate(order.date)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip 
                      label={order.status === 'pending' ? 'Chờ xác nhận' :
                             order.status === 'processing' ? 'Đang xử lý' :
                             order.status === 'shipped' ? 'Đang giao hàng' :
                             order.status === 'delivered' ? 'Đã giao hàng' :
                             'Đã hủy'}
                      color={statusColors[order.status]}
                      size="small"
                    />
                    <Typography variant="subtitle1" fontWeight={600}>
                      {formatPrice(order.total)}
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <List disablePadding>
                  {order.items.map((item) => (
                    <ListItem 
                      key={item.id} 
                      disableGutters 
                      sx={{ 
                        py: 1,
                        borderBottom: '1px solid #f0f0f0',
                        '&:last-child': { border: 'none' }
                      }}
                    >
                      <ListItemText
                        primary={item.name}
                        secondary={`${item.quantity} x ${formatPrice(item.price)}`}
                      />
                      <Typography variant="body2" fontWeight={500}>
                        {formatPrice(item.price * item.quantity)}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button 
                    variant="outlined" 
                    component={Link} 
                    to={`/order/${order.id}`}
                  >
                    Chi tiết
                  </Button>
                  <Button 
                    variant="contained" 
                    color={order.status === 'delivered' ? 'success' : 'primary'}
                    disabled={order.status === 'cancelled'}
                  >
                    {order.status === 'delivered' ? 'Mua lại' : 'Theo dõi đơn hàng'}
                  </Button>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Orders; 