const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');

/**
 * Tạo đơn hàng mới
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Object} Response
 */
const createOrder = async (req, res) => {
  // Khởi tạo session với MongoDB để sử dụng transaction
  const session = await mongoose.startSession();
  session.startTransaction();

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
      pointsUsed,
      shippingFee = 0
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

    // Khởi tạo biến tính toán giá trị đơn hàng
    let subtotal = 0;
    let discountAmount = 0;
    
    // Tạo danh sách cho các items đơn hàng
    const orderItems = [];
    
    // Sử dụng Map để lưu trữ sản phẩm theo ID, tránh truy vấn nhiều lần cho cùng sản phẩm
    const productMap = new Map();
    
    // Nhóm các item theo productId
    const productGroups = {};
    items.forEach(item => {
      if (!productGroups[item.productId]) {
        productGroups[item.productId] = [];
      }
      productGroups[item.productId].push(item);
    });
    
    // Xử lý từng sản phẩm
    for (const productId of Object.keys(productGroups)) {
      // Lấy thông tin sản phẩm, chỉ truy vấn 1 lần cho mỗi sản phẩm
      const product = await Product.findById(productId).session(session);
      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy sản phẩm với ID: ${productId}`
        });
      }
      
      // Lưu vào map để xử lý sau
      productMap.set(productId, product);
      
      // Xử lý từng item của sản phẩm này (có thể là nhiều variant khác nhau)
      for (const item of productGroups[productId]) {
        const variantId = item.variantId;
        let variantName = '';
        let price = 0;
        
        if (variantId) {
          // Tìm variant trong mảng variants của sản phẩm
          const variantIndex = product.variants.findIndex(v => v._id.toString() === variantId);
          if (variantIndex === -1) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
              success: false,
              message: `Không tìm thấy biến thể với ID: ${variantId} cho sản phẩm: ${product.name}`
            });
          }

          const variant = product.variants[variantIndex];
          if (variant.stock < item.quantity) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
              success: false,
              message: `Biến thể "${variant.name}" của sản phẩm "${product.name}" chỉ còn ${variant.stock} trong kho, không đủ số lượng yêu cầu`
            });
          }

          // Giảm số lượng trong kho của variant
          product.variants[variantIndex].stock -= item.quantity;
          variantName = variant.name;
          price = variant.price;
        } else {
          // Nếu không có variant, sử dụng thông tin từ sản phẩm chính
          if (product.stock < item.quantity) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
              success: false,
              message: `Sản phẩm "${product.name}" chỉ còn ${product.stock} trong kho, không đủ số lượng yêu cầu`
            });
          }

          // Giảm số lượng trong kho của sản phẩm chính
          product.stock -= item.quantity;
          price = product.price || product.minPrice;
        }

        // Tính tổng giá trị sản phẩm và cộng vào subtotal
        const itemTotal = price * item.quantity;
        subtotal += itemTotal;

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
      
      // Cập nhật lại tổng stock từ các variants sau khi xử lý tất cả các item của sản phẩm này
      if (product.variants && product.variants.length > 0) {
        product.stock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
      }
    }

    // Xử lý mã giảm giá nếu có
    if (discountCode) {
      try {
        // Áp dụng mã giảm giá
        const couponResult = await applyCoupon(discountCode, subtotal, null, userId, session);
        discountAmount = couponResult.discountAmount;
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: error.message || 'Mã giảm giá không hợp lệ'
        });
      }
    }

    // Xử lý điểm tích lũy nếu có
    let pointsDiscount = 0;
    if (pointsUsed && pointsUsed > 0) {
      // Kiểm tra xem người dùng có đủ điểm không
      const user = await User.findById(userId).session(session);
      if (!user || user.points < pointsUsed) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: 'Không đủ điểm tích lũy'
        });
      }
      
      // Quy đổi điểm thành tiền (giả sử 1 điểm = 1000 VND)
      pointsDiscount = pointsUsed * 1000;
      
      // Đảm bảo số tiền giảm không vượt quá tổng giá trị đơn hàng
      if (pointsDiscount > subtotal) {
        pointsDiscount = subtotal;
        // Điều chỉnh lại số điểm sử dụng
        pointsUsed = Math.floor(subtotal / 1000);
      }
    }
    
    // Tính tổng giảm giá
    discountAmount = discountAmount + pointsDiscount;
    
    // Tính tổng số tiền đơn hàng
    const totalAmount = subtotal + shippingFee - discountAmount;

    // Tính toán điểm thưởng (10% tổng đơn hàng)
    const pointsEarned = Math.floor(totalAmount * 0.1);

    // Đảm bảo userId là một giá trị hợp lệ
    if (!userId) {
      await session.abortTransaction();
      session.endSession();
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
    
    // Lưu đơn hàng
    const savedOrder = await newOrder.save({ session });
    
    // Nếu có áp dụng mã giảm giá và chưa cập nhật orderId
    if (discountCode && savedOrder) {
      try {
        // Cập nhật lại orderId trong mã giảm giá
        await updateCouponUsage(discountCode, savedOrder._id, userId, session);
      } catch (error) {
        console.error('Lỗi cập nhật mã giảm giá:', error);
        // Không cần abort transaction, chỉ log lỗi
      }
    }
    
    // Lưu các sản phẩm đã cập nhật
    for (const product of productMap.values()) {
      await product.save({ session });
    }
    
    console.log('Đơn hàng sau khi lưu:', JSON.stringify(savedOrder));

    // Nếu thanh toán là COD, cập nhật trạng thái đơn hàng thành PROCESSING
    if (paymentMethod === 'COD') {
      savedOrder.status = 'PROCESSING';
      savedOrder.statusHistory.push({
        status: 'PROCESSING',
        updatedAt: new Date()
      });
      await savedOrder.save({ session });
    }

    // Nếu người dùng sử dụng điểm thưởng, cập nhật lại điểm thưởng của người dùng
    if (pointsUsed && pointsUsed > 0) {
      const user = await User.findById(userId).session(session);
      if (user) {
        user.points = Math.max(0, (user.points || 0) - pointsUsed);
        await user.save({ session });
      }
    }

    // Xóa sản phẩm khỏi giỏ hàng
    const userCart = await Cart.findOne({ user: userId }).session(session);
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
      
      await userCart.save({ session });
    }

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công',
      data: savedOrder
    });
  } catch (error) {
    // Nếu có lỗi, hủy bỏ tất cả các thay đổi
    await session.abortTransaction();
    session.endSession();
    
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
  // Khởi tạo session với MongoDB để sử dụng transaction
  const session = await mongoose.startSession();
  session.startTransaction();

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

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Nếu đơn hàng đã bị hủy, không cho phép cập nhật trạng thái
    if (order.status === 'CANCELLED') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Không thể cập nhật trạng thái cho đơn hàng đã bị hủy'
      });
    }

    // Xử lý các trường hợp đặc biệt của trạng thái
    if (status === 'CANCELLED') {
      // Nếu đơn hàng đã SHIPPED hoặc DELIVERED, không cho phép hủy
      if (['SHIPPED', 'DELIVERED'].includes(order.status)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: 'Không thể hủy đơn hàng đã được giao hoặc đang vận chuyển'
        });
      }

      // Trả lại số lượng sản phẩm vào kho
      for (const item of order.items) {
        const product = await Product.findById(item.productId).session(session);
        if (product) {
          // Nếu là variant
          if (item.variant) {
            // Tìm variant tương ứng
            const variantIndex = product.variants.findIndex(v => v.name === item.variant);
            if (variantIndex !== -1) {
              // Cộng lại số lượng
              product.variants[variantIndex].stock += item.quantity;
            } else {
              // Nếu không tìm thấy variant (hiếm khi xảy ra), cộng vào stock chính
              product.stock += item.quantity;
            }
          } else {
            // Nếu không phải variant, cộng vào stock chính
            product.stock += item.quantity;
          }

          // Cập nhật lại tổng stock từ các variants
          if (product.variants && product.variants.length > 0) {
            product.stock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
          }

          await product.save({ session });
        }
      }

      // Nếu đơn hàng đã thanh toán, cần xử lý hoàn tiền
      if (order.isPaid) {
        // TODO: Xử lý hoàn tiền cho khách hàng 
        // (có thể thêm logic hoàn tiền ở đây hoặc ghi lại để xử lý thủ công)
        console.log(`Cần hoàn tiền cho đơn hàng ${orderId} - Số tiền: ${order.totalAmount}`);
        
        // Hoàn lại điểm tích lũy đã sử dụng (nếu có)
        if (order.pointsUsed > 0) {
          const user = await User.findById(order.userId).session(session);
          if (user) {
            user.points = (user.points || 0) + order.pointsUsed;
            await user.save({ session });
          }
        }
      }
    } else if (status === 'DELIVERED' && !order.isPaid && order.paymentMethod === 'COD') {
      // Khi đơn hàng COD được giao thành công, cập nhật trạng thái thanh toán
      order.isPaid = true;
      order.paidAt = new Date();
      
      // Nếu đơn hàng có điểm thưởng và chưa được cộng vào tài khoản người dùng
      if (order.pointsEarned > 0) {
        const user = await User.findById(order.userId).session(session);
        if (user) {
          // Cộng điểm thưởng vào tài khoản người dùng
          user.points = (user.points || 0) + order.pointsEarned;
          await user.save({ session });
          console.log(`Đã cộng ${order.pointsEarned} điểm thưởng cho người dùng ${user.email}`);
        }
      }
    }

    // Cập nhật trạng thái
    order.status = status;
    
    // Thêm vào lịch sử trạng thái
    order.statusHistory.push({
      status,
      updatedAt: new Date()
    });

    // Lưu lại
    await order.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: order
    });
  } catch (error) {
    // Nếu có lỗi, hủy bỏ tất cả các thay đổi
    await session.abortTransaction();
    session.endSession();
    
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

/**
 * Hàm cập nhật thông tin sử dụng mã giảm giá sau khi đã tạo đơn hàng
 * @param {String} code Mã giảm giá
 * @param {String} orderId ID đơn hàng
 * @param {String} userId ID người dùng
 * @param {Object} session MongoDB session
 */
const updateCouponUsage = async (code, orderId, userId, session) => {
  try {
    // Tìm mã giảm giá
    const coupon = await Coupon.findOne({ code: code.toUpperCase() }).session(session);
    if (!coupon) {
      throw new Error('Mã giảm giá không tồn tại');
    }
    
    // Tìm record đã sử dụng gần nhất (chưa có orderId)
    const usage = coupon.usedBy.find(
      u => u.userId.toString() === userId.toString() && !u.orderId
    );
    
    if (usage) {
      // Cập nhật thông tin orderId
      usage.orderId = orderId;
    } else {
      // Trường hợp không tìm thấy record, thêm mới
      coupon.usedBy.push({
        orderId,
        userId,
        usedAt: new Date()
      });
      coupon.currentUses += 1;
    }
    
    await coupon.save({ session });
    return true;
  } catch (error) {
    console.error('Lỗi cập nhật thông tin sử dụng mã giảm giá:', error);
    throw error;
  }
};

// Sửa lại chỉ import và sử dụng applyCoupon riêng thay vì import cả controller
const applyCoupon = async (code, amount, orderId, userId, session = null) => {
  try {
    // Tạo query cơ bản
    let query = Coupon.findOne({ code: code.toUpperCase() });
    
    // Thêm session nếu có
    if (session) {
      query = query.session(session);
    }
    
    // Tìm mã giảm giá
    const coupon = await query;
    if (!coupon) {
      throw new Error('Mã giảm giá không tồn tại');
    }
    
    // Kiểm tra tính hợp lệ
    if (!coupon.isValid()) {
      throw new Error('Mã giảm giá đã hết hiệu lực hoặc đã sử dụng hết số lần cho phép');
    }
    
    // Tính toán số tiền giảm
    const discountAmount = coupon.calculateDiscount(amount);
    
    // Nếu có orderId, cập nhật thông tin sử dụng
    if (orderId) {
      coupon.currentUses += 1;
      coupon.usedBy.push({
        orderId,
        userId,
        usedAt: new Date()
      });
      
      // Lưu với session nếu có
      if (session) {
        await coupon.save({ session });
      } else {
        await coupon.save();
      }
    } else {
      // Nếu chưa có orderId (đang tạo đơn hàng), tạm thời lưu userId để cập nhật sau
      // Trong trường hợp này không tăng currentUses vì sẽ được tăng sau khi tạo đơn hàng
      if (!session) {
        // Chỉ lưu nếu không có session, nếu có session sẽ được cập nhật sau bằng updateCouponUsage
        coupon.usedBy.push({
          userId,
          usedAt: new Date()
        });
        await coupon.save();
      }
    }
    
    return {
      code: coupon.code,
      discountAmount
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderDetails,
  updateOrderStatus,
  getAllOrders,
  applyCoupon,
  updateCouponUsage
}; 