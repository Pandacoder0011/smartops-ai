// In-memory CRUD controllers for SmartOps AI to bypass database requirements in local/sandbox environments.

let products = [
  {
    _id: 'p1',
    name: 'Smart Server Pro',
    sku: 'SRV-PRO-001',
    category: 'Hardware',
    price: 1299.99,
    cost: 800.00,
    stock: 45,
    minStock: 10,
    supplier: 'Dell Enterprise',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'p2',
    name: 'Cloud License SaaS',
    sku: 'LIC-CLD-100',
    category: 'Software',
    price: 499.00,
    cost: 50.00,
    stock: 250,
    minStock: 20,
    supplier: 'SmartOps Cloud',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'p3',
    name: 'AI Agent Terminal',
    sku: 'TRM-AI-99',
    category: 'Hardware',
    price: 899.00,
    cost: 450.00,
    stock: 8,
    minStock: 15,
    supplier: 'Nvidia Corp',
    status: 'active',
    createdAt: new Date().toISOString()
  }
];

let customers = [
  {
    _id: 'c1',
    name: 'Acme Corp',
    email: 'billing@acme.com',
    phone: '+1 (555) 019-2834',
    address: { street: '123 Enterprise Rd', city: 'Austin', state: 'TX', zip: '78701' },
    segment: 'Enterprise',
    totalPurchases: 25000,
    loyaltyPoints: 2500,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'c2',
    name: 'Wayne Enterprises',
    email: 'bruce@wayne.co',
    phone: '+1 (555) 987-6543',
    address: { street: '1007 Mountain Drive', city: 'Gotham', state: 'NJ', zip: '07001' },
    segment: 'Enterprise',
    totalPurchases: 89000,
    loyaltyPoints: 8900,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'c3',
    name: 'Stark Industries',
    email: 'pepper@stark.com',
    phone: '+1 (555) 246-8101',
    address: { street: '200 Park Ave', city: 'New York', state: 'NY', zip: '10166' },
    segment: 'SMB',
    totalPurchases: 154000,
    loyaltyPoints: 15400,
    createdAt: new Date().toISOString()
  }
];

let employees = [
  {
    _id: 'e1',
    userId: {
      _id: 'u-emp1',
      name: 'Sarah Connor',
      email: 'sarah@smartops.ai',
      role: 'manager',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256'
    },
    department: 'Sales',
    position: 'Sales Manager',
    salary: 85000,
    performance: 110,
    attendance: 98,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'e2',
    userId: {
      _id: 'u-emp2',
      name: 'John Doe',
      email: 'john@smartops.ai',
      role: 'employee',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256'
    },
    department: 'Engineering',
    position: 'Cloud Architect',
    salary: 120000,
    performance: 95,
    attendance: 95,
    createdAt: new Date().toISOString()
  }
];

let sales = [
  {
    _id: 's1',
    products: [
      { product: { _id: 'p1', name: 'Smart Server Pro', price: 1299.99 }, quantity: 2, priceAtSale: 1299.99 }
    ],
    customer: { _id: 'c1', name: 'Acme Corp', email: 'billing@acme.com' },
    employee: { _id: 'e1', userId: { name: 'Sarah Connor' } },
    paymentMethod: 'Credit Card',
    region: 'North America',
    status: 'completed',
    totalAmount: 2599.98,
    profit: 999.98,
    date: new Date().toISOString()
  }
];

// Helper helper to generate MongoDB-like IDs
const generateId = () => 'mock-' + Math.random().toString(36).substr(2, 9);

// ==========================================
// 1. PRODUCTS CONTROLLERS
// ==========================================
export const getProducts = async (req, res, next) => {
  try {
    let data = [...products];
    const { search, status, category } = req.query;
    
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(p => 
        p.name.toLowerCase().includes(s) || 
        p.sku.toLowerCase().includes(s) || 
        (p.supplier && p.supplier.toLowerCase().includes(s))
      );
    }
    if (status) {
      data = data.filter(p => p.status === status);
    }
    if (category) {
      data = data.filter(p => p.category === category);
    }

    res.status(200).json({
      success: true,
      count: data.length,
      pagination: { total: data.length, page: 1, limit: 100, pages: 1 },
      data
    });
  } catch (error) { next(error); }
};

export const createProduct = async (req, res, next) => {
  try {
    const newProduct = {
      _id: generateId(),
      createdAt: new Date().toISOString(),
      ...req.body
    };
    products.push(newProduct);
    res.status(201).json({ success: true, data: newProduct });
  } catch (error) { next(error); }
};

export const updateProduct = async (req, res, next) => {
  try {
    const id = req.params.id;
    const index = products.findIndex(p => p._id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Product not found 🔍' });
    }
    products[index] = { ...products[index], ...req.body };
    res.status(200).json({ success: true, data: products[index] });
  } catch (error) { next(error); }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const id = req.params.id;
    const index = products.findIndex(p => p._id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Product not found 🔍' });
    }
    products.splice(index, 1);
    res.status(200).json({ success: true, message: 'Product deleted 🗑️' });
  } catch (error) { next(error); }
};

export const bulkDeleteProducts = async (req, res, next) => {
  try {
    const { ids } = req.body;
    products = products.filter(p => !ids.includes(p._id));
    res.status(200).json({ success: true, message: 'Products bulk-deleted 🗑️' });
  } catch (error) { next(error); }
};

export const bulkUpdateProductStatus = async (req, res, next) => {
  try {
    const { ids, status } = req.body;
    products = products.map(p => ids.includes(p._id) ? { ...p, status } : p);
    res.status(200).json({ success: true, message: 'Product status updated 🔄' });
  } catch (error) { next(error); }
};

// ==========================================
// 2. CUSTOMERS CONTROLLERS
// ==========================================
export const getCustomers = async (req, res, next) => {
  try {
    let data = [...customers];
    const { search, segment } = req.query;

    if (search) {
      const s = search.toLowerCase();
      data = data.filter(c => 
        c.name.toLowerCase().includes(s) || 
        c.email.toLowerCase().includes(s) || 
        c.phone.toLowerCase().includes(s)
      );
    }
    if (segment) {
      data = data.filter(c => c.segment === segment);
    }

    res.status(200).json({
      success: true,
      count: data.length,
      pagination: { total: data.length, page: 1, limit: 100, pages: 1 },
      data
    });
  } catch (error) { next(error); }
};

export const createCustomer = async (req, res, next) => {
  try {
    const newCustomer = {
      _id: generateId(),
      totalPurchases: 0,
      loyaltyPoints: 0,
      createdAt: new Date().toISOString(),
      ...req.body
    };
    customers.push(newCustomer);
    res.status(201).json({ success: true, data: newCustomer });
  } catch (error) { next(error); }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const id = req.params.id;
    const index = customers.findIndex(c => c._id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Customer not found 🔍' });
    }
    customers[index] = { ...customers[index], ...req.body };
    res.status(200).json({ success: true, data: customers[index] });
  } catch (error) { next(error); }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const id = req.params.id;
    const index = customers.findIndex(c => c._id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Customer not found 🔍' });
    }
    customers.splice(index, 1);
    res.status(200).json({ success: true, message: 'Customer deleted 🗑️' });
  } catch (error) { next(error); }
};

export const bulkDeleteCustomers = async (req, res, next) => {
  try {
    const { ids } = req.body;
    customers = customers.filter(c => !ids.includes(c._id));
    res.status(200).json({ success: true, message: 'Customers bulk-deleted 🗑️' });
  } catch (error) { next(error); }
};

// ==========================================
// 3. SALES CONTROLLERS
// ==========================================
export const getSales = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      count: sales.length,
      pagination: { total: sales.length, page: 1, limit: 100, pages: 1 },
      data: sales
    });
  } catch (error) { next(error); }
};

export const createSale = async (req, res, next) => {
  try {
    const { products: saleProducts, customer: customerId, employee: employeeId, paymentMethod, region, status, date } = req.body;
    
    // Resolve helper objects
    const resolvedCustomer = customers.find(c => c._id === customerId) || { _id: customerId, name: 'Walking Client', email: 'client@walkin.com' };
    const resolvedEmployee = employees.find(e => e._id === employeeId) || { _id: employeeId, userId: { name: 'Demo Agent' } };
    
    let totalAmount = 0;
    let profit = 0;
    const itemDetails = [];

    for (const item of saleProducts) {
      const prod = products.find(p => p._id === item.product) || { name: 'Custom Item', price: item.priceAtSale || 100, cost: 60, stock: 10 };
      const priceAtSale = item.priceAtSale || prod.price;
      const cost = prod.cost || 0;
      
      totalAmount += priceAtSale * item.quantity;
      profit += (priceAtSale - cost) * item.quantity;
      
      itemDetails.push({
        product: { _id: prod._id, name: prod.name, price: prod.price },
        quantity: item.quantity,
        priceAtSale
      });
      
      // Update local product stock
      const prodIndex = products.findIndex(p => p._id === prod._id);
      if (prodIndex !== -1) {
        products[prodIndex].stock = Math.max(0, products[prodIndex].stock - item.quantity);
      }
    }

    const newSale = {
      _id: generateId(),
      products: itemDetails,
      customer: resolvedCustomer,
      employee: resolvedEmployee,
      paymentMethod,
      region,
      status: status || 'completed',
      totalAmount,
      profit,
      date: date || new Date().toISOString()
    };
    
    sales.push(newSale);
    
    // Trigger socket broadcast if possible
    const io = req.app.get('socketio');
    if (io) {
      io.emit('new-sale', newSale);
    }

    res.status(201).json({ success: true, data: newSale });
  } catch (error) { next(error); }
};

export const updateSale = async (req, res, next) => {
  try {
    const id = req.params.id;
    const index = sales.findIndex(s => s._id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Sale not found 🔍' });
    }
    sales[index] = { ...sales[index], ...req.body };
    res.status(200).json({ success: true, data: sales[index] });
  } catch (error) { next(error); }
};

export const deleteSale = async (req, res, next) => {
  try {
    const id = req.params.id;
    const index = sales.findIndex(s => s._id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Sale not found 🔍' });
    }
    sales.splice(index, 1);
    res.status(200).json({ success: true, message: 'Sale deleted successfully 🗑️' });
  } catch (error) { next(error); }
};

// ==========================================
// 4. EMPLOYEES CONTROLLERS
// ==========================================
export const getEmployees = async (req, res, next) => {
  try {
    let data = [...employees];
    const { search, department } = req.query;

    if (search) {
      const s = search.toLowerCase();
      data = data.filter(e => 
        e.userId.name.toLowerCase().includes(s) || 
        e.department.toLowerCase().includes(s) || 
        e.position.toLowerCase().includes(s)
      );
    }
    if (department) {
      data = data.filter(e => e.department === department);
    }

    res.status(200).json({
      success: true,
      count: data.length,
      pagination: { total: data.length, page: 1, limit: 100, pages: 1 },
      data
    });
  } catch (error) { next(error); }
};

export const createEmployee = async (req, res, next) => {
  try {
    const { name, email, department, position, salary, role = 'employee' } = req.body;
    const newEmp = {
      _id: generateId(),
      userId: {
        _id: generateId(),
        name,
        email,
        role,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256'
      },
      department,
      position,
      salary: Number(salary),
      performance: 100,
      attendance: 100,
      createdAt: new Date().toISOString()
    };
    employees.push(newEmp);
    res.status(201).json({ success: true, data: newEmp });
  } catch (error) { next(error); }
};

export const updateEmployee = async (req, res, next) => {
  try {
    const id = req.params.id;
    const index = employees.findIndex(e => e._id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Employee not found 🔍' });
    }
    
    // Update user profile fields if sent
    const { name, email, role, ...rest } = req.body;
    const updatedUser = { ...employees[index].userId };
    if (name) updatedUser.name = name;
    if (email) updatedUser.email = email;
    if (role) updatedUser.role = role;
    
    employees[index] = { 
      ...employees[index], 
      ...rest,
      userId: updatedUser
    };
    
    res.status(200).json({ success: true, data: employees[index] });
  } catch (error) { next(error); }
};

export const deleteEmployee = async (req, res, next) => {
  try {
    const id = req.params.id;
    const index = employees.findIndex(e => e._id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Employee not found 🔍' });
    }
    employees.splice(index, 1);
    res.status(200).json({ success: true, message: 'Employee deleted 🗑️' });
  } catch (error) { next(error); }
};

export const bulkDeleteEmployees = async (req, res, next) => {
  try {
    const { ids } = req.body;
    employees = employees.filter(e => !ids.includes(e._id));
    res.status(200).json({ success: true, message: 'Employees bulk-deleted 🗑️' });
  } catch (error) { next(error); }
};
