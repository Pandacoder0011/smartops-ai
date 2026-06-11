import { clerkMiddleware, getAuth } from '@clerk/express';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Export the setup middleware
export const clerkAuthSetup = clerkMiddleware();

/**
 * Protect middleware using Clerk token verification.
 */
export const protect = async (req, res, next) => {
  try {
    const auth = getAuth(req);
    
    if (!auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed 🔑'
      });
    }

    // Try finding the user by clerkId in Mongoose
    let dbUser = null;
    if (mongoose.connection.readyState === 1) {
      try {
        dbUser = await User.findOne({ clerkId: auth.userId });
      } catch (err) {
        console.error('⚠️ MongoDB Query Error during Clerk Auth:', err.message);
      }
    }

    // Attach user profile with fallback for offline database or webhook delay
    req.user = dbUser || {
      _id: auth.userId, // use clerkId as fallback primary key
      clerkId: auth.userId,
      name: 'Demo Admin',
      email: 'admin@smartops.ai',
      role: 'admin',
      company: 'SmartOps AI',
      workspaceId: 'workspace-12345'
    };

    next();
  } catch (error) {
    console.error('🔴 Clerk authentication error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, authentication error 🚨'
    });
  }
};

/**
 * Authorize middleware to restrict routes based on user role.
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
