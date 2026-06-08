import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Sale from '../models/Sale.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// ==========================================
// 1. PRODUCTS CONTROLLERS
// ==========================================

export const getProducts = async (req, res, next) => {
  try {
    const { search, status, category, supplier, stockStatus, sort, page = 1, limit = 10 } = req.query;
    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Supplier filter
    if (supplier) {
      query.supplier = { $regex: supplier, $options: 'i' };
    }

    // Low stock / Out of stock filter
    if (stockStatus) {
      if (stockStatus === 'low') {
        query.$expr = { $lte: ['$stock', '$minStock'] };
      } else if (stockStatus === 'out') {
        query.stock = 0;
      } else if (stockStatus === 'normal') {
        query.$expr = { $gt: ['$stock', '$minStock'] };
      }
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sort) {
      const parts = sort.split(':');
      sortOptions[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }

    const skipIndex = (parseInt(page) - 1) * parseInt(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skipIndex);

    res.status(200).json({
      success: true,
      count: products.length,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: products
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found 🔍' });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found 🔍' });
    }

    await product.deleteOne();
    res.status(200).json({ success: true, message: 'Product deleted 🗑️' });
  } catch (error) {
    next(error);
  }
};

// Bulk Actions for Products
export const bulkDeleteProducts = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of product IDs' });
    }

    await Product.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ success: true, message: `${ids.length} products deleted successfully 🗑️` });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateProductStatus = async (req, res, next) => {
  try {
    const { ids, status } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of product IDs' });
    }
    if (!status) {
      return res.status(400).json({ success: false, message: 'Please provide status' });
    }

    await Product.updateMany({ _id: { $in: ids } }, { status });
    res.status(200).json({ success: true, message: `${ids.length} products updated successfully 🔄` });
  } catch (error) {
    next(error);
  }
};


// ==========================================
// 2. CUSTOMERS CONTROLLERS
// ==========================================

export const getCustomers = async (req, res, next) => {
  try {
    const { search, segment, sort, page = 1, limit = 10 } = req.query;
    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'address.state': { $regex: search, $options: 'i' } }
      ];
    }

    // Segment filter
    if (segment) {
      query.segment = segment;
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sort) {
      const parts = sort.split(':');
      sortOptions[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }

    const skipIndex = (parseInt(page) - 1) * parseInt(limit);
    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skipIndex);

    res.status(200).json({
      success: true,
      count: customers.length,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: customers
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    let customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found 🔍' });
    }

    customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found 🔍' });
    }

    await customer.deleteOne();
    res.status(200).json({ success: true, message: 'Customer deleted 🗑️' });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteCustomers = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of customer IDs' });
    }

    await Customer.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ success: true, message: `${ids.length} customers deleted successfully 🗑️` });
  } catch (error) {
    next(error);
  }
};


// ==========================================
// 3. SALES CONTROLLERS
// ==========================================

export const getSales = async (req, res, next) => {
  try {
    const { search, status, paymentMethod, region, sort, page = 1, limit = 10 } = req.query;
    const query = {};

    // Search filter: since customer and employee are populated, we can search by region or lookup customers if needed.
    // However, to keep it simple, we can support searching by region or status, and check if search is an ID.
    if (search) {
      query.$or = [
        { region: { $regex: search, $options: 'i' } },
        { paymentMethod: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    if (region) {
      query.region = region;
    }

    // Sorting
    let sortOptions = { date: -1 };
    if (sort) {
      const parts = sort.split(':');
      sortOptions[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }

    const skipIndex = (parseInt(page) - 1) * parseInt(limit);
    const total = await Sale.countDocuments(query);
    const sales = await Sale.find(query)
      .populate('customer')
      .populate('employee')
      .populate({
        path: 'employee',
        populate: { path: 'userId', select: 'name email role avatar' }
      })
      .populate('products.product')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skipIndex);

    res.status(200).json({
      success: true,
      count: sales.length,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: sales
    });
  } catch (error) {
    next(error);
  }
};

export const createSale = async (req, res, next) => {
  try {
    const { products, customer, employee, paymentMethod, region, status, date } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: 'Sale must contain at least one product 🛒' });
    }

    // 1. Calculate values: totalAmount and profit
    let totalAmount = 0;
    let profit = 0;
    const items = [];

    for (const item of products) {
      const productObj = await Product.findById(item.product);
      if (!productObj) {
        return res.status(400).json({ success: false, message: `Product not found: ${item.product}` });
      }

      if (productObj.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ${productObj.name}. Available: ${productObj.stock}, Requested: ${item.quantity}`
        });
      }

      const priceAtSale = item.priceAtSale || productObj.price;
      const cost = productObj.cost || 0;

      totalAmount += priceAtSale * item.quantity;
      profit += (priceAtSale - cost) * item.quantity;

      items.push({
        product: productObj._id,
        quantity: item.quantity,
        priceAtSale
      });
    }

    // 2. Create the Sale
    const sale = await Sale.create({
      products: items,
      customer,
      employee,
      paymentMethod,
      region,
      status: status || 'completed',
      date: date || new Date(),
      totalAmount,
      profit
    });

    const populatedSale = await Sale.findById(sale._id)
      .populate('customer')
      .populate({
        path: 'employee',
        populate: { path: 'userId', select: 'name email role avatar' }
      })
      .populate('products.product');

    // 3. Decrement Product Stocks & Trigger Alerts
    const io = req.app.get('socketio');
    for (const item of items) {
      const productObj = await Product.findById(item.product);
      productObj.stock -= item.quantity;
      await productObj.save();

      // Check for low stock
      if (productObj.stock <= productObj.minStock) {
        // Create DB Notification
        const notification = await Notification.create({
          userId: req.user?._id || customer, // fallback if user context is missing
          type: 'inventory_alert',
          message: `Product "${productObj.name}" is running low on stock. Current stock: ${productObj.stock} (Threshold: ${productObj.minStock})`,
          priority: 'high'
        });

        // Broadcast low-stock-alert
        if (io) {
          io.emit('low-stock-alert', {
            productId: productObj._id,
            name: productObj.name,
            stock: productObj.stock,
            minStock: productObj.minStock,
            notification
          });
        }
      }
    }

    // Update Customer loyalty points and totalPurchases
    const customerObj = await Customer.findById(customer);
    if (customerObj) {
      customerObj.totalPurchases += totalAmount;
      customerObj.loyaltyPoints += Math.floor(totalAmount / 10); // 1 point per $10 spent
      await customerObj.save();
    }

    // Broadcast new-sale
    if (io) {
      io.emit('new-sale', populatedSale);
    }

    res.status(201).json({ success: true, data: populatedSale });
  } catch (error) {
    next(error);
  }
};

export const updateSale = async (req, res, next) => {
  try {
    let sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found 🔍' });
    }

    // Support updating sale status (e.g. cancelled)
    const oldStatus = sale.status;
    const newStatus = req.body.status;

    sale = await Sale.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('customer')
      .populate({
        path: 'employee',
        populate: { path: 'userId', select: 'name email role' }
      })
      .populate('products.product');

    // If sale status changed to cancelled, refund product stock!
    if (oldStatus !== 'cancelled' && newStatus === 'cancelled') {
      for (const item of sale.products) {
        const productObj = await Product.findById(item.product);
        if (productObj) {
          productObj.stock += item.quantity;
          await productObj.save();
        }
      }
    }

    res.status(200).json({ success: true, data: sale });
  } catch (error) {
    next(error);
  }
};

export const deleteSale = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found 🔍' });
    }

    // Refund stock if deleting a non-cancelled sale
    if (sale.status !== 'cancelled') {
      for (const item of sale.products) {
        const productObj = await Product.findById(item.product);
        if (productObj) {
          productObj.stock += item.quantity;
          await productObj.save();
        }
      }
    }

    await sale.deleteOne();
    res.status(200).json({ success: true, message: 'Sale deleted successfully 🗑#' });
  } catch (error) {
    next(error);
  }
};


// ==========================================
// 4. EMPLOYEES CONTROLLERS
// ==========================================

export const getEmployees = async (req, res, next) => {
  try {
    const { search, department, position, sort, page = 1, limit = 10 } = req.query;
    const query = {};

    // Filter by department
    if (department) {
      query.department = department;
    }

    // Filter by position
    if (position) {
      query.position = position;
    }

    // Search logic: if search, we need to match user name or email, or employee department/position
    if (search) {
      const matchedUsers = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      const userIds = matchedUsers.map(u => u._id);

      query.$or = [
        { userId: { $in: userIds } },
        { department: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sort) {
      const parts = sort.split(':');
      sortOptions[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }

    const skipIndex = (parseInt(page) - 1) * parseInt(limit);
    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .populate('userId', 'name email role avatar lastLogin company')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skipIndex);

    res.status(200).json({
      success: true,
      count: employees.length,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: employees
    });
  } catch (error) {
    next(error);
  }
};

export const createEmployee = async (req, res, next) => {
  try {
    const { name, email, password, role = 'employee', department, position, salary, performance = 100 } = req.body;

    if (!name || !email || !password || !department || !position || salary === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists' });
    }

    // Get company name from current user
    const company = req.user?.company || 'SmartOps Corp';

    // 1. Create linked User
    const user = await User.create({
      name,
      email,
      password,
      role,
      company
    });

    // 2. Create Employee profile
    const employee = await Employee.create({
      userId: user._id,
      department,
      position,
      salary,
      performance
    });

    const populatedEmployee = await Employee.findById(employee._id).populate('userId', 'name email role avatar company');

    res.status(201).json({ success: true, data: populatedEmployee });
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (req, res, next) => {
  try {
    const { name, email, role, department, position, salary, performance, tasks, attendance } = req.body;

    let employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    // 1. Update Mongoose User profile fields if passed
    const userUpdate = {};
    if (name) userUpdate.name = name;
    if (email) userUpdate.email = email;
    if (role) userUpdate.role = role;

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(employee.userId, userUpdate, { runValidators: true });
    }

    // 2. Update Employee profile fields
    const employeeUpdate = {};
    if (department) employeeUpdate.department = department;
    if (position) employeeUpdate.position = position;
    if (salary !== undefined) employeeUpdate.salary = salary;
    if (performance !== undefined) employeeUpdate.performance = performance;
    if (tasks) employeeUpdate.tasks = tasks;
    if (attendance) employeeUpdate.attendance = attendance;

    employee = await Employee.findByIdAndUpdate(req.params.id, employeeUpdate, {
      new: true,
      runValidators: true
    }).populate('userId', 'name email role avatar company');

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

export const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found 🔍' });
    }

    // Delete linked User
    await User.findByIdAndDelete(employee.userId);
    // Delete Employee profile
    await employee.deleteOne();

    res.status(200).json({ success: true, message: 'Employee and user profile deleted 🗑️' });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteEmployees = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of employee IDs' });
    }

    // Find employees to get their userIds
    const employees = await Employee.find({ _id: { $in: ids } });
    const userIds = employees.map(emp => emp.userId);

    // Delete users and employees
    await User.deleteMany({ _id: { $in: userIds } });
    await Employee.deleteMany({ _id: { $in: ids } });

    res.status(200).json({ success: true, message: `${ids.length} employees deleted successfully 🗑️` });
  } catch (error) {
    next(error);
  }
};
