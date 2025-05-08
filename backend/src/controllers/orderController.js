const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Product = require('../models/Product');

/**
 * Tạo đơn hàng mới
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Object} Response
 */
const createOrder = async (req, res) => {
  try {
    // Thêm log để debug
    console.log('Authorization header:', req.headers.authorization);
    console.log('User object:', req.user);
    
    // Kiểm tra xem req.user có tồn tại không
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng chưa đăng nhập hoặc phiên đăng nhập đã hết hạn'
      });
    }
    
    const userId = req.user.id;
    console.log('UserId:', userId);
    
    const {
      items,
      shippingAddress,
      paymentMethod,
      discountCode,
      discountAmount,
      pointsUsed,
      subtotal,
      shippingFee,
      totalAmount
    } = req.body;

    // Kiểm tra thông tin cần thiết
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng thêm sản phẩm vào đơn hàng'
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp địa chỉ giao hàng'
      });
    }

    // Nếu tạo đơn hàng từ giỏ hàng
    const orderItems = [];
    
    if (items.length) {
      // Kiểm tra tồn kho cho mỗi sản phẩm
      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Không tìm thấy sản phẩm với ID: ${item.productId}`
          });
        }

        // Tìm variant tương ứng
        const variantId = item.variantId;
        let variantName = '';
        let price = 0;
        let stock = 0;

        if (variantId) {
          // Tìm variant trong mảng variants của sản phẩm
          const variant = product.variants.find(v => v._id.toString() === variantId);
          if (!variant) {
            return res.status(404).json({
              success: false,
              message: `Không tìm thấy biến thể với ID: ${variantId} cho sản phẩm: ${product.name}`
            });
          }

          if (variant.stock < item.quantity) {
            return res.status(400).json({
              success: false,
              message: `Biến thể "${variant.name}" của sản phẩm "${product.name}" chỉ còn ${variant.stock} trong kho, không đủ số lượng yêu cầu`
            });
          }

          // Giảm số lượng trong kho của variant
          variant.stock -= item.quantity;
          variantName = variant.name;
          price = variant.price;
          stock = variant.stock;
        } else {
          // Nếu không có variant, sử dụng thông tin từ sản phẩm chính
          if (product.stock < item.quantity) {
            return res.status(400).json({
              success: false,
              message: `Sản phẩm "${product.name}" chỉ còn ${product.stock} trong kho, không đủ số lượng yêu cầu`
            });
          }

          // Giảm số lượng trong kho của sản phẩm chính
          product.stock -= item.quantity;
          price = product.price || product.minPrice;
          stock = product.stock;
        }

        // Lưu thay đổi vào cơ sở dữ liệu
        await product.save();

        // Thêm vào danh sách sản phẩm trong đơn hàng
        orderItems.push({
          productId: product._id,
          name: product.name,
          quantity: item.quantity,
          price: price,
          variant: variantName,
          image: product.images && product.images.length > 0 ? product.images[0] : ''
        });
      }
    }

    // Tính toán điểm thưởng (10% tổng đơn hàng)
    const pointsEarned = Math.floor(totalAmount * 0.1);

    // Đảm bảo userId là một giá trị hợp lệ
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Không có thông tin người dùng'
      });
    }

    // Tạo đơn hàng mới với userId được xác định rõ ràng
    const newOrder = new Order({
      userId: userId,
      items: orderItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD',
      discountCode,
      discountAmount: discountAmount || 0,
      pointsUsed: pointsUsed || 0,
      pointsEarned,
      subtotal,
      shippingFee: shippingFee || 0,
      totalAmount,
      status: 'PENDING',
      statusHistory: [
        {
          status: 'PENDING',
          updatedAt: new Date()
        }
      ]
    });

    console.log('Đơn hàng trước khi lưu:', JSON.stringify(newOrder));
    const savedOrder = await newOrder.save();
    console.log('Đơn hàng sau khi lưu:', JSON.stringify(savedOrder));

    // Nếu người dùng sử dụng điểm thưởng, cập nhật lại điểm thưởng của người dùng
    if (pointsUsed && pointsUsed > 0) {
      const user = await User.findById(userId);
      if (user) {
        user.points = Math.max(0, (user.points || 0) - pointsUsed);
        await user.save();
      }
    }

    // Xóa sản phẩm khỏi giỏ hàng
    const userCart = await Cart.findOne({ user: userId });
    if (userCart) {
      // Lọc các sản phẩm trong giỏ hàng
      // Chúng ta cần xem xét cả productId và variantId
      userCart.items = userCart.items.filter(cartItem => {
        // Kiểm tra xem sản phẩm này có trong đơn hàng không
        const isInOrder = items.some(orderItem => 
          orderItem.productId.toString() === cartItem.product.toString() && 
          (orderItem.variantId ? orderItem.variantId.toString() === cartItem.variant.toString() : true)
        );
        // Giữ lại các sản phẩm không có trong đơn hàng
        return !isInOrder;
      });
      
      await userCart.save();
    }

    return res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công',
      data: savedOrder
    });
  } catch (error) {
    console.error('Lỗi tạo đơn hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi đặt hàng'
    });
  }
};

/**
 * Lấy tất cả đơn hàng của người dùng hiện tại
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Object} Response
 */
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn hàng thành công',
      data: orders
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách đơn hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi lấy danh sách đơn hàng'
    });
  }
};

/**
 * Lấy chi tiết một đơn hàng
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Object} Response
 */
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Kiểm tra xem đơn hàng có thuộc về người dùng hiện tại không
    // Nếu là admin thì có thể xem tất cả đơn hàng
    if (order.userId.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem đơn hàng này'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy chi tiết đơn hàng thành công',
      data: order
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết đơn hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi lấy chi tiết đơn hàng'
    });
  }
};

/**
 * Cập nhật trạng thái đơn hàng (chỉ cho admin)
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Object} Response
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // Kiểm tra trạng thái hợp lệ
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái đơn hàng không hợp lệ'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Cập nhật trạng thái
    order.status = status;
    
    // Thêm vào lịch sử trạng thái
    order.statusHistory.push({
      status,
      updatedAt: new Date()
    });

    // Lưu lại
    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: order
    });
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái đơn hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi cập nhật trạng thái đơn hàng'
    });
  }
};

/**
 * Lấy tất cả đơn hàng (chỉ cho admin)
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Object} Response
 */
const getAllOrders = async (req, res) => {
  try {
    // Các tham số phân trang và lọc
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Tham số lọc theo ngày
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      };
    } else if (startDate) {
      dateFilter = {
        createdAt: {
          $gte: startDate
        }
      };
    } else if (endDate) {
      dateFilter = {
        createdAt: {
          $lte: endDate
        }
      };
    }

    // Tham số lọc theo trạng thái
    const status = req.query.status;
    const statusFilter = status ? { status } : {};

    // Tổng hợp các bộ lọc
    const filter = {
      ...dateFilter,
      ...statusFilter
    };

    // Đếm tổng số đơn hàng
    const total = await Order.countDocuments(filter);
    
    // Lấy danh sách đơn hàng theo trang
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'email fullName');

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách tất cả đơn hàng thành công',
      data: {
        orders,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Lỗi lấy tất cả đơn hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi lấy tất cả đơn hàng'
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderDetails,
  updateOrderStatus,
  getAllOrders
}; 