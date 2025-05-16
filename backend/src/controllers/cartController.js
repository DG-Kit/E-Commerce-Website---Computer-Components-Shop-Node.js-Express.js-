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

    // Kiểm tra số lượng tồn kho của variant
    if (variant.stock < quantity) {
      return res.status(400).json({ 
        msg: `Số lượng vượt quá tồn kho. Hiện có ${variant.stock} sản phẩm trong kho.`,
        availableStock: variant.stock 
      });
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
      // Kiểm tra tổng số lượng sau khi cộng thêm có vượt quá tồn kho không
      const newQuantity = cartItem.quantity + quantity;
      if (newQuantity > variant.stock) {
        return res.status(400).json({ 
          msg: `Số lượng vượt quá tồn kho. Hiện có ${variant.stock} sản phẩm trong kho.`,
          availableStock: variant.stock,
          currentCartQuantity: cartItem.quantity
        });
      }
      
      cartItem.quantity = newQuantity; // Cập nhật số lượng nếu đã tồn tại
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

    // Kiểm tra sản phẩm và variant có tồn tại không
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ msg: 'Sản phẩm không tồn tại' });
    }

    // Kiểm tra variant có tồn tại trong sản phẩm không
    const variant = product.variants.find(v => v._id.toString() === variantId);
    if (!variant) {
      return res.status(404).json({ msg: 'Biến thể không tồn tại trong sản phẩm' });
    }

    // Kiểm tra số lượng tồn kho trước khi cập nhật
    if (quantity > variant.stock) {
      return res.status(400).json({ 
        msg: `Số lượng vượt quá tồn kho. Hiện có ${variant.stock} sản phẩm trong kho.`,
        availableStock: variant.stock 
      });
    }

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

    let cart = await Cart.findOne({ user: userId })
      .populate('items.product');

    if (!cart) {
      return res.status(200).json({ cart: [] }); // Trả về giỏ hàng rỗng nếu chưa có
    }

    // Enhance cart items with variant information from the product
    const enhancedItems = await Promise.all(cart.items.map(async (item) => {
      // Find the variant from the product
      const product = item.product;
      const variantId = item.variant.toString();
      
      // Find the matching variant from the product's variants array
      const variant = product.variants.find(v => v._id.toString() === variantId);
      
      return {
        product: {
          _id: product._id,
          name: product.name,
          images: product.images
        },
        variant: variant ? {
          _id: variant._id,
          name: variant.name, 
          price: variant.price,
          stock: variant.stock // Include stock information
        } : { 
          _id: variantId, 
          name: 'Không xác định', 
          price: 0,
          stock: 0 
        },
        quantity: item.quantity,
        _id: item._id
      };
    }));

    res.status(200).json({ cart: enhancedItems });
  } catch (error) {
    res.status(500).json({ msg: 'Lỗi server', error: error.message });
  }
};