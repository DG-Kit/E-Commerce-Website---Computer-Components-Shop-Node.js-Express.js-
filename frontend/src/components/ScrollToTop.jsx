import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Component này sẽ cuộn trang lên đầu khi thay đổi đường dẫn
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Cuộn lên đầu trang mỗi khi đường dẫn thay đổi
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Đảm bảo cuộn xảy ra ngay lập tức
    });
  }, [pathname]);

  return null; // Component này không hiển thị gì cả
};

export default ScrollToTop; 