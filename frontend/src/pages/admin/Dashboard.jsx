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
  Checkbox,
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
    revenue: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [timeRange, setTimeRange] = useState('week');
  const [revenueData, setRevenueData] = useState({
    labels: [],
    datasets: []
  });
  const [ordersData, setOrdersData] = useState({
    labels: [],
    datasets: []
  });
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [bestSellerTimeFrame, setBestSellerTimeFrame] = useState('all');

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
  const orderStatusData = {
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
  };

  const orderStatusOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
    },
    cutout: '60%',
  };

  // Best selling products chart data
  const prepareBestSellerChartData = () => {
    if (!bestSellers || bestSellers.length === 0) return null;
    
    // Sort products by sold count in descending order
    const sortedProducts = [...bestSellers].sort((a, b) => b.sold - a.sold);
    const top5Products = sortedProducts.slice(0, 5); // Take top 5
    
    return {
      labels: top5Products.map(p => p.name),
      datasets: [
        {
          label: 'Đã bán',
          data: top5Products.map(p => p.sold),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)', // Blue
            'rgba(59, 130, 246, 0.7)',
            'rgba(59, 130, 246, 0.6)',
            'rgba(59, 130, 246, 0.5)',
            'rgba(59, 130, 246, 0.4)',
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(59, 130, 246, 1)',
          ],
          borderWidth: 1,
        }
      ]
    };
  };

  const bestSellerChartOptions = {
    indexAxis: 'y', // Horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Số lượng đã bán'
        },
        ticks: {
          precision: 0
        }
      }
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
      const [statsRes, ordersRes, productsRes] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getRecentOrders(5),
        adminApi.getBestSellingProducts(5, bestSellerTimeFrame)
      ]);
      
      if (statsRes.data?.data) {
        setStats(statsRes.data.data);
      }
      
      if (ordersRes.data?.data) {
        setRecentOrders(ordersRes.data.data);
      }
      
      console.log("Best sellers API response:", productsRes);
      
      if (productsRes.data?.data && productsRes.data.data.length > 0) {
        setBestSellers(productsRes.data.data);
      } else {
        // If no data from API, use test data
        console.log("Using test data for best sellers");
        setBestSellers([
          {
            id: "1",
            name: "AMD Ryzen 5 5600X",
            image: "https://m.media-amazon.com/images/I/61vGQNUEsGL._AC_SL1384_.jpg",
            sold: 356,
            margin: 1500000,
            profitMargin: 28,
            orderCount: 219,
            category: { name: "CPU" },
            stockStatus: "In Stock",
            vendors: [
              { name: "AMD", avatar: "https://ui-avatars.com/api/?name=AMD&background=random" },
              { name: "ASRock", avatar: "https://ui-avatars.com/api/?name=ASRock&background=random" },
              { name: "MSI", avatar: "https://ui-avatars.com/api/?name=MSI&background=random" }
            ]
          },
          {
            id: "2",
            name: "NVIDIA GeForce RTX 3080",
            image: "https://m.media-amazon.com/images/I/61wbV8oqAbL._AC_SL1500_.jpg",
            sold: 289,
            margin: 3200000,
            profitMargin: 35,
            orderCount: 184,
            category: { name: "GPU" },
            stockStatus: "Low Stock",
            vendors: [
              { name: "NVIDIA", avatar: "https://ui-avatars.com/api/?name=NVIDIA&background=random" },
              { name: "ASUS", avatar: "https://ui-avatars.com/api/?name=ASUS&background=random" },
              { name: "Gigabyte", avatar: "https://ui-avatars.com/api/?name=Gigabyte&background=random" },
              { name: "MSI", avatar: "https://ui-avatars.com/api/?name=MSI&background=random" }
            ]
          },
          {
            id: "3",
            name: "Samsung 970 EVO Plus 1TB SSD",
            image: "https://m.media-amazon.com/images/I/61TUx-15+sL._AC_SL1500_.jpg",
            sold: 412,
            margin: 850000,
            profitMargin: 42,
            orderCount: 357,
            category: { name: "Storage" },
            stockStatus: "In Stock",
            vendors: [
              { name: "Samsung", avatar: "https://ui-avatars.com/api/?name=Samsung&background=random" }
            ]
          },
          {
            id: "4", 
            name: "Corsair Vengeance RGB Pro 32GB RAM",
            image: "https://m.media-amazon.com/images/I/61GpY38PAWL._AC_SL1500_.jpg",
            sold: 267,
            margin: 750000,
            profitMargin: 25,
            orderCount: 241,
            category: { name: "Memory" },
            stockStatus: "In Stock",
            vendors: [
              { name: "Corsair", avatar: "https://ui-avatars.com/api/?name=Corsair&background=random" },
              { name: "Amazon", avatar: "https://ui-avatars.com/api/?name=Amazon&background=random" }
            ]
          },
          {
            id: "5",
            name: "ASUS ROG Strix B550-F Gaming",
            image: "https://m.media-amazon.com/images/I/81x069mwcbL._AC_SL1500_.jpg",
            sold: 187,
            margin: 980000,
            profitMargin: 32,
            orderCount: 165,
            category: { name: "Motherboard" },
            stockStatus: "Out of Stock",
            vendors: [
              { name: "ASUS", avatar: "https://ui-avatars.com/api/?name=ASUS&background=random" },
              { name: "Newegg", avatar: "https://ui-avatars.com/api/?name=Newegg&background=random" },
              { name: "BestBuy", avatar: "https://ui-avatars.com/api/?name=BestBuy&background=random" }
            ]
          }
        ]);
      }
      
      // Fetch revenue data for the current time range
      await fetchRevenueData(timeRange);
      
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

  // Add effect to refetch best sellers when time frame changes
  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getBestSellingProducts(5, bestSellerTimeFrame);
        
        if (response.data?.data && response.data.data.length > 0) {
          setBestSellers(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching best sellers:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBestSellers();
  }, [bestSellerTimeFrame]);

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

  const handleBestSellerTimeFrameChange = (event, newValue) => {
    setBestSellerTimeFrame(newValue);
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
        {/* Products */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            variant="outlined" 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column',
              height: '100%',
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            <Box 
              sx={{ 
                position: 'absolute', 
                top: -15, 
                right: -15, 
                width: 120, 
                height: 120, 
                borderRadius: '50%', 
                bgcolor: 'primary.light', 
                opacity: 0.2,
                zIndex: 0
              }} 
            />
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom fontWeight={500}>
                  Sản phẩm
                </Typography>
                <Avatar sx={{ bgcolor: '#EFF6FF', color: '#3b82f6' }}>
                  <ProductsIcon />
                </Avatar>
              </Box>
              <Typography variant="h4" component="div" fontWeight="bold">
                {stats.products}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Tổng số sản phẩm trong cửa hàng
              </Typography>
            </Box>
          </Card>
        </Grid>
        
        {/* Orders */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            variant="outlined" 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column',
              height: '100%',
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            <Box 
              sx={{ 
                position: 'absolute', 
                top: -15, 
                right: -15, 
                width: 120, 
                height: 120, 
                borderRadius: '50%', 
                bgcolor: 'warning.light', 
                opacity: 0.2,
                zIndex: 0
              }} 
            />
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom fontWeight={500}>
                  Đơn hàng
                </Typography>
                <Avatar sx={{ bgcolor: '#FFFBEB', color: '#f59e0b' }}>
                  <OrdersIcon />
                </Avatar>
              </Box>
              <Typography variant="h4" component="div" fontWeight="bold">
                {stats.orders.total}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {stats.orders.pending} chờ xác nhận, {stats.orders.processing} đang xử lý
              </Typography>
            </Box>
          </Card>
        </Grid>
        
        {/* Users */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            variant="outlined" 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column',
              height: '100%',
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            <Box 
              sx={{ 
                position: 'absolute', 
                top: -15, 
                right: -15, 
                width: 120, 
                height: 120, 
                borderRadius: '50%', 
                bgcolor: 'info.light', 
                opacity: 0.2,
                zIndex: 0
              }} 
            />
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom fontWeight={500}>
                  Người dùng
                </Typography>
                <Avatar sx={{ bgcolor: '#EFF6FF', color: '#3b82f6' }}>
                  <UsersIcon />
                </Avatar>
              </Box>
              <Typography variant="h4" component="div" fontWeight="bold">
                {stats.users}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Tổng số người dùng đã đăng ký
              </Typography>
            </Box>
          </Card>
        </Grid>
        
        {/* Revenue */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            variant="outlined" 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column',
              height: '100%',
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            <Box 
              sx={{ 
                position: 'absolute', 
                top: -15, 
                right: -15, 
                width: 120, 
                height: 120, 
                borderRadius: '50%', 
                bgcolor: 'success.light', 
                opacity: 0.2,
                zIndex: 0
              }} 
            />
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom fontWeight={500}>
                  Doanh thu
                </Typography>
                <Avatar sx={{ bgcolor: '#ECFDF5', color: '#10b981' }}>
                  <RevenueIcon />
                </Avatar>
              </Box>
              <Typography variant="h5" component="div" fontWeight="bold">
                {formatCurrency(stats.revenue)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  Theo đơn hàng đã giao
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Time Range Selector */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Tabs
          value={timeRange}
          onChange={handleTimeRangeChange}
          textColor="primary"
          indicatorColor="primary"
          size="small"
        >
          <Tab value="week" label="Tuần" />
          <Tab value="month" label="Tháng" />
          <Tab value="year" label="Năm" />
        </Tabs>
      </Box>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Revenue Chart - Line Chart */}
        <Grid item xs={12} lg={6}>
          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: '0px 2px 8px rgba(0,0,0,0.05)', p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Doanh thu
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
        <Grid item xs={12} lg={6}>
          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: '0px 2px 8px rgba(0,0,0,0.05)', p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Đơn hàng
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

        {/* Order Status Chart */}
        <Grid item xs={12} md={6} lg={4}>
          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: '0px 2px 8px rgba(0,0,0,0.05)', p: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Trạng thái đơn hàng
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Doughnut 
                data={orderStatusData} 
                options={orderStatusOptions}
              />
            </Box>
          </Card>
        </Grid>

        {/* Best Selling Products Chart */}
        <Grid item xs={12} md={6} lg={8}>
          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: '0px 2px 8px rgba(0,0,0,0.05)', p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Sản phẩm bán chạy
              </Typography>
              <Box>
                <Tabs
                  value={bestSellerTimeFrame}
                  onChange={handleBestSellerTimeFrameChange}
                  textColor="primary"
                  indicatorColor="primary"
                  size="small"
                >
                  <Tab value="all" label="Tất cả" />
                  <Tab value="month" label="Tháng" />
                  <Tab value="week" label="Tuần" />
                </Tabs>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ height: 350, overflow: 'auto' }}>
              {loading ? (
                <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <CircularProgress size={40} />
                </Box>
              ) : error ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="error">
                    {error}
                  </Typography>
                </Box>
              ) : bestSellers && bestSellers.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox 
                            disabled
                            indeterminate
                            size="small"
                            sx={{ color: 'primary.main' }}
                          />
                        </TableCell>
                        <TableCell>Sản phẩm</TableCell>
                        <TableCell>Nhà cung cấp</TableCell>
                        <TableCell>Lợi nhuận</TableCell>
                        <TableCell>Đã bán</TableCell>
                        <TableCell>Tồn kho</TableCell>
                        <TableCell padding="none" align="right"></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bestSellers.map((product, index) => (
                        <TableRow key={product.id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox 
                              size="small"
                              sx={{ color: 'primary.main' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                variant="rounded" 
                                src={product.image || "/placeholder.png"} 
                                alt={product.name}
                                sx={{ width: 40, height: 40, mr: 2, borderRadius: 1 }}
                              />
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {product.name}
                                </Typography>
                                {product.category && (
                                  <Typography variant="caption" color="text.secondary">
                                    {product.category.name}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex' }}>
                              {product.vendors && product.vendors.slice(0, 4).map((vendor, i) => (
                                <Avatar
                                  key={i}
                                  src={vendor.avatar}
                                  alt={vendor.name}
                                  sx={{ 
                                    width: 24, 
                                    height: 24, 
                                    fontSize: '0.75rem',
                                    border: '2px solid #fff',
                                    ml: i > 0 ? -0.75 : 0
                                  }}
                                />
                              ))}
                              {product.vendors && product.vendors.length > 4 && (
                                <Avatar
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    fontSize: '0.7rem',
                                    bgcolor: 'primary.light',
                                    color: 'primary.main',
                                    fontWeight: 'bold',
                                    ml: -0.75,
                                    border: '2px solid #fff'
                                  }}
                                >
                                  +{product.vendors.length - 4}
                                </Avatar>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight={500} color="#3b82f6">
                                {formatCurrency(product.margin || 0)}
                              </Typography>
                              <Typography variant="caption" color={product.profitMargin > 30 ? "success.main" : "text.secondary"}>
                                {product.profitMargin}% margin
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {product.sold?.toLocaleString()}
                              </Typography>
                              {product.orderCount && (
                                <Typography variant="caption" color="text.secondary">
                                  {product.orderCount} đơn hàng
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={product.stockStatus === 'In Stock' ? 'Còn hàng' : 
                                    product.stockStatus === 'Low Stock' ? 'Sắp hết' : 'Hết hàng'} 
                              size="small"
                              sx={{ 
                                bgcolor: product.stockStatus === 'In Stock' ? '#ECFDF5' : 
                                        product.stockStatus === 'Low Stock' ? '#FEF9C3' : '#FEF2F2',
                                color: product.stockStatus === 'In Stock' ? '#10b981' :
                                      product.stockStatus === 'Low Stock' ? '#f59e0b' : '#ef4444',
                                fontWeight: 500,
                                borderRadius: '12px',
                                fontSize: '0.7rem',
                                px: 1.5
                              }}
                            />
                          </TableCell>
                          <TableCell align="right" padding="none">
                            <IconButton size="small">
                              <MoreIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Không có dữ liệu sản phẩm bán chạy
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<RefreshIcon />}
                    onClick={fetchDashboardData}
                  >
                    Tải lại dữ liệu
                  </Button>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Orders */}
      <Grid container spacing={3} sx={{ mt: 0.5 }}>
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