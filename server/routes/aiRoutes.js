import express from 'express';
import { 
  chat, 
  getInsights, 
  getPrediction, 
  getHistory 
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all AI-related routes
router.use(protect);

router.post('/chat', chat);
router.get('/insights', getInsights);
router.get('/predict', getPrediction);
router.get('/history', getHistory);

export default router;
