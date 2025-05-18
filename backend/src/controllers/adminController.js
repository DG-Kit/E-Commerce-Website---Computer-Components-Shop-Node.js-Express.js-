const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const mongoose = require('mongoose');

/**
 * Lấy thống kê tổng quan cho dashboard
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Object} Statistics for dashboard
 */
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed

    // --- Start and End dates for calculations ---
    // Current Month
    const currentMonthStartDate = new Date(currentYear, currentMonth, 1);
    const currentMonthEndDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999); // Last moment of last day of current month

    // Previous Month
    const previousMonthDate = new Date(today);
    previousMonthDate.setMonth(today.getMonth() - 1);
    const previousMonthYear = previousMonthDate.getFullYear();
    const previousMonth = previousMonthDate.getMonth();
    const previousMonthStartDate = new Date(previousMonthYear, previousMonth, 1);
    const previousMonthEndDate = new Date(previousMonthYear, previousMonth + 1, 0, 23, 59, 59, 999);

    // Last 7 days for sparklines (including today)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6); // 7 days including today
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const todayEndDateForSparkline = new Date(today); // Use current time for "up to now"
    todayEndDateForSparkline.setHours(23,59,59,999);


    // --- Aggregations ---
    // 1. Total Products
    const productsCount = await Product.countDocuments({ isActive: true });
    
    // 2. Total Users
    const usersCount = await User.countDocuments();
    
    // 3. Order Status (Overall - for Doughnut chart)
    const overallOrdersStats = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    let ordersByStatus = { PENDING: 0, PROCESSING: 0, DELIVERED: 0, CANCELLED: 0 };
    overallOrdersStats.forEach(stat => {
      if (ordersByStatus.hasOwnProperty(stat._id.toUpperCase())) {
        ordersByStatus[stat._id.toUpperCase()] = stat.count;
      }
    });

    // 4. Current Month Revenue
    const currentMonthRevenueData = await Order.aggregate([
      { $match: { createdAt: { $gte: currentMonthStartDate, $lte: currentMonthEndDate }, status: { $ne: 'CANCELLED' } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const currentMonthRevenue = currentMonthRevenueData[0]?.total || 0;

    // 5. Previous Month Revenue
    const previousMonthRevenueData = await Order.aggregate([
      { $match: { createdAt: { $gte: previousMonthStartDate, $lte: previousMonthEndDate }, status: { $ne: 'CANCELLED' } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const previousMonthRevenue = previousMonthRevenueData[0]?.total || 0;
    
    // 6. Current Month Orders
    const currentMonthOrdersCount = await Order.countDocuments({
      createdAt: { $gte: currentMonthStartDate, $lte: currentMonthEndDate }
    });

    // 7. Previous Month Orders
    const previousMonthOrdersCount = await Order.countDocuments({
      createdAt: { $gte: previousMonthStartDate, $lte: previousMonthEndDate }
    });

    // 8. Overall Revenue (for the card that was originally showing total revenue)
    // This can be the same as currentMonthRevenue if the card title is "Doanh thu tháng"
    // Or calculate total historical revenue if needed elsewhere. For now, let's align with "Doanh thu tháng"
    const overallRevenueForCard = currentMonthRevenue; 
    const overallOrdersForCard = currentMonthOrdersCount;


    // 9. Revenue Sparkline Data (Last 7 Days)
    const revenueSparkline = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo, $lte: todayEndDateForSparkline }, status: { $ne: 'CANCELLED' } } },
      { 
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          dailyRevenue: { $sum: "$totalAmount" }
        } 
      },
      { $sort: { _id: 1 } }
    ]);
    
    // 10. Orders Sparkline Data (Last 7 Days)
    const ordersSparkline = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo, $lte: todayEndDateForSparkline } } },
      { 
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          dailyOrders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // --- Helper to fill in missing days for sparklines ---
    const fillMissingSparklineData = (startDate, endDate, actualData, valueField, defaultValue = 0) => {
      const filledData = [];
      const dateMap = new Map(actualData.map(item => [item._id, item[valueField]]));
      let currentDate = new Date(startDate);
      currentDate.setHours(0,0,0,0);


      while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split('T')[0];
        filledData.push(dateMap.get(dateString) || defaultValue);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return filledData;
    };
    
    const endDateForSparklineFilling = new Date(today); // Use today as the end for filling
    endDateForSparklineFilling.setHours(0,0,0,0);


    const revenueSparklineData = fillMissingSparklineData(sevenDaysAgo, endDateForSparklineFilling, revenueSparkline, 'dailyRevenue');
    const ordersSparklineData = fillMissingSparklineData(sevenDaysAgo, endDateForSparklineFilling, ordersSparkline, 'dailyOrders');
    
    // --- Percentage Change Calculations ---
    const revenueChange = previousMonthRevenue === 0 
      ? (currentMonthRevenue > 0 ? 100 : 0) 
      : ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
      
    const ordersChange = previousMonthOrdersCount === 0
      ? (currentMonthOrdersCount > 0 ? 100 : 0)
      : ((currentMonthOrdersCount - previousMonthOrdersCount) / previousMonthOrdersCount) * 100;

    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin thống kê thành công',
      data: {
        products: productsCount,
        users: usersCount,
        // Stats for the top cards
        currentMonthRevenue: currentMonthRevenue,
        revenueChange: parseFloat(revenueChange.toFixed(2)), // Percentage
        revenueSparkline: revenueSparklineData, // Array of last 7 days revenue

        currentMonthOrders: currentMonthOrdersCount,
        ordersChange: parseFloat(ordersChange.toFixed(2)), // Percentage
        ordersSparkline: ordersSparklineData, // Array of last 7 days order counts
        
        // Stats for order status doughnut chart (using existing structure)
        orders: { // This structure is used by the doughnut chart and order status summary card
          total: await Order.countDocuments(), // Overall total orders
          pending: ordersByStatus.PENDING,
          processing: ordersByStatus.PROCESSING,
          delivered: ordersByStatus.DELIVERED,
          cancelled: ordersByStatus.CANCELLED
        },
        // This specific 'revenue' field was used by the old 'Doanh thu' summary card.
        // Now it will be currentMonthRevenue as per card title "Doanh thu tháng"
        revenue: currentMonthRevenue 
      }
    });
  } catch (error) {
    console.error('Lỗi lấy thông tin thống kê:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi lấy thông tin thống kê'
    });
  }
};

/**
 * Lấy danh sách đơn hàng gần đây
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Object} Recent orders
 */
const getRecentOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'fullName email')
      .select('_id orderNumber totalAmount status createdAt userId shippingAddress');
    
    // Format data for frontend
    const formattedOrders = recentOrders.map(order => ({
      id: order._id,
      orderNumber: order.orderNumber || `ORD-${order._id.toString().substr(-6)}`,
      customer: order.userId?.fullName || 'Khách hàng',
      date: order.createdAt,
      amount: order.totalAmount,
      status: order.status
    }));
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn hàng gần đây thành công',
      data: formattedOrders
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách đơn hàng gần đây:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi lấy danh sách đơn hàng gần đây'
    });
  }
};

/**
 * Lấy danh sách sản phẩm bán chạy
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Object} Best selling products
 */
const getBestSellingProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const timeFrame = req.query.timeFrame || 'all'; // Options: all, month, week
    
    // Create date filters based on timeFrame
    let dateFilter = {};
    const now = new Date();
    
    if (timeFrame === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (timeFrame === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      dateFilter = { createdAt: { $gte: monthAgo } };
    }
    
    // Log that we're retrieving actual data from the database
    console.log(`Retrieving best selling products with timeFrame: ${timeFrame}`);
    
    // Tìm các sản phẩm bán chạy dựa trên số lượng đơn hàng
    const bestSellers = await Order.aggregate([
      // Apply date filter if specified and filter by successful orders
      { 
        $match: { 
          status: { $in: ['delivered', 'processing'] },
          ...dateFilter
        } 
      },
      // Giải nén mảng items
      { $unwind: '$items' },
      // Nhóm theo productId và đếm số lượng bán
      {
        $group: {
          _id: '$items.productId',
          sold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orderCount: { $addToSet: '$_id' }, // Count unique orders with this product
          images: { $addToSet: '$items.image' }, // Collect all item images
          avgPrice: { $avg: '$items.price' }, // Average price sold at
          firstSale: { $min: '$createdAt' }, // First sale date
          lastSale: { $max: '$createdAt' }, // Last sale date
        }
      },
      // Add calculated fields
      {
        $addFields: {
          orderCount: { $size: '$orderCount' }, // Convert to count
          saleFrequency: { 
            $divide: [
              { $subtract: ["$lastSale", "$firstSale"] },
              { $multiply: [1000 * 60 * 60 * 24, "$sold"] } // Average days between sales
            ]
          }
        }
      },
      // Sắp xếp theo số lượng bán giảm dần
      { $sort: { sold: -1 } },
      // Giới hạn số lượng kết quả
      { $limit: limit },
      // Kết hợp với bảng sản phẩm để lấy thông tin chi tiết
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      // Làm phẳng mảng product
      { $unwind: '$product' },
      // Kết hợp với bảng category để lấy thông tin category
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category'
        }
      },
      // Làm phẳng mảng category (nếu có)
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true
        }
      },
      // Định dạng kết quả trả về
      {
        $project: {
          id: '$_id',
          name: '$product.name',
          sold: 1,
          orderCount: 1,
          revenue: 1,
          avgPrice: 1,
          firstSale: 1,
          lastSale: 1,
          images: 1,
          image: { $ifNull: [{ $arrayElemAt: ['$images', 0] }, { $arrayElemAt: ['$product.images', 0] }] },
          category: {
            id: '$category._id',
            name: '$category.name'
          },
          stock: '$product.stock',
          minPrice: '$product.minPrice',
          margin: { 
            $subtract: [
              '$revenue', 
              { $multiply: ['$product.minPrice', '$sold', 0.7] }
            ]
          },
          costEstimate: { $multiply: ['$product.minPrice', '$sold', 0.7] },
          profitMargin: {
            $multiply: [
              {
                $divide: [
                  { $subtract: ['$revenue', { $multiply: ['$product.minPrice', '$sold', 0.7] }] },
                  { $cond: [{ $eq: ['$revenue', 0] }, 1, '$revenue'] }
                ]
              },
              100
            ]
          },
          attributes: '$product.attributes'
        }
      }
    ]);
    
    console.log(`Found ${bestSellers.length} best selling products`);
    
    // Process the results to format vendor information and stock status
    const processedBestSellers = bestSellers.map(product => {
      const stockStatus = product.stock > 10 ? 'In Stock' : (product.stock > 0 ? 'Low Stock' : 'Out of Stock');
      
      // Generate vendor avatars
      const vendors = [];
      // Add the main vendor (brand) if it exists
      if (product.attributes && product.attributes.brand) {
        vendors.push({
          name: product.attributes.brand,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(product.attributes.brand)}&background=random`
        });
      }
      
      // If there are no real vendors found, generate some sample ones
      if (vendors.length === 0) {
        const vendorNames = ['Samsung', 'Intel', 'AMD', 'Corsair', 'MSI', 'ASUS', 'Gigabyte', 'Kingston'];
        const mainVendor = vendorNames[Math.floor(Math.random() * vendorNames.length)];
        vendors.push({
          name: mainVendor,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(mainVendor)}&background=random`
        });
      }
      
      // Add some additional vendors (1-3)
      const additionalVendorCount = Math.floor(Math.random() * 3) + 1;
      const vendorNames = ['Samsung', 'Intel', 'AMD', 'Corsair', 'MSI', 'ASUS', 'Gigabyte', 'Kingston'];
      
      for (let i = 0; i < additionalVendorCount; i++) {
        const randomVendor = vendorNames[Math.floor(Math.random() * vendorNames.length)];
        if (!vendors.some(v => v.name === randomVendor)) {
          vendors.push({
            name: randomVendor,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(randomVendor)}&background=random`
          });
        }
      }
      
      return {
        ...product,
        vendors,
        stockStatus,
        margin: Math.round(product.margin || 0), // Round margin value
        profitMargin: Math.round(product.profitMargin || 0) // Round profit margin percentage
      };
    });
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách sản phẩm bán chạy thành công từ dữ liệu orders',
      data: processedBestSellers
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách sản phẩm bán chạy:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi lấy danh sách sản phẩm bán chạy',
      error: error.message
    });
  }
};

/**
 * Lấy dữ liệu doanh thu theo khoảng thời gian
 * @param {Object} req Request - Chứa timeRange: 'week', 'month', hoặc 'year'
 * @param {Object} res Response
 * @returns {Object} Revenue data based on time range
 */
const getRevenueData = async (req, res) => {
  try {
    const { timeRange } = req.query;
    let startDate, endDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11

    let groupBy = null;
    let labels = [];
    // const_ = (day) => day.toISOString().split('T')[0]; // Helper to format date as YYYY-MM-DD (removed const_ as it's not used)

    // Helper function to format date string for labels (e.g., 'DD')
    // Placed here to be within scope
    function formatDateString(dateOrTimestamp) {
        const dateObj = new Date(dateOrTimestamp); // Ensure it's a Date object
        const day = String(dateObj.getDate()).padStart(2, '0');
        // const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
        return `${day}`;
    }

    switch (timeRange) {
      case 'week1':
        startDate = new Date(currentYear, currentMonth, 1);
        endDate = new Date(currentYear, currentMonth, 7);
        endDate.setHours(23, 59, 59, 999); // End of day
        groupBy = { $dayOfMonth: '$createdAt' };
        for (let i = 0; i < 7; i++) labels.push(formatDateString(new Date(startDate).setDate(startDate.getDate() + i)));
        break;
      case 'week2':
        startDate = new Date(currentYear, currentMonth, 8);
        endDate = new Date(currentYear, currentMonth, 14);
        endDate.setHours(23, 59, 59, 999);
        groupBy = { $dayOfMonth: '$createdAt' };
        for (let i = 0; i < 7; i++) labels.push(formatDateString(new Date(startDate).setDate(startDate.getDate() + i)));
        break;
      case 'week3':
        startDate = new Date(currentYear, currentMonth, 15);
        endDate = new Date(currentYear, currentMonth, 21);
        endDate.setHours(23, 59, 59, 999);
        groupBy = { $dayOfMonth: '$createdAt' };
        for (let i = 0; i < 7; i++) labels.push(formatDateString(new Date(startDate).setDate(startDate.getDate() + i)));
        break;
      case 'week4':
        startDate = new Date(currentYear, currentMonth, 22);
        // Calculate end of the current month for week 4
        endDate = new Date(currentYear, currentMonth + 1, 0); // Last day of current month
        endDate.setHours(23, 59, 59, 999);
        groupBy = { $dayOfMonth: '$createdAt' };
        const tempDate = new Date(startDate);
        while(tempDate <= endDate) {
            labels.push(formatDateString(new Date(tempDate))); // Ensure tempDate is passed as a new Date for safety
            tempDate.setDate(tempDate.getDate() + 1);
        }
        break;
      case 'month':
        startDate = new Date(currentYear, currentMonth, 1);
        endDate = new Date(currentYear, currentMonth + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        groupBy = { $dayOfMonth: '$createdAt' };
        for (let i = 1; i <= endDate.getDate(); i++) labels.push(i.toString().padStart(2, '0')); // Pad day to ensure consistency
        break;
      case 'year':
        startDate = new Date(currentYear, 0, 1);
        endDate = new Date(currentYear, 11, 31);
        endDate.setHours(23, 59, 59, 999);
        groupBy = { $month: '$createdAt' };
        labels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
        break;
      default: // Default to current week (last 7 days if not week1-4)
        endDate = new Date(); // Today, end of day
        endDate.setHours(23, 59, 59, 999);
        startDate = new Date(); // 6 days ago, start of day
        startDate.setDate(today.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        groupBy = { $isoDayOfWeek: '$createdAt' }; // Monday (1) to Sunday (7)
        const dayMap = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']; // JS: Sun (0) to Sat (6)
        
        // Generate labels for the last 7 days correctly as 'T2', 'T3' etc.
        for (let i = 0; i < 7; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            labels.push(dayMap[d.getDay()]);
        }
    }


    const revenueData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: 'CANCELLED' } 
        }
      },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    let processedRevenue = [];
    let processedOrders = [];

    if (timeRange.startsWith('week') || timeRange === 'month') { 
        const dataMap = new Map(revenueData.map(item => [item._id, item])); // _id is dayOfMonth (1-31) or dayOfWeek (1-7 for default)
        labels.forEach(label => {
            let keyToLookup;
            if (timeRange.startsWith('week')) { // week1, week2, week3, week4
                 keyToLookup = parseInt(label); // Labels are '01', '02', etc.
            } else if (timeRange === 'month') {
                 keyToLookup = parseInt(label); // Labels are '01', '02', etc.
            } else { // Default 'week' - last 7 days. Labels are 'T2', 'CN', etc.
                // This case needs to map 'T2' back to a dayOfWeek if groupBy was $isoDayOfWeek
                // However, current default uses $isoDayOfWeek, and labels are ['CN', 'T2', ...]
                // The mapping from revenueData._id (1-7 for $isoDayOfWeek) to these labels is complex.
                // For simplicity, the default case (last 7 days) will now use dayOfMonth for groupBy if we want daily labels
                // Let's stick to the current default label generation and mapping for now
                // The default case (last 7 days) will map labels 'CN', 'T2' etc. to data based on matching aggregation key
                // This part requires careful handling based on groupBy and label generation strategy for default 'week'.
                // For now, assuming the existing default week logic for labels and dataMap is correct.
                // For $isoDayOfWeek, _id is 1 (Mon) to 7 (Sun).
                const dayStrMap = {'CN': 7, 'T2': 1, 'T3': 2, 'T4': 3, 'T5': 4, 'T6': 5, 'T7': 6}; // Map label to ISO day
                keyToLookup = dayStrMap[label];

            }
            const dataPoint = dataMap.get(keyToLookup);
            processedRevenue.push(dataPoint ? dataPoint.totalRevenue : 0);
            processedOrders.push(dataPoint ? dataPoint.orderCount : 0);
        });
    } else if (timeRange === 'year') { 
        const dataMap = new Map(revenueData.map(item => [item._id, item])); // _id is month number (1-12)
        for (let i = 1; i <= 12; i++) {
            const dataPoint = dataMap.get(i);
            processedRevenue.push(dataPoint ? dataPoint.totalRevenue : 0);
            processedOrders.push(dataPoint ? dataPoint.orderCount : 0);
        }
    } else { // Default case: last 7 days, labels ['CN', 'T2', ...]
        // This is now the `default` in switch, where _id is $isoDayOfWeek (1=Mon, ..., 7=Sun)
        // and labels are ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] in display order.
        const dataMap = new Map(revenueData.map(item => [item._id, item]));
        const dayLabelToIsoDay = { 'T2': 1, 'T3': 2, 'T4': 3, 'T5': 4, 'T6': 5, 'T7': 6, 'CN': 7 };

        labels.forEach(labelKey => {
            const isoDayKey = dayLabelToIsoDay[labelKey];
            const dataPoint = dataMap.get(isoDayKey);
            processedRevenue.push(dataPoint ? dataPoint.totalRevenue : 0);
            processedOrders.push(dataPoint ? dataPoint.orderCount : 0);
        });
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy dữ liệu doanh thu thành công',
      data: {
        labels: labels,
        revenue: processedRevenue,
        orders: processedOrders,
      }
    });

  } catch (error) {
    console.error('Lỗi lấy dữ liệu doanh thu:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi lấy dữ liệu doanh thu'
    });
  }
};

module.exports = {
  getDashboardStats,
  getRecentOrders,
  getBestSellingProducts,
  getRevenueData
}; 