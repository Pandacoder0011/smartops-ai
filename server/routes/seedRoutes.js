import express from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import Sale from '../models/Sale.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import AIChat from '../models/AIChat.js';
import { protect } from '../middleware/clerkAuth.js';

const router = express.Router();

const categories = ['Hardware', 'Software', 'Electronics', 'Accessories', 'Services'];
const productNames = {
  Hardware: ['Smart Server Pro v2', 'AI Edge TPU Terminal', 'High-Speed Switch Rack', 'Encrypted Gateway Node', 'Thermal Cooling Unit'],
  Software: ['Enterprise Cloud License (1Y)', 'AI Copilot SaaS Bundle', 'Security Firewall Core', 'Automated QA Suite Pro', 'Database Cluster Engine'],
  Electronics: ['Telemetry IoT sensor', 'Precision Power Regulator', 'Backup UPS Battery Block', 'Smart Room Thermostat', 'Optical Line Terminal'],
  Accessories: ['Fiber Cable Patch 10m', 'Rack Rail Mount Kit', 'Universal Adapter Adapter', 'Heavy Duty Power Strip', 'Magnetic Cable Organizers'],
  Services: ['Premium Cloud Consulting', 'System Integration Support', 'Emergency Site Recovery', 'Database Migration Service', 'AI Training Custom Workshop']
};

const suppliers = ['Dell Enterprise', 'Nvidia Cloud Corp', 'Cisco Systems Inc', 'Intel Foundry', 'AWS Cloud Service', 'SmartOps Logistics', 'Global Tech Spares'];
const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Elizabeth', 'William', 'Linda', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas'];
const companies = ['Acme Industries', 'Stark Enterprises', 'Wayne Corp', 'Tyrell Corp', 'Initech Systems', 'Umbrella Group', 'Hooli Enterprise', 'Soylent Solutions', 'Massive Dynamic', 'Cyberdyne LLC'];

const departments = ['Sales', 'Engineering', 'Customer Support', 'Marketing', 'Operations', 'Finance'];
const positions = {
  Sales: ['Sales Manager', 'Account Executive', 'Inside Sales Rep'],
  Engineering: ['Cloud Architect', 'Senior Engineer', 'Frontend Specialist', 'QA Engineer'],
  'Customer Support': ['Support Team Lead', 'Support Specialist', 'Support Agent'],
  Marketing: ['Growth Marketer', 'Content Director', 'SEO Specialist'],
  Operations: ['Operations Director', 'Systems Engineer', 'Logistics Analyst'],
  Finance: ['Financial Analyst', 'Accountant']
};

const regions = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East & Africa'];
const paymentMethods = ['cash', 'card', 'bank_transfer', 'other'];

/**
 * Clean up all user owned data.
 */
const clearUserOwnedData = async (ownerId) => {
  // Find employees first to delete their linked User accounts
  const employees = await Employee.find({ owner: ownerId });
  const userIds = employees.map(emp => emp.userId);

  await User.deleteMany({ _id: { $in: userIds } });
  await Employee.deleteMany({ owner: ownerId });
  await Product.deleteMany({ owner: ownerId });
  await Customer.deleteMany({ owner: ownerId });
  await Sale.deleteMany({ owner: ownerId });
  await Transaction.deleteMany({ owner: ownerId });
  await Notification.deleteMany({ owner: ownerId });
  await AIChat.deleteMany({ owner: ownerId });
};

/**
 * POST /api/seed/demo
 * Scopes data creation to the logged-in Clerk user.
 */
router.post('/demo', protect, async (req, res, next) => {
  try {
    const ownerId = req.user._id;
    console.log(`🌱 Seeding demo data for owner: ${ownerId}`);

    // 1. Clear existing owned data to avoid duplicate key conflicts
    await clearUserOwnedData(ownerId);

    // 2. Seed 20 Products
    const seededProducts = [];
    let skuCounter = 100;
    for (let i = 0; i < 20; i++) {
      const category = categories[i % categories.length];
      const namesList = productNames[category];
      const baseName = namesList[Math.floor(Math.random() * namesList.length)];
      const name = `${baseName} (Ref #${skuCounter})`;
      const sku = `${category.slice(0, 3).toUpperCase()}-${skuCounter++}`;
      const cost = parseFloat((15 + Math.random() * 300).toFixed(2));
      const price = parseFloat((cost * (1.3 + Math.random() * 0.7)).toFixed(2));
      const stock = Math.floor(Math.random() * 100) + 15; // 15 to 115
      const minStock = Math.floor(Math.random() * 10) + 5; // 5 to 14
      const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];

      const prod = await Product.create({
        owner: ownerId,
        name,
        sku,
        category,
        price,
        cost,
        stock,
        minStock,
        supplier,
        images: ['https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=120']
      });
      seededProducts.push(prod);
    }

    // 3. Seed 10 Customers
    const seededCustomers = [];
    for (let i = 0; i < 10; i++) {
      const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
      const email = `${name.toLowerCase().replace(/\s+/g, '.')}@${companies[Math.floor(Math.random() * companies.length)].toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
      const phone = `+1 (555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const cities = ['Austin', 'Chicago', 'New York', 'San Francisco', 'Boston', 'Seattle'];
      const states = ['TX', 'IL', 'NY', 'CA', 'MA', 'WA'];
      const locationIdx = Math.floor(Math.random() * cities.length);
      
      const address = {
        street: `${Math.floor(100 + Math.random() * 8900)} Innovation Blvd`,
        city: cities[locationIdx],
        state: states[locationIdx],
        zip: `${Math.floor(10000 + Math.random() * 89999)}`
      };

      const cust = await Customer.create({
        owner: ownerId,
        name,
        email,
        phone,
        address,
        totalPurchases: 0,
        loyaltyPoints: 0
      });
      seededCustomers.push(cust);
    }

    // 4. Seed 5 Employees
    const seededEmployees = [];
    const company = req.user.company || 'SmartOps AI';
    for (let i = 0; i < 5; i++) {
      const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
      const email = `${name.toLowerCase().replace(/\s+/g, '')}@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
      const department = departments[i % departments.length];
      const deptPositions = positions[department];
      const position = deptPositions[Math.floor(Math.random() * deptPositions.length)];
      const salary = Math.floor(50000 + Math.random() * 60000);

      // Create linked User
      const employeeUser = await User.create({
        name,
        email,
        role: department === 'Sales' ? 'manager' : 'employee',
        company
      });

      // Attendance history
      const attendance = [];
      for (let d = 1; d <= 10; d++) {
        const date = new Date();
        date.setDate(date.getDate() - d);
        if (date.getDay() !== 0 && date.getDay() !== 6) {
          attendance.push({ date, status: Math.random() > 0.9 ? 'late' : 'present' });
        }
      }

      // Tasks
      const tasks = [
        {
          title: `Optimize ${department} metrics report`,
          description: `Consolidate operating logs for review under Q3 aggregate pipelines.`,
          status: Math.random() > 0.5 ? 'completed' : 'in-progress',
          dueDate: new Date(Date.now() + Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000))
        }
      ];

      const emp = await Employee.create({
        owner: ownerId,
        userId: employeeUser._id,
        department,
        position,
        salary,
        performance: Math.floor(80 + Math.random() * 20),
        attendance,
        tasks
      });
      seededEmployees.push(emp);
    }

    // 5. Seed 50 Sales
    const seededSales = [];
    for (let i = 0; i < 50; i++) {
      const customer = seededCustomers[Math.floor(Math.random() * seededCustomers.length)];
      const employee = seededEmployees[Math.floor(Math.random() * seededEmployees.length)];
      const region = regions[Math.floor(Math.random() * regions.length)];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      
      const numProducts = Math.floor(Math.random() * 2) + 1; // 1 or 2 products
      const saleProducts = [];
      let totalAmount = 0;
      let profit = 0;
      
      const selectedProds = new Set();
      while (selectedProds.size < numProducts) {
        selectedProds.add(seededProducts[Math.floor(Math.random() * seededProducts.length)]);
      }

      for (const prod of selectedProds) {
        const quantity = Math.floor(Math.random() * 3) + 1;
        const priceAtSale = prod.price;
        const cost = prod.cost;

        totalAmount += priceAtSale * quantity;
        profit += (priceAtSale - cost) * quantity;

        saleProducts.push({
          product: prod._id,
          quantity,
          priceAtSale
        });

        // Deduct stock levels safely
        prod.stock = Math.max(0, prod.stock - quantity);
      }

      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // random within 30 days
      date.setHours(Math.floor(Math.random() * 12) + 9); // business hours

      const sale = await Sale.create({
        owner: ownerId,
        products: saleProducts,
        customer: customer._id,
        employee: employee._id,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        paymentMethod,
        region,
        status: 'completed',
        date
      });

      // Update customer stats
      customer.totalPurchases += totalAmount;
      customer.loyaltyPoints += Math.floor(totalAmount / 10);

      seededSales.push(sale);
    }

    // Save modified product stocks & customer values
    for (const prod of seededProducts) {
      await prod.save();
    }
    for (const cust of seededCustomers) {
      await cust.save();
    }

    // 6. Seed 15 Transactions
    const expenseCategories = ['utility', 'salary', 'inventory', 'marketing', 'other'];
    const incomeCategories = ['sale', 'other'];
    for (let i = 0; i < 15; i++) {
      const type = Math.random() > 0.4 ? 'expense' : 'income';
      const category = type === 'expense' 
        ? expenseCategories[Math.floor(Math.random() * expenseCategories.length)]
        : incomeCategories[Math.floor(Math.random() * incomeCategories.length)];
      
      const amount = parseFloat((30 + Math.random() * 1500).toFixed(2));
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));

      await Transaction.create({
        owner: ownerId,
        type,
        category,
        amount,
        paymentMethod,
        date,
        description: `Demo ${type} entry for ${category}`
      });
    }

    // 7. Seed Notification
    const lowStockProd = seededProducts.find(p => p.stock <= p.minStock) || seededProducts[0];
    await Notification.create({
      owner: ownerId,
      userId: ownerId,
      type: 'inventory_alert',
      message: `Product "${lowStockProd.name}" has hit low stock threshold: only ${lowStockProd.stock} units remaining.`,
      priority: 'high',
      read: false
    });

    res.status(201).json({
      success: true,
      message: 'Demo workspace seeded successfully! 🚀',
      counts: {
        products: seededProducts.length,
        customers: seededCustomers.length,
        employees: seededEmployees.length,
        sales: seededSales.length,
        transactions: 15
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/seed/reset
 * Resets all workspace data scoped to the logged-in Clerk user.
 */
router.post('/reset', protect, async (req, res, next) => {
  try {
    const ownerId = req.user._id;
    console.log(`🧹 Resetting workspace data for owner: ${ownerId}`);
    
    await clearUserOwnedData(ownerId);

    res.status(200).json({
      success: true,
      message: 'Workspace data cleared successfully. 🗑️'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
