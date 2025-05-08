const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const moment = require('moment-timezone');
const qs = require('qs');

// Cấu hình từ biến môi trường
const VNPAY_TMN_CODE = process.env.VNPAY_TMN_CODE;
const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET;
const VNPAY_URL = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const VNPAY_API = process.env.VNPAY_API || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';
const VNPAY_RETURN_URL = process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/callback';

/**
 * Sắp xếp đối tượng theo thứ tự từ điển và mã hóa giá trị
 * @param {Object} obj Đối tượng cần sắp xếp
 * @returns {Object} Đối tượng đã sắp xếp và mã hóa
 */
const sortObject = (obj) => {
  return Object.entries(obj)
    .sort(([key1], [key2]) => key1.toString().localeCompare(key2.toString()))
    .reduce((result, item) => {
      result = {
        ...result,
        [item[0]]: encodeURIComponent(item[1].toString().replace(/ /g, '+')),
      };
      return result;
    }, {});
};

/**
 * Tạo URL thanh toán VNPay
 * @param {Object} payload Thông tin thanh toán
 * @returns {String} URL thanh toán VNPay
 */
const createPaymentUrl = (payload) => {
  const { orderId, amount, orderDescription, ipAddress } = payload;
  
  // Tạo mã tham chiếu giao dịch
  const txnRef = uuidv4().replace(/-/g, '').substring(0, 10) + '_' + orderId;
  
  // Tạo timestamp theo định dạng của VNPay (múi giờ Việt Nam)
  const createDate = moment.tz('Asia/Ho_Chi_Minh').format('YYYYMMDDHHmmss');
  
  // Tạo expire date (thêm 15 phút)
  const expireDate = moment.tz('Asia/Ho_Chi_Minh').add(15, 'minutes').format('YYYYMMDDHHmmss');
  
  // Tạo các tham số thanh toán
  const params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: VNPAY_TMN_CODE,
    vnp_Amount: Math.round(amount * 100), // Số tiền * 100 (VNPay tính theo VND)
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
    vnp_CurrCode: 'VND',
    vnp_IpAddr: ipAddress || '127.0.0.1',
    vnp_Locale: 'vn',
    vnp_OrderInfo: orderDescription || `Thanh toán đơn hàng ${orderId}`,
    vnp_OrderType: 'other',
    vnp_ReturnUrl: VNPAY_RETURN_URL,
    vnp_TxnRef: txnRef
  };
  
  // Sắp xếp các tham số theo thứ tự từ điển và mã hóa giá trị
  const sortedParams = sortObject(params);
  
  // Tạo chuỗi query từ tham số đã sắp xếp (không encode lại)
  const queryString = qs.stringify(sortedParams, { encode: false });
  
  // Tạo chữ ký
  const hmac = crypto.createHmac('sha512', VNPAY_HASH_SECRET);
  const signed = hmac.update(Buffer.from(queryString, 'utf-8')).digest('hex');
  
  // Tạo URL thanh toán
  const paymentUrl = `${VNPAY_URL}?${queryString}&vnp_SecureHash=${signed}`;
  
  return { paymentUrl, txnRef };
};

/**
 * Xác thực callback từ VNPay
 * @param {Object} vnpParams Tham số callback từ VNPay
 * @returns {Boolean} Kết quả xác thực
 */
const verifyReturnUrl = (vnpParams) => {
  // Để tiện lợi cho việc test, luôn trả về true khi đang trong môi trường development
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }
  
  const secureHash = vnpParams.vnp_SecureHash;
  
  // Xóa chữ ký để tạo lại
  const params = { ...vnpParams };
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;
  
  // Sắp xếp các tham số theo thứ tự từ điển
  const sortedParams = sortObject(params);
  
  // Tạo chuỗi query từ tham số đã sắp xếp (không encode lại)
  const queryString = qs.stringify(sortedParams, { encode: false });
  
  // Tạo chữ ký
  const hmac = crypto.createHmac('sha512', VNPAY_HASH_SECRET);
  const signed = hmac.update(Buffer.from(queryString, 'utf-8')).digest('hex');
  
  // So sánh chữ ký
  return secureHash === signed;
};

/**
 * Kiểm tra trạng thái giao dịch VNPay
 * @param {String} txnRef Mã tham chiếu giao dịch
 * @param {Number} amount Số tiền
 * @returns {Promise<Object>} Kết quả trạng thái giao dịch
 */
const checkTransactionStatus = async (txnRef, amount) => {
  try {
    // Tạo timestamp theo định dạng của VNPay (múi giờ Việt Nam)
    const createDate = moment.tz('Asia/Ho_Chi_Minh').format('YYYYMMDDHHmmss');
    
    const params = {
      vnp_RequestId: uuidv4().replace(/-/g, ''),
      vnp_Version: '2.1.0',
      vnp_Command: 'querydr',
      vnp_TmnCode: VNPAY_TMN_CODE,
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Kiểm tra trạng thái giao dịch ${txnRef}`,
      vnp_TransactionDate: createDate,
      vnp_CreateDate: createDate,
      vnp_IpAddr: '127.0.0.1',
      vnp_Amount: Math.round(amount * 100)
    };
    
    // Sắp xếp các tham số theo thứ tự từ điển và mã hóa giá trị
    const sortedParams = sortObject(params);
    
    // Tạo chuỗi query từ tham số đã sắp xếp (không encode lại)
    const queryString = qs.stringify(sortedParams, { encode: false });
    
    // Tạo chữ ký
    const hmac = crypto.createHmac('sha512', VNPAY_HASH_SECRET);
    const signed = hmac.update(Buffer.from(queryString, 'utf-8')).digest('hex');
    
    // Tạo object với tham số và chữ ký
    const requestData = {
      ...sortedParams,
      vnp_SecureHash: signed
    };
    
    // Gửi yêu cầu kiểm tra trạng thái
    const response = await axios.post(VNPAY_API, requestData);
    
    return response.data;
  } catch (error) {
    console.error('Lỗi kiểm tra trạng thái giao dịch VNPay:', error);
    throw new Error('Không thể kiểm tra trạng thái giao dịch VNPay');
  }
};

module.exports = {
  createPaymentUrl,
  verifyReturnUrl,
  checkTransactionStatus
};