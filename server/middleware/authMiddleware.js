import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smartops_jwt_secret_dev_key');

      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user profile not found 🚨' });
      }
      
      return next();
    } catch (error) {
      console.error('🔴 Token verification failed:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed 🔑' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided 🛡️' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user?.role || 'unknown'}' is not authorized to access this resource 🚫`
      });
    }
    next();
  };
};
