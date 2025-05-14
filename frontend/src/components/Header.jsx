import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  InputBase, 
  Button, 
  Badge, 
  Container,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  Paper,
  Popper,
  Menu,
  MenuItem,
  Avatar,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  ShoppingCart as ShoppingCartIcon,
  Person as UserIcon,
  Menu as MenuIcon,
  KeyboardArrowDown as ChevronDownIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Computer as ComputerIcon,
  DesktopWindows as DesktopWindowsIcon,
  Build as BuildIcon,
  Business as BusinessIcon,
  DisplaySettings as DisplaySettingsIcon,
  Gamepad as GamepadIcon,
  Memory as MemoryIcon,
  Speaker as SpeakerIcon,
  Headset as HeadsetIcon,
  Mouse as MouseIcon,
  Keyboard as KeyboardIcon,
  Storage as StorageIcon,
  Dns as ServerIcon,
  DeviceHub as DeviceHubIcon,
  PhoneAndroid as PhoneIcon,
  LocationOn as LocationIcon,
  LocalShipping as ShippingIcon,
  VerifiedUser as QualityIcon,
  SupportAgent as SupportIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  ShoppingBag as OrdersIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { categoriesApi } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: theme.spacing(1),
    width: '100%',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#f59e0b',
  '&:hover': {
    backgroundColor: '#d97706',
  },
}));

const CategoryMenuItem = styled(ListItem)(({ theme }) => ({
  borderBottom: '1px solid #f0f0f0',
  padding: '8px 16px',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: '#f9fafb',
    color: '#6366f1',
  },
}));

const SubCategoryList = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  left: '100%',
  top: 0,
  width: '720px',
  minHeight: '100%',
  zIndex: 1001,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  flexWrap: 'wrap',
  borderRadius: '0 4px 4px 0',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
}));

const SubCategoryHeader = styled(Box)(({ theme }) => ({
  width: '100%',
  backgroundColor: '#f3f4f6',
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(1),
}));

const SubCategoryContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(1, 2),
}));

const SubCategoryItem = styled(ListItem)(({ theme }) => ({
  padding: '10px 16px',
  cursor: 'pointer',
  borderRadius: '0',
  borderBottom: '1px solid #f0f0f0',
  '&:hover': {
    backgroundColor: '#f9fafb',
    color: '#6366f1',
  },
}));

// Function to get icon component based on name or slug
const getCategoryIcon = (category) => {
  const name = category.name?.toLowerCase() || '';
  const slug = category.slug?.toLowerCase() || '';

  if (name.includes('pc') || slug.includes('pc')) return <ComputerIcon />;
  if (name.includes('linh kiện') || slug.includes('linh-kien')) return <MemoryIcon />;
  if (name.includes('màn hình') || slug.includes('man-hinh')) return <DisplaySettingsIcon />;
  if (name.includes('bàn phím') || slug.includes('ban-phim')) return <KeyboardIcon />;
  if (name.includes('chuột') || slug.includes('chuot')) return <MouseIcon />;
  if (name.includes('tai nghe') || slug.includes('tai-nghe')) return <HeadsetIcon />;
  if (name.includes('gaming') || slug.includes('gaming')) return <GamepadIcon />;
  if (name.includes('loa') || slug.includes('loa')) return <SpeakerIcon />;
  if (name.includes('laptop') || slug.includes('laptop')) return <DeviceHubIcon />;
  if (name.includes('ghế') || slug.includes('ghe')) return <BusinessIcon />;
  if (name.includes('phụ kiện') || slug.includes('phu-kien')) return <BuildIcon />;
  
  // Default icon
  return <DeviceHubIcon />;
};

const Header = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  
  // User menu state
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
  const userMenuOpen = Boolean(userMenuAnchorEl);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        // Get root categories with their children
        const response = await categoriesApi.getCategories({ withChildren: 'true', active: 'true' });
        // Filter to keep only the two main categories
        const filteredCategories = response.data.filter(category => 
          category.name.includes('Linh kiện') || 
          category.name.includes('Thiết bị ngoại vi')
        );
        setCategories(filteredCategories);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleCategoryMenu = () => {
    setCategoryMenuOpen(!categoryMenuOpen);
  };

  const toggleMobileSearch = () => {
    setMobileSearchOpen(!mobileSearchOpen);
  };

  const handleCategoryHover = (category) => {
    setHoveredCategory(category);
  };

  const handleCategoryLeave = () => {
    setHoveredCategory(null);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };
  
  const handleLogout = () => {
    logout();
    handleUserMenuClose();
    navigate('/');
  };

  const renderUserSection = () => {
    if (isAuthenticated) {
      return (
        <>
          <IconButton 
            color="inherit"
            onClick={handleUserMenuOpen}
            aria-controls={userMenuOpen ? 'user-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={userMenuOpen ? 'true' : undefined}
          >
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: 'primary.main',
                fontSize: '0.875rem'
              }}
            >
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </Avatar>
          </IconButton>
          <Menu
            id="user-menu"
            anchorEl={userMenuAnchorEl}
            open={userMenuOpen}
            onClose={handleUserMenuClose}
            MenuListProps={{
              'aria-labelledby': 'user-button',
            }}
            PaperProps={{
              elevation: 3,
              sx: {
                minWidth: 180,
                boxShadow: 'rgb(145 158 171 / 24%) 0px 0px 2px 0px, rgb(145 158 171 / 24%) 0px 20px 40px -4px'
              }
            }}
          >
            <MenuItem sx={{ pointerEvents: 'none', opacity: 0.7 }}>
              <Typography variant="body2">
                Xin chào, {currentUser?.name || 'User'}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem component={Link} to="/profile" onClick={handleUserMenuClose}>
              <ListItemIcon>
                <UserIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Tài khoản</ListItemText>
            </MenuItem>
            <MenuItem component={Link} to="/orders" onClick={handleUserMenuClose}>
              <ListItemIcon>
                <OrdersIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Đơn hàng</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Đăng xuất</ListItemText>
            </MenuItem>
          </Menu>
        </>
      );
    }
    
    return (
      <Button
        component={Link}
        to="/login"
        color="inherit"
        sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}
        startIcon={<UserIcon />}
      >
        Đăng nhập
      </Button>
    );
  };

  return (
    <>
      {/* Top bar */}
      <Box sx={{ bgcolor: '#1f2937', color: 'white', py: 0.5, px: 2, fontSize: '0.75rem' }}>
        <Container maxWidth="lg" sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PhoneIcon sx={{ fontSize: '0.875rem', mr: 0.5 }} />
              <Typography variant="caption">Hotline: 1900 1001</Typography>
            </Box>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', ml: 2 }}>
              <LocationIcon sx={{ fontSize: '0.875rem', mr: 0.5 }} />
              <Typography variant="caption">Hệ thống cửa hàng</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
              <ShippingIcon sx={{ fontSize: '0.875rem', mr: 0.5 }} />
              <Typography variant="caption">Miễn phí vận chuyển</Typography>
            </Box>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', ml: 2 }}>
              <QualityIcon sx={{ fontSize: '0.875rem', mr: 0.5 }} />
              <Typography variant="caption">Bảo hành chính hãng</Typography>
            </Box>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', ml: 2 }}>
              <SupportIcon sx={{ fontSize: '0.875rem', mr: 0.5 }} />
              <Typography variant="caption">Hỗ trợ 24/7</Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main header */}
      <AppBar position="static" color="default" sx={{ boxShadow: 1, backgroundColor: 'white' }}>
        <Toolbar>
          <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Logo area */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton 
                edge="start" 
                color="inherit" 
                aria-label="menu"
                onClick={toggleMobileMenu}
                sx={{ display: { md: 'none' }, mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
              <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
                <img src="/images/logo-transparent.png" alt="K-Store Logo" style={{ height: 100, width: 120 }} />
                <Typography 
                  variant="h6" 
                  component="div"
                  sx={{ 
                    fontWeight: 700, 
                    color: '#1976d2',
                    display: { xs: 'none', sm: 'block' },
                    ml: 1
                  }}
                >
                </Typography>
              </Link>
            </Box>
            
            {/* Categories button - desktop */}
            <Button
              variant="contained"
              color="primary"
              startIcon={<MenuIcon />}
              endIcon={<ChevronDownIcon />}
              onClick={toggleCategoryMenu}
              sx={{ 
                mr: 2, 
                py: 1, 
                px: 2,
                display: { xs: 'none', md: 'flex' },
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Danh mục
            </Button>
            
            {/* Search */}
            <Box 
              sx={{ 
                display: { xs: mobileSearchOpen ? 'flex' : 'none', md: 'flex' }, 
                flexGrow: 1,
                position: { xs: 'absolute', md: 'static' },
                left: 0,
                right: 0,
                top: { xs: '100%', md: 'auto' },
                zIndex: { xs: 1000, md: 'auto' },
                backgroundColor: 'white',
                padding: { xs: 2, md: 0 },
                boxShadow: { xs: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', md: 'none' }
              }}
            >
              <Paper
                component="form"
                sx={{ 
                  p: '2px 4px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  width: '100%',
                  border: '1px solid #e0e0e0',
                  boxShadow: 'none'
                }}
              >
                <StyledInputBase
                  placeholder="Tìm kiếm sản phẩm..."
                  inputProps={{ 'aria-label': 'search' }}
                />
                <IconButton type="submit" sx={{ p: '10px' }} aria-label="search">
                  <SearchIcon />
                </IconButton>
              </Paper>
            </Box>
            
            {/* Icons */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {/* Search icon for mobile */}
              <IconButton 
                size="large" 
                color="inherit"
                onClick={toggleMobileSearch}
                sx={{ display: { md: 'none' } }}
              >
                <SearchIcon />
              </IconButton>
              
              {/* Cart */}
              <IconButton 
                size="large" 
                color="inherit"
                component={Link}
                to="/cart"
                sx={{ ml: { xs: 0, md: 1 } }}
              >
                <Badge badgeContent={3} color="primary">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
              
              {/* User */}
              {renderUserSection()}
              
              {/* Build PC button */}
              <Button
                variant="contained"
                component={Link}
                to="/build-pc"
                color="warning"
                startIcon={<BuildIcon />}
                sx={{ 
                  ml: 2, 
                  display: { xs: 'none', md: 'flex' },
                  textTransform: 'none',
                  fontWeight: 600,
                  bgcolor: '#f59e0b',
                  '&:hover': {
                    bgcolor: '#d97706',
                  },
                }}
              >
                Build PC
              </Button>
            </Box>
          </Container>
        </Toolbar>
      </AppBar>

      {/* Navigation */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <Container maxWidth="lg" sx={{ px: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', height: '3rem' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  fontWeight: 500,
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onClick={toggleCategoryMenu}
              >
                <MenuIcon sx={{ height: '1.25rem', width: '1.25rem' }} />
                <Typography>DANH MỤC SẢN PHẨM</Typography>
                
                {/* Category dropdown */}
                <Collapse 
                  in={categoryMenuOpen} 
                  sx={{ 
                    position: 'absolute', 
                    top: '100%', 
                    left: 0, 
                    width: '280px', 
                    zIndex: 1000,
                    backgroundColor: 'white',
                    boxShadow: 3,
                    borderRadius: '0 0 4px 4px',
                    marginTop: '12px',
                    height: categoryMenuOpen ? 'auto' : 0,
                  }}
                >
                  <List sx={{ padding: 0 }}>
                    {loading ? (
                      <CategoryMenuItem>
                        <ListItemText primary="Đang tải danh mục..." />
                      </CategoryMenuItem>
                    ) : error ? (
                      <CategoryMenuItem>
                        <ListItemText primary={`Lỗi: ${error}`} />
                      </CategoryMenuItem>
                    ) : (
                      categories.map((category) => (
                        <CategoryMenuItem 
                          key={category._id} 
                          divider
                          component={Link}
                          to={`/category/${category.slug}`}
                          onMouseEnter={() => handleCategoryHover(category)}
                          onMouseLeave={handleCategoryLeave}
                          sx={{ position: 'relative' }}
                        >
                          <ListItemIcon sx={{ minWidth: '36px' }}>
                            {getCategoryIcon(category)}
                          </ListItemIcon>
                          <ListItemText primary={category.name} />
                          {category.children && category.children.length > 0 && (
                            <ChevronRightIcon sx={{ ml: 1 }} />
                          )}
                          
                          {/* Subcategories popup */}
                          {hoveredCategory && hoveredCategory._id === category._id && 
                           category.children && category.children.length > 0 && (
                            <SubCategoryList>
                              <SubCategoryHeader>
                                <Typography 
                                  variant="subtitle1" 
                                  component={Link} 
                                  to={`/category/${category.slug}`}
                                  sx={{ 
                                    fontWeight: 'bold', 
                                    color: '#1f2937',
                                    textDecoration: 'none',
                                    display: 'block',
                                    '&:hover': { color: '#6366f1' }
                                  }}
                                >
                                  {category.name}
                                </Typography>
                              </SubCategoryHeader>
                              <SubCategoryContent>
                                {category.children.map((subCategory) => (
                                  <Box key={subCategory._id}>
                                    <List disablePadding>
                                      <SubCategoryItem
                                        component={Link}
                                        to={`/category/${subCategory.slug}`}
                                      >
                                        <ListItemText 
                                          primary={subCategory.name}
                                          primaryTypographyProps={{ 
                                            fontWeight: 'bold',
                                            color: '#1f2937'
                                          }}
                                        />
                                      </SubCategoryItem>
                                      {subCategory.children && subCategory.children.map((childCategory) => (
                                        <SubCategoryItem 
                                          key={childCategory._id} 
                                          component={Link}
                                          to={`/category/${childCategory.slug}`}
                                        >
                                          <ListItemText 
                                            primary={childCategory.name}
                                            primaryTypographyProps={{ 
                                              variant: 'body2',
                                              sx: {
                                                color: '#4b5563',
                                                '&:hover': { color: '#6366f1' }
                                              }
                                            }}
                                          />
                                        </SubCategoryItem>
                                      ))}
                                    </List>
                                  </Box>
                                ))}
                              </SubCategoryContent>
                            </SubCategoryList>
                          )}
                        </CategoryMenuItem>
                      ))
                    )}
                  </List>
                </Collapse>
              </Box>
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 3, fontSize: '0.875rem' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <QualityIcon sx={{ color: '#3b82f6', fontSize: '1rem' }} />
                  <Typography variant="body2">Chất lượng đảm bảo</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ShippingIcon sx={{ color: '#3b82f6', fontSize: '1rem' }} />
                  <Typography variant="body2">Vận chuyển siêu tốc</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <SupportIcon sx={{ color: '#3b82f6', fontSize: '1rem' }} />
                  <Typography variant="body2">Tư vấn Build PC: 0986552235</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
      
      {/* Mobile menu drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={toggleMobileMenu}
        PaperProps={{ sx: { width: '80%', maxWidth: '320px' } }}
      >
        <Box sx={{ padding: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Menu</Typography>
            <IconButton onClick={toggleMobileMenu}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
          
          <List>
            <ListItem button>
              <ListItemIcon><UserIcon /></ListItemIcon>
              <ListItemText primary="Đăng nhập / Đăng ký" />
            </ListItem>
            {loading ? (
              <ListItem>
                <ListItemText primary="Đang tải danh mục..." />
              </ListItem>
            ) : error ? (
              <ListItem>
                <ListItemText primary={`Lỗi: ${error}`} />
              </ListItem>
            ) : (
              categories.map((category) => (
                <ListItem 
                  key={category._id} 
                  button 
                  divider
                  component={Link}
                  to={`/category/${category.slug}`}
                >
                  <ListItemIcon>{getCategoryIcon(category)}</ListItemIcon>
                  <ListItemText primary={category.name} />
                  {category.children && category.children.length > 0 && <ExpandMoreIcon />}
                </ListItem>
              ))
            )}
          </List>
          
          <Box sx={{ mt: 'auto', borderTop: '1px solid #e5e7eb', pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Hotline: 0968 239 497 - 097 221 6881
            </Typography>
            <Typography variant="body2">
              Tư vấn build PC: 0986552235
            </Typography>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default Header; 