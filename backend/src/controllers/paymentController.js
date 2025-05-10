const Order = require('../models/Order');
const Payment = require('../models/Payment');
const User = require('../models/User');
const vnpayService = require('../services/vnpayService');
const nodemailer = require('nodemailer');

/**
 * Tạo URL thanh toán VNPay
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Object} Response
 */
const createVNPayUrl = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Thiếu mã đơn hàng' });
    }
    
    // Lấy thông tin đơn hàng
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }
    
    // Kiểm tra xem đơn hàng đã thanh toán chưa
    if (order.isPaid) {
      return res.status(400).json({ success: false, message: 'Đơn hàng này đã được thanh toán' });
    }
    
    // Kiểm tra xem đơn hàng có thuộc về người dùng hiện tại không
    if (order.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập đơn hàng này' });
    }
    
    // Tạo URL thanh toán VNPay với số tiền từ đơn hàng
    const payload = {
      orderId: orderId,
      amount: order.totalAmount,
      orderDescription: `Thanh toán đơn hàng ${orderId}`,
      ipAddress: req.ip || '127.0.0.1'
    };
    
    const { paymentUrl, txnRef } = vnpayService.createPaymentUrl(payload);
    
    // Lưu thông tin thanh toán
    await Payment.create({
      userId: order.userId,
      orderId: order._id,
      amount: order.totalAmount,
      paymentMethod: 'VNPAY',
      vnpayTxnRef: txnRef,
      status: 'PENDING'
    });
    
    // Cập nhật phương thức thanh toán cho đơn hàng
    order.paymentMethod = 'VNPAY';
    await order.save();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Tạo URL thanh toán thành công', 
      data: { paymentUrl, txnRef } 
    });
  } catch (error) {
    console.error('Lỗi tạo URL thanh toán VNPay:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Đã có lỗi xảy ra khi tạo URL thanh toán' 
    });
  }
};

/**
 * Xử lý callback từ VNPay
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Object} Response
 */
const vnpayReturn = async (req, res) => {
  try {
    const vnpParams = req.query;
    
    // Xác thực callback từ VNPay
    const isValidSignature = vnpayService.verifyReturnUrl(vnpParams);
    if (!isValidSignature) {
      return res.status(400).json({ 
        success: false, 
        message: 'Chữ ký không hợp lệ' 
      });
    }
    
    // Lấy mã tham chiếu giao dịch
    const txnRef = vnpParams.vnp_TxnRef;
    
    // Tìm thông tin thanh toán
    const payment = await Payment.findOne({ vnpayTxnRef: txnRef });
    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy thông tin thanh toán' 
      });
    }
    
    // Kiểm tra xem thanh toán đã hoàn thành chưa
    if (payment.status === 'COMPLETED') {
      return res.status(400).json({ 
        success: false, 
        message: 'Thanh toán này đã được xử lý trước đó' 
      });
    }
    
    // Kiểm tra mã response từ VNPay
    const vnpResponseCode = vnpParams.vnp_ResponseCode;
    
    // Cập nhật thông tin thanh toán
    payment.vnpayTransactionNo = vnpParams.vnp_TransactionNo;
    payment.vnpayBankCode = vnpParams.vnp_BankCode;
    payment.vnpayResponseCode = vnpResponseCode;
    
    // Lấy thông tin đơn hàng
    const order = await Order.findById(payment.orderId);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy thông tin đơn hàng' 
      });
    }
    
    if (vnpResponseCode === '00') {
      // Thanh toán thành công
      payment.status = 'COMPLETED';
      payment.paymentDate = new Date();
      
      // Cập nhật đơn hàng
      order.isPaid = true;
      order.paidAt = new Date();
      
      // Cập nhật trạng thái đơn hàng từ PENDING sang PROCESSING
      if (order.status === 'PENDING') {
        order.status = 'PROCESSING';
        // Thêm vào lịch sử trạng thái
        order.statusHistory.push({
          status: 'PROCESSING',
          updatedAt: new Date()
        });
      }
      
      // Cập nhật điểm thưởng cho người dùng (10% tổng giá trị đơn hàng)
      const pointsEarned = Math.floor(order.totalAmount * 0.1);
      order.pointsEarned = pointsEarned;
      await order.save();
      
      // Cập nhật điểm thưởng cho người dùng
      const user = await User.findById(order.userId);
      user.loyaltyPoints = (user.loyaltyPoints || 0) + pointsEarned;
      await user.save();
      
      // Gửi email xác nhận thanh toán
      sendPaymentConfirmationEmail(order, payment);
      
      await payment.save();
      
      return res.status(200).json({ 
        success: true, 
        message: 'Thanh toán thành công', 
        data: {
          orderId: order._id,
          transactionId: payment._id,
          amount: payment.amount,
          paymentDate: payment.paymentDate,
          paymentMethod: payment.paymentMethod,
          pointsEarned
        }
      });
    } else {
      // Thanh toán thất bại
      payment.status = 'FAILED';
      await payment.save();
      
      // Không cập nhật trạng thái của đơn hàng sang CANCELLED để người dùng có thể thử thanh toán lại
      // Nếu muốn hủy đơn sau một số lần thất bại, có thể triển khai thêm logic ở đây
      
      return res.status(400).json({ 
        success: false, 
        message: 'Thanh toán không thành công, vui lòng thử lại hoặc chọn phương thức thanh toán khác', 
        data: {
          orderId: order._id,
          responseCode: vnpResponseCode
        } 
      });
    }
  } catch (error) {
    console.error('Lỗi xử lý callback VNPay:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Đã có lỗi xảy ra khi xử lý thanh toán' 
    });
  }
};

/**
 * Gửi email xác nhận thanh toán
 * @param {Object} order Thông tin đơn hàng
 * @param {Object} payment Thông tin thanh toán
 */
const sendPaymentConfirmationEmail = async (order, payment) => {
  try {
    // Kiểm tra cấu hình email trong biến môi trường
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Thiếu cấu hình email, bỏ qua gửi email');
      return;
    }
    
    // Lấy thông tin người dùng
    const user = await User.findById(order.userId);
    if (!user || !user.email) {
      console.log('Không tìm thấy email người dùng, bỏ qua gửi email');
      return;
    }
    
    // Cấu hình transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // Tạo nội dung email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Xác nhận thanh toán đơn hàng #${order._id}`,
      html: `
        <h1>Xác nhận thanh toán</h1>
        <p>Cảm ơn bạn đã mua hàng tại cửa hàng của chúng tôi!</p>
        <h2>Thông tin đơn hàng</h2>
        <p><strong>Mã đơn hàng:</strong> ${order._id}</p>
        <p><strong>Ngày đặt hàng:</strong> ${new Date(order.createdAt).toLocaleString('vi-VN')}</p>
        <p><strong>Tổng tiền:</strong> ${order.totalAmount.toLocaleString('vi-VN')} VNĐ</p>
        <p><strong>Phương thức thanh toán:</strong> VNPay</p>
        <p><strong>Trạng thái thanh toán:</strong> Đã thanh toán</p>
        <p><strong>Điểm thưởng nhận được:</strong> ${order.pointsEarned}</p>
        <h2>Thông tin sản phẩm</h2>
        <table border="1" cellpadding="5" style="border-collapse: collapse;">
          <tr>
            <th>Sản phẩm</th>
            <th>Số lượng</th>
            <th>Đơn giá</th>
            <th>Thành tiền</th>
          </tr>
          ${order.items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>${item.price.toLocaleString('vi-VN')} VNĐ</td>
              <td>${(item.price * item.quantity).toLocaleString('vi-VN')} VNĐ</td>
            </tr>
          `).join('')}
        </table>
        <p>Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi!</p>
      `
    };
    
    // Gửi email
    await transporter.sendMail(mailOptions);
    console.log('Đã gửi email xác nhận thanh toán');
  } catch (error) {
    console.error('Lỗi gửi email xác nhận thanh toán:', error);
  }
};

/**
 * Lấy lịch sử thanh toán của người dùng
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Object} Response
 */
const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const payments = await Payment.find({ userId })
      .sort({ createdAt: -1 })
      .populate('orderId', 'totalAmount status createdAt');
    
    return res.status(200).json({ 
      success: true, 
      message: 'Lấy lịch sử thanh toán thành công', 
      data: payments 
    });
  } catch (error) {
    console.error('Lỗi lấy lịch sử thanh toán:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Đã có lỗi xảy ra khi lấy lịch sử thanh toán' 
    });
  }
};

module.exports = {
  createVNPayUrl,
  vnpayReturn,
  getPaymentHistory
};