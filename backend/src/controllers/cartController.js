const Cart = require('../models/Cart');
const Product = require('../models/Product');

exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, variantId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ msg: 'Sản phẩm không tồn tại' });
    }

    // Kiểm tra variant có tồn tại trong sản phẩm không
    const variant = product.variants.find(v => v._id.toString() === variantId);
    if (!variant) {
      return res.status(404).json({ msg: 'Biến thể không tồn tại trong sản phẩm' });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Kiểm tra nếu sản phẩm và variant đã tồn tại trong giỏ hàng
    const cartItem = cart.items.find(item => 
      item.product.toString() === productId && item.variant.toString() === variantId
    );

    if (cartItem) {
      cartItem.quantity += quantity; // Cập nhật số lượng nếu đã tồn tại
    } else {
      cart.items.push({ product: productId, variant: variantId, quantity }); // Thêm sản phẩm mới
    }

    await cart.save();
    res.status(200).json({ msg: 'Thêm vào giỏ hàng thành công', cart });
  } catch (error) {
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, variantId, quantity } = req.body;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ msg: 'Giỏ hàng không tồn tại' });
    }

    const cartItem = cart.items.find(item => 
      item.product.toString() === productId && item.variant.toString() === variantId
    );

    if (!cartItem) {
      return res.status(404).json({ msg: 'Sản phẩm hoặc biến thể không tồn tại trong giỏ hàng' });
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter(item => 
        !(item.product.toString() === productId && item.variant.toString() === variantId)
      ); // Xóa sản phẩm nếu số lượng <= 0
    } else {
      cartItem.quantity = quantity; // Cập nhật số lượng
    }

    await cart.save();
    res.status(200).json({ msg: 'Cập nhật giỏ hàng thành công', cart });
  } catch (error) {
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, variantId } = req.body;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ msg: 'Giỏ hàng không tồn tại' });
    }

    cart.items = cart.items.filter(item => 
      !(item.product.toString() === productId && item.variant.toString() === variantId)
    );

    await cart.save();
    res.status(200).json({ msg: 'Xóa sản phẩm khỏi giỏ hàng thành công', cart });
  } catch (error) {
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};

exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId })
      .populate('items.product', 'name images')
      .populate('items.variant', 'name price'); // Populate thêm thông tin variant

    if (!cart) {
      return res.status(200).json({ cart: [] }); // Trả về giỏ hàng rỗng nếu chưa có
    }

    res.status(200).json({ cart: cart.items });
  } catch (error) {
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};