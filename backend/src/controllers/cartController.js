const Cart = require('../models/Cart');
const Product = require('../models/Product');

exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ msg: 'Sản phẩm không tồn tại' });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const cartItem = cart.items.find(item => item.product.toString() === productId);
    if (cartItem) {
      cartItem.quantity += quantity; // Cập nhật số lượng nếu sản phẩm đã có trong giỏ
    } else {
      cart.items.push({ product: productId, quantity }); // Thêm sản phẩm mới vào giỏ
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
    const { productId, quantity } = req.body;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ msg: 'Giỏ hàng không tồn tại' });
    }

    const cartItem = cart.items.find(item => item.product.toString() === productId);
    if (!cartItem) {
      return res.status(404).json({ msg: 'Sản phẩm không tồn tại trong giỏ hàng' });
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter(item => item.product.toString() !== productId); // Xóa sản phẩm nếu số lượng <= 0
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
    const { productId } = req.body;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ msg: 'Giỏ hàng không tồn tại' });
    }

    cart.items = cart.items.filter(item => item.product.toString() !== productId);

    await cart.save();
    res.status(200).json({ msg: 'Xóa sản phẩm khỏi giỏ hàng thành công', cart });
  } catch (error) {
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};

exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId }).populate('items.product', 'name price images');
    if (!cart) {
      return res.status(200).json({ cart: [] }); // Trả về giỏ hàng rỗng nếu chưa có
    }

    res.status(200).json({ cart: cart.items });
  } catch (error) {
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};