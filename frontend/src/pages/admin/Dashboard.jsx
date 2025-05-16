import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import {
  People as PeopleIcon,
  Inventory as ProductsIcon,
  ShoppingCart as OrdersIcon,
  AttachMoney as RevenueIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    orders: 0,
    revenue: 0,
    recentOrders: [],
    topProducts: [],
    conversionRate: 0,
    monthlyRevenue: []
  });

  useEffect(() => {
    // In a real app, you would fetch these stats from an API
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Sample data
        setStats({
          users: 287,
          products: 152,
          orders: 83,
          revenue: 258000000,
          recentOrders: [
            { id: 'ORD-1234', customer: 'Nguyễn Văn A', amount: 12500000, status: 'Đã giao hàng', date: '15/06/2023' },
            { id: 'ORD-1235', customer: 'Trần Thị B', amount: 8700000, status: 'Đang xử lý', date: '14/06/2023' },
            { id: 'ORD-1236', customer: 'Phạm Văn C', amount: 4250000, status: 'Chờ xác nhận', date: '14/06/2023' },
            { id: 'ORD-1237', customer: 'Lê Thị D', amount: 16900000, status: 'Đang giao hàng', date: '13/06/2023' },
            { id: 'ORD-1238', customer: 'Hoàng Văn E', amount: 7500000, status: 'Đã hủy', date: '12/06/2023' },
          ],
          topProducts: [
            { id: 1, name: 'CPU Intel Core i9-12900K', sales: 25, inventory: 12 },
            { id: 2, name: 'VGA NVIDIA RTX 4090 Ti', sales: 18, inventory: 5 },
            { id: 3, name: 'RAM Corsair Vengeance 32GB DDR5', sales: 42, inventory: 23 },
            { id: 4, name: 'SSD Samsung 2TB NVMe', sales: 37, inventory: 15 },
            { id: 5, name: 'Mainboard ASUS ROG Z690', sales: 21, inventory: 9 },
          ],
          conversionRate: 12.3,
          monthlyRevenue: [
            { month: 'Tháng 1', revenue: 150000000 },
            { month: 'Tháng 2', revenue: 180000000 },
            { month: 'Tháng 3', revenue: 210000000 },
            { month: 'Tháng 4', revenue: 195000000 },
            { month: 'Tháng 5', revenue: 230000000 },
            { month: 'Tháng 6', revenue: 258000000 },
          ]
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format price in VND
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={600}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Xin chào, {currentUser?.fullName || 'Admin'}! Đây là tổng quan hệ thống.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={1} sx={{ borderRadius: 2, height: '100%' }}>
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  borderRadius: '50%',
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  mr: 2
                }}
              >
                <PeopleIcon fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Tổng người dùng
                </Typography>
                <Typography variant="h5" fontWeight={600}>
                  {stats.users}
                </Typography>
              </Box>
            </Box>
            <Divider />
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <TrendingUpIcon color="success" sx={{ mr: 1 }} fontSize="small" />
              <Typography variant="body2" color="success.main">
                +5% so với tháng trước
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={1} sx={{ borderRadius: 2, height: '100%' }}>
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  borderRadius: '50%',
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'info.light',
                  color: 'info.main',
                  mr: 2
                }}
              >
                <ProductsIcon fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Sản phẩm
                </Typography>
                <Typography variant="h5" fontWeight={600}>
                  {stats.products}
                </Typography>
              </Box>
            </Box>
            <Divider />
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <TrendingUpIcon color="success" sx={{ mr: 1 }} fontSize="small" />
              <Typography variant="body2" color="success.main">
                +12% so với tháng trước
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={1} sx={{ borderRadius: 2, height: '100%' }}>
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  borderRadius: '50%',
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'warning.light',
                  color: 'warning.main',
                  mr: 2
                }}
              >
                <OrdersIcon fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Đơn hàng tháng này
                </Typography>
                <Typography variant="h5" fontWeight={600}>
                  {stats.orders}
                </Typography>
              </Box>
            </Box>
            <Divider />
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <TrendingUpIcon color="success" sx={{ mr: 1 }} fontSize="small" />
              <Typography variant="body2" color="success.main">
                +8% so với tháng trước
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={1} sx={{ borderRadius: 2, height: '100%' }}>
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  borderRadius: '50%',
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'success.light',
                  color: 'success.main',
                  mr: 2
                }}
              >
                <RevenueIcon fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Doanh thu tháng này
                </Typography>
                <Typography variant="h5" fontWeight={600}>
                  {formatPrice(stats.revenue)}
                </Typography>
              </Box>
            </Box>
            <Divider />
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <TrendingUpIcon color="success" sx={{ mr: 1 }} fontSize="small" />
              <Typography variant="body2" color="success.main">
                +12% so với tháng trước
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Recent Orders */}
        <Grid item xs={12} md={8}>
          <Paper elevation={1} sx={{ borderRadius: 2 }}>
            <CardHeader 
              title="Đơn hàng gần đây" 
              action={
                <Button color="primary" size="small">Xem tất cả</Button>
              }
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <List sx={{ width: '100%' }}>
                {stats.recentOrders.map((order, index) => (
                  <React.Fragment key={order.id}>
                    <ListItem 
                      alignItems="flex-start"
                      secondaryAction={
                        <Button size="small" variant="outlined">Chi tiết</Button>
                      }
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="subtitle1" component="span" fontWeight={500}>
                                {order.id}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 2 }}>
                                {order.date}
                              </Typography>
                            </Box>
                            <Typography 
                              variant="subtitle2" 
                              component="span" 
                              sx={{ fontWeight: 600, color: 'primary.main' }}
                            >
                              {formatPrice(order.amount)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Typography variant="body2" color="text.primary">
                              {order.customer}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              component="span"
                              sx={{ 
                                color: 
                                  order.status === 'Đã giao hàng' ? 'success.main' :
                                  order.status === 'Đã hủy' ? 'error.main' :
                                  order.status === 'Đang xử lý' ? 'info.main' :
                                  order.status === 'Đang giao hàng' ? 'info.main' :
                                  'warning.main'
                              }}
                            >
                              {order.status}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < stats.recentOrders.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Paper>
        </Grid>

        {/* Top Products */}
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ borderRadius: 2 }}>
            <CardHeader 
              title="Sản phẩm bán chạy" 
              action={
                <Button color="primary" size="small">Xem tất cả</Button>
              }
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <List sx={{ width: '100%' }}>
                {stats.topProducts.map((product, index) => (
                  <React.Fragment key={product.id}>
                    <ListItem>
                      <ListItemText
                        primary={product.name}
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">
                                Đã bán: {product.sales}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Tồn kho: {product.inventory}
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={(product.sales / 50) * 100} 
                              sx={{ mt: 1, height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < stats.topProducts.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 