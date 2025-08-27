import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const authMiddleware = (req, res, next) => {
  const { token } = req.headers;
  if (!token) return res.json({ success: false, message: 'Not Authorized Login Again' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.body.userId = decoded.id;
    next();
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export default authMiddleware;
