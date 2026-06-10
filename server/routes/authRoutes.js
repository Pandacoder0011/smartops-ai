import express from 'express';
import rateLimit from 'express-rate-limit';
import { 
  register, 
  login, 
  getMe, 
  logout, 
  updateProfile, 
  changePassword,
  googleAuth
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Strict rate limiter for login to prevent brute force attacks (max 1000 attempts per 15 minutes for local demo)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 attempts per windowMs (relaxed for testing)
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
router.post('/google', googleAuth);

// Protected endpoints
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

export default router;
