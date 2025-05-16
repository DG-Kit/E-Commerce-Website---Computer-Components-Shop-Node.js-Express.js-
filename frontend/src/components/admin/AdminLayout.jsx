import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Avatar,
  Menu,
  MenuItem,
  Container,
  useTheme,
  useMediaQuery,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ShoppingBag as ProductsIcon,
  Category as CategoryIcon,
  Receipt as OrdersIcon,
  People as UsersIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Home as HomeIcon,
  LocalOffer as CouponIcon,
  AccountCircle,
  AdminPanelSettings as AdminIcon,
  Assessment as AnalyticalIcon,
  ShoppingCart as EcommerceIcon,
  Article as ArticleIcon,
  Article as PageIcon,
  Notifications as NotificationsIcon,
  Mail as MailIcon,
  CalendarMonth as CalendarIcon,
  ViewKanban as KanbanIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

// Sidebar width
const drawerWidth = 240;

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Always keep drawer open, no toggle functionality
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Removed toggle functionality
  const handleDrawerToggle = () => {
    // No-op function - drawer will always stay open
  };
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleNavigateToHome = () => {
    navigate('/');
  };

  // Admin navigation items
  const mainNavItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/admin'
    },
    {
      text: 'Sản phẩm',
      icon: <ProductsIcon />,
      path: '/admin/products'
    },
    {
      text: 'Danh mục',
      icon: <CategoryIcon />,
      path: '/admin/categories'
    },
    {
      text: 'Đơn hàng',
      icon: <OrdersIcon />,
      path: '/admin/orders'
    },
    {
      text: 'Người dùng',
      icon: <UsersIcon />,
      path: '/admin/users'
    },
    {
      text: 'Mã giảm giá',
      icon: <CouponIcon />,
      path: '/admin/coupons'
    },
    {
      text: 'Cài đặt',
      icon: <SettingsIcon />,
      path: '/admin/settings'
    }
  ];
  
  const appNavItems = [
    {
      text: 'eCommerce',
      icon: <EcommerceIcon />,
      path: '/admin/ecommerce'
    },
    {
      text: 'Blog',
      icon: <ArticleIcon sx={{ transform: 'rotate(90deg)' }} />,
      path: '/admin/blog'
    },
    {
      text: 'User Profile',
      icon: <AccountCircle />,
      path: '/admin/user-profile'
    },
    {
      text: 'Email',
      icon: <MailIcon />,
      path: '/admin/email'
    },
    {
      text: 'Calendar',
      icon: <CalendarIcon />,
      path: '/admin/calendar'
    },
    {
      text: 'Kanban',
      icon: <KanbanIcon />,
      path: '/admin/kanban'
    },
    {
      text: 'Chat',
      icon: <ChatIcon />,
      path: '/admin/chat'
    },
  ];
  
  const moduleNavItems = [
    {
      text: 'Sản phẩm',
      icon: <ProductsIcon />,
      path: '/admin/products'
    },
    {
      text: 'Danh mục',
      icon: <CategoryIcon />,
      path: '/admin/categories'
    },
    {
      text: 'Đơn hàng',
      icon: <OrdersIcon />,
      path: '/admin/orders'
    },
    {
      text: 'Người dùng',
      icon: <UsersIcon />,
      path: '/admin/users'
    },
    {
      text: 'Mã giảm giá',
      icon: <CouponIcon />,
      path: '/admin/coupons'
    },
    {
      text: 'Cài đặt',
      icon: <SettingsIcon />,
      path: '/admin/settings'
    }
  ];
  
  return (
    <Box sx={{ display: 'flex', bgcolor: '#F7F9FC' }}>
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          width: '100%',
          marginLeft: 0,
          backgroundColor: 'white',
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
          color: 'text.primary',
        }}
        elevation={0}
      >
        <Toolbar sx={{ padding: 0, pl: 2, pr: 1, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mr: 2,
                '& svg': {
                  fontSize: 28,
                  color: '#2563EB',
                }
              }}
            >
              <AdminIcon />
              <Typography 
                variant="h6" 
                noWrap 
                component="div" 
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: '1.25rem',
                  ml: 1,
                  color: '#111827'
                }}
              >
                Flexy
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Thông báo">
              <IconButton color="inherit" sx={{ mr: 2 }}>
                <Badge badgeContent={3} color="primary">
                  <NotificationsIcon sx={{ color: '#6B7280' }} />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Về trang chủ">
              <IconButton color="inherit" onClick={handleNavigateToHome} sx={{ mr: 2 }}>
                <HomeIcon sx={{ color: '#6B7280' }} />
              </IconButton>
            </Tooltip>
            
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36,
                  bgcolor: '#FDE68A',
                  color: '#D97706',
                }}
              >
                {currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'A'}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
            >
              <MenuItem onClick={() => {
                handleProfileMenuClose();
                navigate('/profile');
              }}>
                Hồ sơ
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Đăng xuất
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        open={true}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid #E5E7EB',
            boxShadow: 'none',
            bgcolor: 'white',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <Typography
            variant="subtitle2"
            sx={{
              px: 3,
              py: 1,
              color: '#6B7280',
              fontWeight: 'bold',
              letterSpacing: '0.5px',
            }}
          >
            QUẢN LÝ
          </Typography>
          <List>
            {mainNavItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: '0 24px 24px 0',
                    mx: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(37, 99, 235, 0.08)',
                      color: '#2563EB',
                      '&:hover': {
                        backgroundColor: 'rgba(37, 99, 235, 0.12)',
                      },
                      '& .MuiListItemIcon-root': {
                        color: '#2563EB',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      
      {/* Main content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3,
          width: '100%',
          marginLeft: 0,
          pt: 8, // Add top padding to account for AppBar height
          backgroundColor: '#F7F9FC',
          minHeight: '100vh',
        }}
      >
        <Container maxWidth="xl" sx={{ mt: 2 }}>
          <Outlet /> {/* This is where child routes will be rendered */}
        </Container>
      </Box>
    </Box>
  );
};

export default AdminLayout; 