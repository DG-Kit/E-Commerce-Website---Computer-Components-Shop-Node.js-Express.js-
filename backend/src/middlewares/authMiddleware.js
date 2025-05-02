const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ msg: "Không có token, truy cập bị từ chối" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // gắn user vào request
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token không hợp lệ" });
  }
};
