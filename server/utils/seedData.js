import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Employee from '../models/Employee.js';
import Sale from '../models/Sale.js';
import Transaction from '../models/Transaction.js';
import DashboardMetric from '../models/DashboardMetric.js';
import Notification from '../models/Notification.js';

// Load environment variables
dotenv.config();

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

const regions = ['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East & Africa'];
const paymentMethods = ['cash', 'card', 'bank_transfer', 'other'];

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI is not set in env configuration!');
      process.exit(1);
    }

    console.log('🔌 Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('🟢 MongoDB Connected! Starting seeding process... 🚀');

    // 1. Clear existing collections
    console.log('🧹 Clearing old collections...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Customer.deleteMany({});
    await Employee.deleteMany({});
    await Sale.deleteMany({});
    await Transaction.deleteMany({});
    await DashboardMetric.deleteMany({});
    await Notification.deleteMany({});
    console.log('✨ Old collections cleared successfully.');

    // 2. Seed Admin User
    console.log('👤 Seeding default Admin user...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    const adminUser = await User.create({
      name: 'SmartOps Administrator',
      email: 'admin@smartops.ai',
      password: hashedPassword,
      role: 'admin',
      company: 'SmartOps AI Headquarters',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256',
      lastLogin: new Date()
    });
    console.log(`🟢 Admin user registered: ${adminUser.email}`);

    // 3. Seed Products (At least 25 records)
    console.log('📦 Seeding Products catalog...');
    const seededProducts = [];
    let skuCounter = 100;

    for (let i = 0; i < 26; i++) {
      const category = categories[i % categories.length];
      const namesList = productNames[category];
      const name = namesList[Math.floor(Math.random() * namesList.length)] + ` (Ref #${skuCounter})`;
      const sku = `${category.slice(0, 3).toUpperCase()}-${skuCounter++}`;
      
      const cost = parseFloat((20 + Math.random() * 500).toFixed(2));
      const price = parseFloat((cost * (1.2 + Math.random() * 0.8)).toFixed(2)); // 20% to 100% markup
      const stock = Math.floor(Math.random() * 180) + 5; // 5 to 185 items
      const minStock = Math.floor(Math.random() * 15) + 5; // 5 to 20 low stock warning threshold
      const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];

      const prod = await Product.create({
        name,
        sku,
        category,
        price,
        cost,
        stock,
        minStock,
        supplier,
        status: stock === 0 ? 'out-of-stock' : 'active',
        images: [`https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=120`]
      });
      seededProducts.push(prod);
    }
    console.log(`🟢 Seeded ${seededProducts.length} product records.`);

    // 4. Seed Customers (At least 35 records)
    console.log('👥 Seeding Customers directory...');
    const seededCustomers = [];

    for (let i = 0; i < 36; i++) {
      const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
      const email = `${name.toLowerCase().replace(' ', '.')}@${companies[Math.floor(Math.random() * companies.length)].toLowerCase().replace(' ', '')}.com`;
      const phone = `+1 (555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const cities = ['Austin', 'Chicago', 'New York', 'San Francisco', 'Boston', 'Seattle', 'Denver', 'Miami'];
      const states = ['TX', 'IL', 'NY', 'CA', 'MA', 'WA', 'CO', 'FL'];
      const locationIdx = Math.floor(Math.random() * cities.length);
      
      const address = {
        street: `${Math.floor(100 + Math.random() * 8900)} Innovation Blvd`,
        city: cities[locationIdx],
        state: states[locationIdx],
        zip: `${Math.floor(10000 + Math.random() * 89999)}`
      };

      const totalPurchases = parseFloat((Math.random() * 8000).toFixed(2));
      const loyaltyPoints = Math.floor(totalPurchases / 10);
      
      // segment will auto-calculate in pre-save hook based on loyaltyPoints/purchases
      const cust = await Customer.create({
        name,
        email,
        phone,
        address,
        totalPurchases,
        loyaltyPoints,
        joinDate: new Date(Date.now() - Math.floor(Math.random() * 300 * 24 * 60 * 60 * 1000)) // joined up to 300 days ago
      });
      seededCustomers.push(cust);
    }
    console.log(`🟢 Seeded ${seededCustomers.length} customer records.`);

    // 5. Seed Employees (At least 15 records)
    console.log('👔 Seeding Employees directory & linked User accounts...');
    const seededEmployees = [];
    
    for (let i = 0; i < 15; i++) {
      const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
      const email = `${name.toLowerCase().replace(' ', '')}@smartops.ai`;
      const department = departments[i % departments.length];
      const deptPositions = positions[department];
      const position = deptPositions[Math.floor(Math.random() * deptPositions.length)];
      const salary = Math.floor(45000 + Math.random() * 85000);
      
      // Linked User Account
      const userPassword = await bcrypt.hash('password123', salt);
      const userObj = await User.create({
        name,
        email,
        password: userPassword,
        role: department === 'Sales' || department === 'Engineering' ? 'manager' : 'employee',
        company: 'SmartOps AI Headquarters',
        avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 5000000)}?q=80&w=256`,
        lastLogin: new Date()
      });

      // Attendance history (last 10 business days)
      const attendance = [];
      for (let day = 1; day <= 10; day++) {
        const date = new Date();
        date.setDate(date.getDate() - day);
        if (date.getDay() !== 0 && date.getDay() !== 6) { // skip weekends
          const randomVal = Math.random();
          const status = randomVal > 0.95 ? 'absent' : randomVal > 0.88 ? 'late' : 'present';
          attendance.push({ date, status });
        }
      }

      // Tasks
      const tasks = [
        {
          title: `Optimize ${department} metrics report`,
          description: `Consolidate operating logs for review under Q3 aggregate pipelines.`,
          status: Math.random() > 0.5 ? 'completed' : 'in-progress',
          dueDate: new Date(Date.now() + Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000))
        },
        {
          title: `Audit compliance checks`,
          description: `Perform SLA checklist audits.`,
          status: 'pending',
          dueDate: new Date(Date.now() + Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000))
        }
      ];

      const emp = await Employee.create({
        userId: userObj._id,
        department,
        position,
        salary,
        performance: Math.floor(75 + Math.random() * 25), // 75 to 100
        attendance,
        tasks
      });
      seededEmployees.push(emp);
    }
    console.log(`🟢 Seeded ${seededEmployees.length} employee records.`);

    // 6. Seed Sales (At least 40 records)
    console.log('📈 Seeding Sales transactions...');
    const seededSales = [];

    // Span sales over the last 30 days
    for (let i = 0; i < 42; i++) {
      const customer = seededCustomers[Math.floor(Math.random() * seededCustomers.length)];
      const employee = seededEmployees[Math.floor(Math.random() * seededEmployees.length)];
      const region = regions[Math.floor(Math.random() * regions.length)];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      
      const numProducts = Math.floor(Math.random() * 3) + 1; // 1 to 3 products in sale
      const saleProducts = [];
      let totalAmount = 0;
      let profit = 0;
      
      const selectedProds = new Set();
      while (selectedProds.size < numProducts) {
        selectedProds.add(seededProducts[Math.floor(Math.random() * seededProducts.length)]);
      }

      for (const prod of selectedProds) {
        const quantity = Math.floor(Math.random() * 4) + 1; // 1 to 4 units
        const priceAtSale = prod.price;
        const cost = prod.cost;

        totalAmount += priceAtSale * quantity;
        profit += (priceAtSale - cost) * quantity;

        saleProducts.push({
          product: prod._id,
          quantity,
          priceAtSale
        });
      }

      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // random date in last 30 days
      date.setHours(Math.floor(Math.random() * 14) + 8); // business hours 8am to 10pm

      const sale = await Sale.create({
        products: saleProducts,
        customer: customer._id,
        employee: employee._id,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        paymentMethod,
        region,
        status: Math.random() > 0.05 ? 'completed' : 'cancelled', // 5% cancel rate
        date
      });
      seededSales.push(sale);
    }
    console.log(`🟢 Seeded ${seededSales.length} sales transaction history logs.`);

    // 7. Seed Transactions for Finance Ledger (At least 15 records)
    console.log('💸 Seeding business ledger transactions...');
    const expenseCategories = ['utility', 'salary', 'inventory', 'marketing', 'other'];
    const incomeCategories = ['sale', 'other'];

    for (let i = 0; i < 20; i++) {
      const type = Math.random() > 0.4 ? 'expense' : 'income';
      const category = type === 'expense' 
        ? expenseCategories[Math.floor(Math.random() * expenseCategories.length)]
        : incomeCategories[Math.floor(Math.random() * incomeCategories.length)];
      
      const amount = parseFloat((50 + Math.random() * 3000).toFixed(2));
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 45)); // last 45 days

      await Transaction.create({
        type,
        category,
        amount,
        paymentMethod,
        date,
        description: `Demo ${type} entry for ${category} audit`
      });
    }
    console.log('🟢 Seeded ledger transactions.');

    // 8. Seed KPI Metrics Dashboard
    console.log('📊 Seeding Dashboard KPI parameters...');
    const metricsToSeed = [
      { name: 'Total Revenue', value: 142580.45, previousValue: 128450.00, category: 'financial', unit: '$', trend: [112000, 115000, 120000, 128450, 142580] },
      { name: 'Total Sales', value: 432, previousValue: 395, category: 'financial', unit: '', trend: [350, 362, 380, 395, 432] },
      { name: 'Active Customers', value: 185, previousValue: 172, category: 'users', unit: '', trend: [150, 158, 164, 172, 185] },
      { name: 'Inventory Value', value: 89450.00, previousValue: 92400.00, category: 'operations', unit: '$', trend: [95000, 94000, 93100, 92400, 89450] },
      { name: 'System Uptime', value: 99.98, previousValue: 99.95, category: 'system', unit: '%', trend: [99.9, 99.92, 99.95, 99.96, 99.98] }
    ];

    for (const item of metricsToSeed) {
      await DashboardMetric.create(item);
    }
    console.log('🟢 Dashboard KPIs successfully registered.');

    // 9. Seed System Notifications alerts
    console.log('🔔 Seeding initial system notifications...');
    const lowStockProduct = seededProducts.find(p => p.stock <= p.minStock) || seededProducts[0];
    
    await Notification.create({
      userId: adminUser._id,
      type: 'inventory_alert',
      message: `Product "${lowStockProduct.name}" is running low on stock. Current: ${lowStockProduct.stock} (Min threshold: ${lowStockProduct.minStock}) 🚨`,
      priority: 'high',
      read: false
    });

    await Notification.create({
      userId: adminUser._id,
      type: 'system_event',
      message: 'System database populator script executed. Seeding successful. 🎉',
      priority: 'low',
      read: true
    });
    console.log('🟢 System notification logs created.');

    console.log('\n🎉 ALL DEMO SEED RECORDS INSTANTIATED SUCCESSFULLY! 🎉');
    console.log(`=========================================
Total Users Registered: ${1 + seededEmployees.length} (Admin + Employees)
Total Products Instantiated: ${seededProducts.length}
Total Customers Added: ${seededCustomers.length}
Total Sales Historical entries: ${seededSales.length}
Total Ledger Entries: 20
=========================================\n`);
    
    console.log('🔌 Closing db connection...');
    await mongoose.connection.close();
    console.log('🟢 Seeding script completed cleanly. Goodbye! 👋');
    process.exit(0);
  } catch (error) {
    console.error('🔴 CRITICAL SEED ERROR:', error.message);
    process.exit(1);
  }
};

// Start seeding
seedData();
