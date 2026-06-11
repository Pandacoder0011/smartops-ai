import express from 'express';
import { protect } from '../middleware/clerkAuth.js';
import mongoose from 'mongoose';
import * as dbControllers from '../controllers/crudController.js';
import * as memoryControllers from '../controllers/crudControllerInMemory.js';

const router = express.Router();

// Helper to route dynamically based on database connection state
const routeHandler = (controllerName) => {
  return (req, res, next) => {
    const useMemory = mongoose.connection.readyState !== 1;
    const controller = useMemory ? memoryControllers[controllerName] : dbControllers[controllerName];
    if (!controller) {
      return res.status(500).json({ success: false, message: `Controller ${controllerName} not found 🚨` });
    }
    return controller(req, res, next);
  };
};

// Apply protect middleware to all routes
router.use(protect);

// Products routes
router.route('/products')
  .get(routeHandler('getProducts'))
  .post(routeHandler('createProduct'));

router.route('/products/bulk-delete')
  .post(routeHandler('bulkDeleteProducts'));

router.route('/products/bulk-status')
  .post(routeHandler('bulkUpdateProductStatus'));

router.route('/products/:id')
  .put(routeHandler('updateProduct'))
  .delete(routeHandler('deleteProduct'));

// Customers routes
router.route('/customers')
  .get(routeHandler('getCustomers'))
  .post(routeHandler('createCustomer'));

router.route('/customers/bulk-delete')
  .post(routeHandler('bulkDeleteCustomers'));

router.route('/customers/:id')
  .put(routeHandler('updateCustomer'))
  .delete(routeHandler('deleteCustomer'));

// Sales routes
router.route('/sales')
  .get(routeHandler('getSales'))
  .post(routeHandler('createSale'));

router.route('/sales/:id')
  .put(routeHandler('updateSale'))
  .delete(routeHandler('deleteSale'));

// Employees routes
router.route('/employees')
  .get(routeHandler('getEmployees'))
  .post(routeHandler('createEmployee'));

router.route('/employees/bulk-delete')
  .post(routeHandler('bulkDeleteEmployees'));

router.route('/employees/:id')
  .put(routeHandler('updateEmployee'))
  .delete(routeHandler('deleteEmployee'));

export default router;
