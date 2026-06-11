import express from 'express';
import multer from 'multer';
import path from 'path';
import { getMetrics, updateMetric, uploadCSV } from '../controllers/dashboardController.js';
import { protect } from '../middleware/clerkAuth.js';

const router = express.Router();

// Apply protect middleware to secure all dashboard endpoints
router.use(protect);

// Configure multer for CSV uploads
const uploadDir = 'uploads/';
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// File filter for CSV
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed!'), false);
  }
};

const upload = multer({ storage, fileFilter });

// Define endpoints
router.route('/metrics')
  .get(getMetrics)
  .post(updateMetric);

router.post('/upload', upload.single('file'), uploadCSV);

export default router;
