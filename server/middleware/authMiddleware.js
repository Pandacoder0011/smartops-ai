import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { mockUsers } from '../controllers/authController.js';

/**
 * Express middleware to validate JWT token in Authorization headers.
 * Resolves CastErrors when database connection goes down by matching mock user string accounts.
 * 
 * @param {import('express').Request} req - Express request instance.
 * @param {import('express').Response} res - Express response instance.
 * @param {import('express').NextFunction} next - Express next middleware router.
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smartops_jwt_secret_dev_key');

      if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(decoded.id)) {
        // Look up user in memory, or use default admin profile
        const mockUser = mockUsers.find(u => u._id === decoded.id);
        req.user = mockUser || {
          _id: decoded.id || 'mock-admin-id-123',
          name: 'Demo Admin',
          email: 'admin@smartops.ai',
          role: 'admin',
          company: 'SmartOps AI Mock',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256'
        };
      } else {
        req.user = await User.findById(decoded.id).select('-password');
      }
      
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

/**
 * Express middleware to restrict route access by user roles (e.g. admin, viewer).
 * 
 * @param {...string} roles - Permitted user role lists.
 * @returns {function(import('express').Request, import('express').Response, import('express').NextFunction): void}
 */
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
