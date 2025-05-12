import React, { useState, useEffect } from 'react';
import { Box, Container, CircularProgress, Alert, Typography, Divider } from '@mui/material';
import ProductSection from '../components/ProductSection';
import { productsApi, categoriesApi } from '../services/api';
import Hero from '../components/Hero';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  
  // Các danh mục sản phẩm theo nhóm
  const [computerComponents, setComputerComponents] = useState({
    cpu: [],
    cpuIntel: [],
    cpuAmd: [],
    ram: [],
    vga: [],
    ssd: [],
    hdd: [],
  });
  
  const [peripherals, setPeripherals] = useState({
    monitor: [],
    mouse: [],
    keyboard: [],
    headphone: [],
  });
  
  const [laptops, setLaptops] = useState([]);
  
  // Store category slugs for navigation
  const [categoryMap, setCategoryMap] = useState({
    cpu: '',
    cpuIntel: '',
    cpuAmd: '',
    ram: '',
    vga: '',
    ssd: '',
    hdd: '',
    monitor: '',
    mouse: '',
    keyboard: '',
    headphone: '',
    laptop: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Fetch featured products (we'll just get all products for now)
        const response = await productsApi.getProducts({ limit: 50 }); // Lấy nhiều sản phẩm hơn để lọc
        
        // Fetch categories to map IDs to slugs
        const categoriesResponse = await categoriesApi.getCategories({ withChildren: 'true' });
        
        if (response.data && Array.isArray(response.data.products)) {
          const products = response.data.products;
          
          // Set featured products (could be products with most sales or special flag)
          setFeaturedProducts(products.slice(0, 8));
          
          // Set new products (sort by createdAt)
          const sortedByDate = [...products].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          setNewProducts(sortedByDate.slice(0, 8));
          
          // Category IDs for filtering
          const categoryIds = {
            cpu: [],
            cpuIntel: [],
            cpuAmd: [],
            ram: [],
            vga: [],
            ssd: [],
            hdd: [],
            monitor: [],
            mouse: [],
            keyboard: [],
            headphone: [],
            laptop: []
          };
          
          // Category slugs for navigation
          const slugMap = { ...categoryMap };
          
          // Helper function to process category tree and extract IDs and slugs
          const processCategoryTree = (categories) => {
            for (const category of categories) {
              // Danh mục linh kiện
              if (category.name.includes('CPU') || category.slug?.includes('cpu')) {
                categoryIds.cpu.push(category._id);
                slugMap.cpu = category.slug;
                
                if (category.name.includes('Intel') || category.slug?.includes('intel')) {
                  categoryIds.cpuIntel.push(category._id);
                  slugMap.cpuIntel = category.slug;
                }
                
                if (category.name.includes('AMD') || category.slug?.includes('amd')) {
                  categoryIds.cpuAmd.push(category._id);
                  slugMap.cpuAmd = category.slug;
                }
              }
              
              if (category.name.includes('RAM') || category.slug?.includes('ram')) {
                categoryIds.ram.push(category._id);
                slugMap.ram = category.slug;
              }
              
              if (category.name.includes('VGA') || category.slug?.includes('vga')) {
                categoryIds.vga.push(category._id);
                slugMap.vga = category.slug;
              }
              
              if (category.name.includes('SSD') || category.slug?.includes('ssd')) {
                categoryIds.ssd.push(category._id);
                slugMap.ssd = category.slug;
              }
              
              if (category.name.includes('HDD') || category.slug?.includes('hdd')) {
                categoryIds.hdd.push(category._id);
                slugMap.hdd = category.slug;
              }
              
              // Danh mục thiết bị ngoại vi
              if (category.name.includes('Màn hình') || category.slug?.includes('man-hinh')) {
                categoryIds.monitor.push(category._id);
                slugMap.monitor = category.slug;
              }
              
              if (category.name.includes('Chuột') || category.slug?.includes('chuot')) {
                categoryIds.mouse.push(category._id);
                slugMap.mouse = category.slug;
              }
              
              if (category.name.includes('Bàn phím') || category.slug?.includes('ban-phim')) {
                categoryIds.keyboard.push(category._id);
                slugMap.keyboard = category.slug;
              }
              
              if (category.name.includes('Tai nghe') || category.slug?.includes('tai-nghe')) {
                categoryIds.headphone.push(category._id);
                slugMap.headphone = category.slug;
              }
              
              // Danh mục laptop
              if (category.name.includes('Laptop') || category.slug?.includes('laptop')) {
                categoryIds.laptop.push(category._id);
                slugMap.laptop = category.slug;
              }
              
              // Process children if any
              if (category.children && category.children.length > 0) {
                processCategoryTree(category.children);
              }
            }
          };
          
          // Process the category tree
          if (Array.isArray(categoriesResponse.data)) {
            processCategoryTree(categoriesResponse.data);
          }
          
          // Save the slug map for navigation
          setCategoryMap(slugMap);
          
          // Filter products by category
          const componentProducts = {};
          const peripheralProducts = {};
          let laptopProducts = [];
          
          // Filter for computer components
          for (const [key, ids] of Object.entries(categoryIds)) {
            if (ids.length > 0) {
              const filteredProducts = products.filter(product => {
                const productCategoryId = product.category?._id || product.category;
                return ids.includes(productCategoryId);
              });
              
              // Assign products to appropriate category group
              if (['cpu', 'cpuIntel', 'cpuAmd', 'ram', 'vga', 'ssd', 'hdd'].includes(key)) {
                componentProducts[key] = filteredProducts.slice(0, 8);
              } else if (['monitor', 'mouse', 'keyboard', 'headphone'].includes(key)) {
                peripheralProducts[key] = filteredProducts.slice(0, 8);
              } else if (key === 'laptop') {
                laptopProducts = filteredProducts.slice(0, 8);
              }
            }
          }
          
          setComputerComponents(componentProducts);
          setPeripherals(peripheralProducts);
          setLaptops(laptopProducts);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.response?.data?.message || 'Không thể tải sản phẩm. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <Box>
      <Hero />
      
      {error && (
        <Container maxWidth="lg" sx={{ my: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      )}
      
      <ProductSection 
        title="Sản phẩm nổi bật"
        products={featuredProducts}
        loading={loading}
        viewAllLink="/products?featured=true"
      />
      
      <ProductSection 
        title="Sản phẩm mới"
        products={newProducts}
        loading={loading}
        viewAllLink="/products?newest=true"
      />

      {/* LINH KIỆN MÁY TÍNH */}
      <Container maxWidth="lg" sx={{ mt: 6, mb: 2 }}>
        <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Linh kiện máy tính
        </Typography>
        <Divider />
      </Container>
      
      <ProductSection 
        title="CPU - Bộ vi xử lý"
        products={computerComponents.cpu}
        loading={loading}
        viewAllLink={categoryMap.cpu ? `/category/${categoryMap.cpu}` : "#"}
      />
      
      {computerComponents.cpuIntel?.length > 0 && (
        <ProductSection 
          title="CPU Intel"
          products={computerComponents.cpuIntel}
          loading={loading}
          viewAllLink={categoryMap.cpuIntel ? `/category/${categoryMap.cpuIntel}` : "#"}
        />
      )}
      
      {computerComponents.cpuAmd?.length > 0 && (
        <ProductSection 
          title="CPU AMD"
          products={computerComponents.cpuAmd}
          loading={loading}
          viewAllLink={categoryMap.cpuAmd ? `/category/${categoryMap.cpuAmd}` : "#"}
        />
      )}
      
      <ProductSection 
        title="RAM - Bộ nhớ"
        products={computerComponents.ram}
        loading={loading}
        viewAllLink={categoryMap.ram ? `/category/${categoryMap.ram}` : "#"}
      />
      
      <ProductSection 
        title="VGA - Card màn hình"
        products={computerComponents.vga}
        loading={loading}
        viewAllLink={categoryMap.vga ? `/category/${categoryMap.vga}` : "#"}
      />
      
      <ProductSection 
        title="SSD - Ổ cứng thể rắn"
        products={computerComponents.ssd}
        loading={loading}
        viewAllLink={categoryMap.ssd ? `/category/${categoryMap.ssd}` : "#"}
      />
      
      <ProductSection 
        title="HDD - Ổ cứng"
        products={computerComponents.hdd}
        loading={loading}
        viewAllLink={categoryMap.hdd ? `/category/${categoryMap.hdd}` : "#"}
      />
      
      {/* LAPTOP */}
      {laptops?.length > 0 && (
        <>
          <Container maxWidth="lg" sx={{ mt: 6, mb: 2 }}>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Laptop
            </Typography>
            <Divider />
          </Container>
          
          <ProductSection 
            title="Laptop"
            products={laptops}
            loading={loading}
            viewAllLink={categoryMap.laptop ? `/category/${categoryMap.laptop}` : "#"}
          />
        </>
      )}
      
      {/* THIẾT BỊ NGOẠI VI */}
      <Container maxWidth="lg" sx={{ mt: 6, mb: 2 }}>
        <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Thiết bị ngoại vi
        </Typography>
        <Divider />
      </Container>
      
      <ProductSection 
        title="Màn hình"
        products={peripherals.monitor}
        loading={loading}
        viewAllLink={categoryMap.monitor ? `/category/${categoryMap.monitor}` : "#"}
      />
      
      <ProductSection 
        title="Chuột"
        products={peripherals.mouse}
        loading={loading}
        viewAllLink={categoryMap.mouse ? `/category/${categoryMap.mouse}` : "#"}
      />
      
      <ProductSection 
        title="Bàn phím"
        products={peripherals.keyboard}
        loading={loading}
        viewAllLink={categoryMap.keyboard ? `/category/${categoryMap.keyboard}` : "#"}
      />
      
      <ProductSection 
        title="Tai nghe"
        products={peripherals.headphone}
        loading={loading}
        viewAllLink={categoryMap.headphone ? `/category/${categoryMap.headphone}` : "#"}
      />
    </Box>
  );
};

export default Home; 