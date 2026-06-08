import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  bulkUpdateProductStatus,
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  bulkDeleteCustomers,
  getSales,
  createSale,
  updateSale,
  deleteSale,
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  bulkDeleteEmployees
} from '../controllers/crudController.js';

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

// Products routes
router.route('/products')
  .get(getProducts)
  .post(createProduct);

router.route('/products/bulk-delete')
  .post(bulkDeleteProducts);

router.route('/products/bulk-status')
  .post(bulkUpdateProductStatus);

router.route('/products/:id')
  .put(updateProduct)
  .delete(deleteProduct);

// Customers routes
router.route('/customers')
  .get(getCustomers)
  .post(createCustomer);

router.route('/customers/bulk-delete')
  .post(bulkDeleteCustomers);

router.route('/customers/:id')
  .put(updateCustomer)
  .delete(deleteCustomer);

// Sales routes
router.route('/sales')
  .get(getSales)
  .post(createSale);

router.route('/sales/:id')
  .put(updateSale)
  .delete(deleteSale);

// Employees routes
router.route('/employees')
  .get(getEmployees)
  .post(createEmployee);

router.route('/employees/bulk-delete')
  .post(bulkDeleteEmployees);

router.route('/employees/:id')
  .put(updateEmployee)
  .delete(deleteEmployee);

export default router;
