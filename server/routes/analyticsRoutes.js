import express from 'express';
import {
  getOverview,
  getSalesTrend,
  getTopProducts,
  getCustomerSegments,
  getInventoryStatus,
  getRevenueByRegion,
  getEmployeePerformance,
  getFinancialSummary
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/clerkAuth.js';

const router = express.Router();

// Apply protect middleware to secure all analytical endpoints
router.use(protect);

router.get('/overview', getOverview);
router.get('/sales-trend', getSalesTrend);
router.get('/top-products', getTopProducts);
router.get('/customer-segments', getCustomerSegments);
router.get('/inventory-status', getInventoryStatus);
router.get('/revenue-by-region', getRevenueByRegion);
router.get('/employee-performance', getEmployeePerformance);
router.get('/financial-summary', getFinancialSummary);

export default router;
