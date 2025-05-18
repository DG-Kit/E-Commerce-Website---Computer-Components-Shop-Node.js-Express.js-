import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
  Alert,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tab,
  Tabs,
  Button,
} from '@mui/material';
import {
  ShoppingBag as ProductsIcon,
  Receipt as OrdersIcon,
  People as UsersIcon,
  AttachMoney as RevenueIcon,
  TrendingUp as TrendingUpIcon,
  MoreVert as MoreIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { adminApi } from '../../services/api';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  RadialLinearScale 
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  RadialLinearScale
);

// Helper component for Sparkline Chart
const SparklineChart = ({ data, borderColor, backgroundColor }) => {
  if (!data || data.length === 0) {
    // Render a placeholder or empty state if data is not available
    return <Box sx={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography variant="caption" color="textSecondary">No data</Typography></Box>;
  }

  const chartData = {
    labels: data.map((_, i) => `DataPoint ${i + 1}`), // Generic labels
    datasets: [{
      data: data,
      borderColor: borderColor || '#3b82f6',
      backgroundColor: backgroundColor || 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 0,
      fill: true,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: { display: false }
    },
    elements: { point: { radius: 0 } },
    animation: false, // Optional: disable animation for sparklines
  };

  return (
    <Box sx={{ height: 60 }}>
      <Line data={chartData} options={options} />
    </Box>
  );
};

// Helper component for Percentage Change Chip
const PercentageChangeChip = ({ value }) => {
  if (typeof value !== 'number') {
    return <Chip label="N/A" size="small" sx={{ mr: 1, fontSize: '0.75rem' }} />;
  }

  const isPositive = value >= 0;
  const chipLabel = `${isPositive ? '+' : ''}${value.toFixed(2)}%`;
  
  return (
    <Chip 
      label={chipLabel} 
      size="small" 
      sx={{ 
        bgcolor: isPositive ? '#ECFDF5' : '#FEF2F2', 
        color: isPositive ? '#10b981' : '#ef4444', 
        fontWeight: 500,
        fontSize: '0.75rem',
        mr: 1
      }}
    />
  );
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    products: 0,
    orders: {
      total: 0,
      pending: 0,
      processing: 0,
      delivered: 0,
      cancelled: 0
    },
    users: 0,
    revenue: 0,
    currentMonthRevenue: 0,
    revenueChange: null,
    revenueSparkline: [],
    currentMonthOrders: 0,
    ordersChange: null,
    ordersSparkline: []
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [timeRange, setTimeRange] = useState('week1');
  const [revenueData, setRevenueData] = useState({
    labels: [],
    datasets: []
  });
  const [ordersData, setOrdersData] = useState({
    labels: [],
    datasets: []
  });
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [orderStatusChartData, setOrderStatusChartData] = useState({
    labels: [],
    datasets: []
  });
  const [orderStatusLoading, setOrderStatusLoading] = useState(false);

  // Get current month and year for display
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  const currentYear = currentDate.getFullYear();
  const monthYearDisplay = `(Tháng ${currentMonth} năm ${currentYear})`;

  // Revenue chart options (line chart)
  const revenueOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND' 
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return new Intl.NumberFormat('vi-VN', { 
              style: 'currency', 
              currency: 'VND',
              notation: 'compact',
              compactDisplay: 'short'
            }).format(value);
          }
        }
      }
    }
  };

  // Orders chart options (bar chart)
  const ordersOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y + ' đơn';
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  // Order status chart data
  const orderStatusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const dataset = context.dataset;
            const total = dataset.data.reduce((acc, data) => acc + data, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} đơn (${percentage}%)`;
          }
        }
      },
      title: {
        display: true,
        text: 'Phân bố trạng thái đơn hàng',
        position: 'top',
        padding: {
          top: 10,
          bottom: 20
        },
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    cutout: '65%',
    animation: {
      animateScale: true,
      animateRotate: true
    }
  };

  // Fetch order status data for chart
  const fetchOrderStatusData = async () => {
    try {
      setOrderStatusLoading(true);
      
      // Use the existing stats or fetch dedicated data from API
      const response = await adminApi.getAllOrders({ limit: 1000 });
      
      if (response.data?.data?.orders) {
        const orders = response.data.data.orders;
        
        // Count orders by status
        const statusCounts = {};
        orders.forEach(order => {
          const status = order.status;
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        // Prepare chart data
        setOrderStatusChartData({
          labels: ['Chờ xác nhận', 'Đang xử lý', 'Đã giao hàng', 'Đã hủy'],
          datasets: [
            {
              label: 'Số đơn hàng',
              data: [
                statusCounts['PENDING'] || 0,
                statusCounts['PROCESSING'] || 0,
                statusCounts['DELIVERED'] || 0,
                statusCounts['CANCELLED'] || 0
              ],
              backgroundColor: [
                '#f59e0b', // amber for pending
                '#3b82f6', // blue for processing
                '#10b981', // green for delivered
                '#ef4444', // red for cancelled
              ],
              borderColor: [
                '#fff',
                '#fff',
                '#fff',
                '#fff',
              ],
              borderWidth: 2,
            },
          ],
        });
      } else {
        // Fallback to using stats if API doesn't return expected data
        setOrderStatusChartData({
    labels: ['Chờ xác nhận', 'Đang xử lý', 'Đã giao hàng', 'Đã hủy'],
    datasets: [
      {
        label: 'Số đơn hàng',
        data: [
          stats.orders.pending, 
          stats.orders.processing, 
          stats.orders.delivered, 
          stats.orders.cancelled
        ],
        backgroundColor: [
          '#f59e0b', // amber for pending
          '#3b82f6', // blue for processing
          '#10b981', // green for delivered
          '#ef4444', // red for cancelled
        ],
        borderColor: [
          '#fff',
          '#fff',
          '#fff',
          '#fff',
        ],
        borderWidth: 2,
      },
    ],
        });
      }
    } catch (error) {
      console.error('Failed to fetch order status data:', error);
      // Set fallback data on error
      setOrderStatusChartData({
        labels: ['Chờ xác nhận', 'Đang xử lý', 'Đã giao hàng', 'Đã hủy'],
      datasets: [
        {
            label: 'Số đơn hàng',
            data: [
              stats.orders.pending, 
              stats.orders.processing, 
              stats.orders.delivered, 
              stats.orders.cancelled
            ],
          backgroundColor: [
              '#f59e0b', // amber for pending
              '#3b82f6', // blue for processing
              '#10b981', // green for delivered
              '#ef4444', // red for cancelled
          ],
          borderColor: [
              '#fff',
              '#fff',
              '#fff',
              '#fff',
            ],
            borderWidth: 2,
          },
        ],
      });
    } finally {
      setOrderStatusLoading(false);
    }
  };

  // Fetch revenue data based on time range
  const fetchRevenueData = async (range) => {
    try {
      setRevenueLoading(true);
      
      // Call the API to get revenue data for the selected time range
      const response = await adminApi.getRevenueData(range);
      
      if (response.data?.data) {
        // Set revenue data for line chart
        setRevenueData({
          labels: response.data.data.labels,
          datasets: [
            {
              label: 'Doanh thu',
              data: response.data.data.revenue,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true,
            }
          ]
        });
        
        // Set orders data for bar chart
        setOrdersData({
          labels: response.data.data.labels,
          datasets: [
            {
              label: 'Đơn hàng',
              data: response.data.data.orders,
              backgroundColor: '#10b981',
              borderColor: '#10b981',
              borderWidth: 1,
            }
          ]
        });
      } else {
        // Fallback data if API doesn't return expected format
        setDefaultChartData(range);
      }
    } catch (error) {
      console.error(`Failed to fetch revenue data for ${range}:`, error);
      // Set default data on error
      setDefaultChartData(range);
    } finally {
      setRevenueLoading(false);
    }
  };
  
  // Set default revenue data based on time range
  const setDefaultChartData = (range) => {
    let labels = [];
    let revenueValues = [];
    let orderValues = [];
    
    // Default data for different time ranges
    switch(range) {
      case 'week':
        labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
        revenueValues = [1200000, 1900000, 1500000, 2500000, 1800000, 3100000, 2000000];
        orderValues = [5, 8, 7, 12, 9, 15, 10];
        break;
      case 'month':
        labels = Array.from({ length: 30 }, (_, i) => `${i + 1}`);
        revenueValues = Array.from({ length: 30 }, () => Math.floor(Math.random() * 5000000) + 500000);
        orderValues = Array.from({ length: 30 }, () => Math.floor(Math.random() * 20) + 1);
        break;
      case 'year':
        labels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
        revenueValues = [15000000, 18000000, 22000000, 19000000, 25000000, 28000000, 30000000, 27000000, 23000000, 26000000, 29000000, 32000000];
        orderValues = [60, 72, 85, 78, 95, 110, 120, 105, 90, 100, 115, 130];
        break;
      default:
        labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
        revenueValues = [1200000, 1900000, 1500000, 2500000, 1800000, 3100000, 2000000];
        orderValues = [5, 8, 7, 12, 9, 15, 10];
    }
    
    // Set revenue data for line chart
    setRevenueData({
      labels,
      datasets: [
        {
          label: 'Doanh thu',
          data: revenueValues,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
        }
      ]
    });
    
    // Set orders data for bar chart
    setOrdersData({
      labels,
      datasets: [
        {
          label: 'Đơn hàng',
          data: orderValues,
          backgroundColor: '#10b981',
          borderColor: '#10b981',
          borderWidth: 1,
        }
      ]
    });
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Log auth token for debugging
      console.log("Auth Token:", localStorage.getItem('token'));
      
      // Fetch all dashboard data in parallel
      const [statsRes, ordersRes] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getRecentOrders(5)
      ]);
      
      if (statsRes.data?.data) {
        setStats(statsRes.data.data);
      }
      
      if (ordersRes.data?.data) {
        setRecentOrders(ordersRes.data.data);
      }
      
      // Fetch revenue data for the current time range
      await fetchRevenueData(timeRange);

      // Fetch order status data for chart
      await fetchOrderStatusData();
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      console.error("Error details:", error.response || error.message || error);
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  // Add authentication check
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn("No authentication token found in localStorage");
      setError("Bạn chưa đăng nhập. Vui lòng đăng nhập để xem dữ liệu.");
    } else {
      console.log("Auth token found:", token.substring(0, 15) + "...");
    }
  }, []);
  
  // Update revenue data when time range changes
  useEffect(() => {
    fetchRevenueData(timeRange);
  }, [timeRange]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Get status styles
  const getStatusStyle = (status) => {
    const styles = {
      pending: { color: '#f59e0b', bgColor: '#FFFBEB', label: 'Chờ xác nhận' },
      processing: { color: '#3b82f6', bgColor: '#EFF6FF', label: 'Đang xử lý' },
      delivered: { color: '#10b981', bgColor: '#ECFDF5', label: 'Đã giao hàng' },
      cancelled: { color: '#ef4444', bgColor: '#FEF2F2', label: 'Đã hủy' }
    };
    
    return styles[status] || { color: 'text.secondary', bgColor: '#F9FAFB', label: status };
  };

  const handleTimeRangeChange = (event, newValue) => {
    setTimeRange(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1" fontWeight={600}>
          Tổng quan
        </Typography>
        <IconButton aria-label="refresh" onClick={fetchDashboardData}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Left Column with two metric cards */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={3} direction="column">
            {/* Revenue/Profit Card */}
            <Grid item xs={12}>
              <Card
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 2,
                  boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6" fontWeight={600} color="text.primary">
                    Doanh thu tháng
                  </Typography>
                  <IconButton size="small">
                    <MoreIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Tổng doanh thu đã đạt được
                </Typography>
                <Typography variant="h3" component="div" fontWeight="bold" sx={{ mb: 1 }}>
                  {formatCurrency(stats.currentMonthRevenue || stats.revenue || 0)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <PercentageChangeChip value={stats.revenueChange} />
                  <Typography variant="body2" color="text.secondary">so với tháng trước</Typography>
                </Box>
                <SparklineChart 
                  data={stats.revenueSparkline} 
                  borderColor="#3b82f6" 
                  backgroundColor="rgba(59, 130, 246, 0.1)" 
                />
              </Card>
            </Grid>

            {/* Orders per visitor Card */}
            <Grid item xs={12}>
              <Card
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 2,
                  boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6" fontWeight={600} color="text.primary">
                    Số đơn đặt hàng
                  </Typography>
                  <IconButton size="small">
                    <MoreIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Số lượng đơn hàng đã tạo
                </Typography>
                <Typography variant="h3" component="div" fontWeight="bold" sx={{ mb: 1 }}>
                  {stats.currentMonthOrders || stats.orders?.total || 0}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <PercentageChangeChip value={stats.ordersChange} />
                  <Typography variant="body2" color="text.secondary">so với tháng trước</Typography>
                </Box>
                <SparklineChart 
                  data={stats.ordersSparkline} 
                  borderColor="#10b981" 
                  backgroundColor="rgba(16, 185, 129, 0.1)"
                />
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Order Status Chart - Right Column */}
        <Grid item xs={12} md={6}>
          <Card 
            variant="outlined" 
            sx={{ 
              borderRadius: 2, 
              boxShadow: '0px 2px 8px rgba(0,0,0,0.05)', 
              p: 3,
              height: '100%', // Set to 100% height of the parent Grid
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Trạng thái đơn hàng
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Phân bố trạng thái của các đơn hàng hiện tại
                </Typography>
              </Box>
              <Button 
                size="small" 
                startIcon={<RefreshIcon />} 
                onClick={fetchOrderStatusData}
                disabled={orderStatusLoading}
                sx={{ borderRadius: 2 }}
              >
                Làm mới
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                position: 'relative',
                flexGrow: 1,
              }}
            >
              {orderStatusLoading ? (
                <Box sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.7)' 
                }}>
                  <CircularProgress size={40} />
                </Box>
              ) : null}
              <Grid container spacing={2}>
                <Grid item xs={12} md={7}>
                  <Box sx={{ height: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Doughnut 
                      data={orderStatusChartData} 
                      options={orderStatusOptions}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                      Chi tiết đơn hàng
                    </Typography>
                    <List dense disablePadding>
                      <ListItem sx={{ py: 1, px: 0 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f59e0b', mr: 1.5 }} />
                        <ListItemText 
                          primary="Chờ xác nhận" 
                          secondary={`${orderStatusChartData.datasets?.[0]?.data?.[0] || 0} đơn`} 
                          primaryTypographyProps={{ 
                            variant: 'body2',
                            fontWeight: 500,
                          }}
                          secondaryTypographyProps={{ variant: 'body1', fontWeight: 'bold' }}
                        />
                      </ListItem>
                      <ListItem sx={{ py: 1, px: 0 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#3b82f6', mr: 1.5 }} />
                        <ListItemText 
                          primary="Đang xử lý" 
                          secondary={`${orderStatusChartData.datasets?.[0]?.data?.[1] || 0} đơn`}
                          primaryTypographyProps={{ 
                            variant: 'body2',
                            fontWeight: 500,
                          }}
                          secondaryTypographyProps={{ variant: 'body1', fontWeight: 'bold' }}
                        />
                      </ListItem>
                      <ListItem sx={{ py: 1, px: 0 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#10b981', mr: 1.5 }} />
                        <ListItemText 
                          primary="Đã giao hàng" 
                          secondary={`${orderStatusChartData.datasets?.[0]?.data?.[2] || 0} đơn`}
                          primaryTypographyProps={{ 
                            variant: 'body2',
                            fontWeight: 500,
                          }}
                          secondaryTypographyProps={{ variant: 'body1', fontWeight: 'bold' }}
                        />
                      </ListItem>
                      <ListItem sx={{ py: 1, px: 0 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ef4444', mr: 1.5 }} />
                        <ListItemText 
                          primary="Đã hủy" 
                          secondary={`${orderStatusChartData.datasets?.[0]?.data?.[3] || 0} đơn`}
                          primaryTypographyProps={{ 
                            variant: 'body2',
                            fontWeight: 500,
                          }}
                          secondaryTypographyProps={{ variant: 'body1', fontWeight: 'bold' }}
                        />
                      </ListItem>
                      <Divider sx={{ my: 1.5 }} />
                      <ListItem sx={{ py: 1, px: 0 }}>
                        <ListItemText 
                          primary="Tổng số đơn hàng" 
                          secondary={`${orderStatusChartData.datasets?.[0]?.data?.reduce((a, b) => a + b, 0) || 0} đơn`}
                          primaryTypographyProps={{ 
                            variant: 'body2',
                            fontWeight: 500,
                          }}
                          secondaryTypographyProps={{ 
                            variant: 'h6', 
                            fontWeight: 'bold',
                            color: 'primary'
                          }}
                        />
                      </ListItem>
                    </List>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Time Range Selector FOR WEEKLY CHARTS */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2, mt: 4 }}>
        <Typography variant="h6" fontWeight={500} sx={{ mr: 1, alignSelf: 'center' }}>
          Chọn tuần trong tháng:
        </Typography>
        <Typography variant="h6" fontWeight={400} sx={{ mr: 2, alignSelf: 'center', color: 'text.secondary' }}>
          {monthYearDisplay}
        </Typography>
        <Tabs
          value={timeRange} // This will be 'week1', 'week2', etc.
          onChange={handleTimeRangeChange}
          textColor="primary"
          indicatorColor="primary"
          size="small"
        >
          <Tab value="week1" label="Tuần 1" />
          <Tab value="week2" label="Tuần 2" />
          <Tab value="week3" label="Tuần 3" />
          <Tab value="week4" label="Tuần 4" />
        </Tabs>
      </Box>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={3} direction="column">
            {/* Revenue Chart - Line Chart */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: '0px 2px 8px rgba(0,0,0,0.05)', p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Doanh thu trong tuần
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ height: 300, p: 1, position: 'relative' }}>
                  {revenueLoading ? (
                    <Box sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      right: 0, 
                      bottom: 0, 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      backgroundColor: 'rgba(255,255,255,0.7)' 
                    }}>
                      <CircularProgress size={40} />
                    </Box>
                  ) : null}
                  <Line
                    data={revenueData}
                    options={revenueOptions}
                  />
                </Box>
              </Card>
            </Grid>

            {/* Orders Chart - Bar Chart */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: '0px 2px 8px rgba(0,0,0,0.05)', p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Đơn hàng trong tuần
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ height: 300, p: 1, position: 'relative' }}>
                  {revenueLoading ? (
                    <Box sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      right: 0, 
                      bottom: 0, 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      backgroundColor: 'rgba(255,255,255,0.7)' 
                    }}>
                      <CircularProgress size={40} />
                    </Box>
                  ) : null}
                  <Bar
                    data={ordersData}
                    options={ordersOptions}
                  />
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Recent Orders */}
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: '0px 2px 8px rgba(0,0,0,0.05)' }}>
            <CardHeader 
              title="Đơn hàng gần đây" 
              titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
              action={
                <IconButton aria-label="more options" size="small">
                  <MoreIcon />
                </IconButton>
              }
              sx={{ pb: 0 }}
            />
            <Divider sx={{ mx: 2, mt: 2 }} />
            <CardContent sx={{ p: 0 }}>
              {recentOrders && recentOrders.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Mã đơn</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Khách hàng</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Trạng thái</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: '#6B7280' }}>Giá trị</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentOrders.map((order) => {
                        const statusStyle = getStatusStyle(order.status);
                        return (
                          <TableRow 
                            key={order.id} 
                            hover
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                          >
                            <TableCell>{order.orderNumber || order.id}</TableCell>
                            <TableCell>{order.customer}</TableCell>
                            <TableCell>
                              <Chip 
                                label={statusStyle.label} 
                                sx={{ 
                                  backgroundColor: statusStyle.bgColor,
                                  color: statusStyle.color,
                                  fontWeight: 500,
                                  fontSize: '0.75rem',
                                  borderRadius: 1
                                }}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={600} color="primary">
                                {formatCurrency(order.amount)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Không có đơn hàng gần đây
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default Dashboard; 