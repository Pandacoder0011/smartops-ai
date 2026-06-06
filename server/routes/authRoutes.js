import express from 'express';
import rateLimit from 'express-rate-limit';
import { 
  register, 
  login, 
  getMe, 
  logout, 
  updateProfile, 
  changePassword 
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Strict rate limiter for login to prevent brute force attacks (max 5 attempts per 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 attempts per windowMs
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes 🔐'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public endpoints
router.post('/register', register);
router.post('/login', loginLimiter, login);

// Protected endpoints
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

export default router;
