import { clerkMiddleware, getAuth, clerkClient } from '@clerk/express';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Explicitly pass Clerk credentials
export const clerkAuthSetup = clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
});

/**
 * Protect middleware using Clerk token verification.
 */
export const protect = async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const userId = auth.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - no Clerk session 🔑'
      });
    }

    let user = null;
    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findOne({ clerkId: userId });

        // If the user profile does not exist in the database, fetch details from Clerk and create it
        if (!user) {
          console.log(`👤 Auto-registering new Clerk user in database: ${userId}`);
          const clerkUser = await clerkClient.users.getUser(userId);
          const email = clerkUser.emailAddresses[0]?.emailAddress || '';
          const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email || 'Clerk User';
          
          user = await User.create({
            clerkId: userId,
            email,
            name,
            avatar: clerkUser.imageUrl || '',
            company: 'SmartOps AI',
            role: 'admin' // default new owners to admin role
          });
        }
      } catch (dbErr) {
        console.error('⚠️ MongoDB Error during Clerk User synchronization:', dbErr.message);
      }
    }

    // Attach user profile with fallback for offline database or webhook delay
    req.user = user || {
      _id: userId,
      clerkId: userId,
      name: 'Demo Admin',
      email: 'admin@smartops.ai',
      role: 'admin',
      company: 'SmartOps AI',
      workspaceId: 'workspace-12345'
    };
    req.clerkUserId = userId;

    next();
  } catch (error) {
    console.error('🔴 Clerk authentication error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed: ' + error.message
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
