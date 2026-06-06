import Product from '../models/Product.js';
import Sale from '../models/Sale.js';
import Customer from '../models/Customer.js';
import Employee from '../models/Employee.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { emitNewSale, emitLowStockAlert } from '../config/socket.js';

// ==========================================
// 1. Tool Declarations (Gemini API format)
// ==========================================
export const aiToolsDeclarations = [
  {
    name: 'queryDatabase',
    description: 'Queries the business database to find records for an entity type based on filtering criteria.',
    parameters: {
      type: 'OBJECT',
      properties: {
        entityType: {
          type: 'STRING',
          description: 'The entity collection to query: Product, Sale, Customer, Employee, Transaction, Notification.',
        },
        queryJson: {
          type: 'STRING',
          description: 'A JSON-stringified Mongoose query filter object. Example: \'{"stock": {"$lte": 10}}\' or \'{"category": "Electronics"}\'.',
        },
        limit: {
          type: 'NUMBER',
          description: 'Maximum number of items to return. Default: 10.',
        }
      },
      required: ['entityType']
    }
  },
  {
    name: 'createRecord',
    description: 'Creates a new document in the business database for the specified entity type.',
    parameters: {
      type: 'OBJECT',
      properties: {
        entityType: {
          type: 'STRING',
          description: 'The entity collection: Product, Sale, Customer, Employee, Transaction, Notification.',
        },
        dataJson: {
          type: 'STRING',
          description: 'JSON-stringified data containing fields and values to insert. Example: \'{"name": "USB Cable", "sku": "USB-01", "price": 10.99, "cost": 4.5, "stock": 100, "category": "Electronics"}\'.',
        }
      },
      required: ['entityType', 'dataJson']
    }
  },
  {
    name: 'sendNotification',
    description: 'Sends an internal system notification to a specific employee or user.',
    parameters: {
      type: 'OBJECT',
      properties: {
        userId: {
          type: 'STRING',
          description: 'Mongoose ObjectId of the target User.',
        },
        type: {
          type: 'STRING',
          description: 'Alert categorization (e.g. inventory_alert, payment_pending, system_event).',
        },
        message: {
          type: 'STRING',
          description: 'Message body/contents of the notification.',
        },
        priority: {
          type: 'STRING',
          description: 'Priority level: low, medium, high.',
        }
      },
      required: ['userId', 'type', 'message']
    }
  },
  {
    name: 'generateReport',
    description: 'Aggregates data to calculate operational reports (sales summaries, inventory balances, margins).',
    parameters: {
      type: 'OBJECT',
      properties: {
        reportType: {
          type: 'STRING',
          description: 'Report category: sales_summary, inventory_balance, profit_analysis.',
        },
        parametersJson: {
          type: 'STRING',
          description: 'JSON-stringified parameters (e.g. date range, category filters).',
        }
      },
      required: ['reportType']
    }
  }
];

// ==========================================
// 2. Tool Executions (Mongoose connectors)
// ==========================================
const modelsMap = {
  Product,
  Sale,
  Customer,
  Employee,
  Transaction,
  Notification
};

export const executeTool = async (functionCall) => {
  const { name, args } = functionCall;
  console.log(`🔌 [Agent Tool Exec] Model requesting invocation of tool: ${name} 🧠`);
  
  try {
    switch (name) {
      case 'queryDatabase': {
        const { entityType, queryJson, limit } = args;
        const Model = modelsMap[entityType];
        
        if (!Model) {
          return { error: `Invalid entity type: ${entityType}` };
        }
        
        const filter = queryJson ? JSON.parse(queryJson) : {};
        const maxLimit = limit ? parseInt(limit) : 10;
        
        console.log(`🔍 [DB Query] Searching ${entityType} with filters:`, filter);
        const results = await Model.find(filter).limit(maxLimit);
        return { success: true, count: results.length, data: results };
      }
      
      case 'createRecord': {
        const { entityType, dataJson } = args;
        const Model = modelsMap[entityType];
        
        if (!Model) {
          return { error: `Invalid entity type: ${entityType}` };
        }
        
        const data = JSON.parse(dataJson);
        console.log(`📝 [DB Insert] Creating new ${entityType} record:`, data);
        const record = await Model.create(data);

        // Real-time integration hooks
        if (entityType === 'Sale') {
          try {
            // 1. Process products and update stock levels
            if (record.products && record.products.length > 0) {
              for (const item of record.products) {
                const product = await Product.findById(item.product);
                if (product) {
                  // Update stock and status pre-save triggers automatically
                  product.stock = Math.max(0, product.stock - item.quantity);
                  await product.save();

                  // 2. Check if product stock falls below minimum threshold
                  if (product.stock <= product.minStock) {
                    // Emit Socket.io low stock alert event
                    emitLowStockAlert(product);

                    // Find target user for the Notification
                    let targetUserId = null;
                    if (record.employee) {
                      const emp = await Employee.findById(record.employee);
                      if (emp) {
                        targetUserId = emp.userId;
                      }
                    }
                    if (!targetUserId) {
                      const fallbackUser = await User.findOne({});
                      if (fallbackUser) {
                        targetUserId = fallbackUser._id;
                      }
                    }

                    if (targetUserId) {
                      // Save notification to DB
                      await Notification.create({
                        userId: targetUserId,
                        type: 'inventory_alert',
                        message: `Stock for product '${product.name}' (${product.sku}) is low: only ${product.stock} units remaining (min limit: ${product.minStock}).`,
                        priority: 'high'
                      });
                    }
                  }
                }
              }
            }

            // 3. Populate and emit new-sale event
            const populatedSale = await Sale.findById(record._id)
              .populate('customer')
              .populate({
                path: 'employee',
                populate: { path: 'userId' }
              })
              .populate('products.product');

            emitNewSale(populatedSale);
          } catch (hookErr) {
            console.error('🔴 Error in Sale post-creation real-time hook:', hookErr.message);
          }
        }
        
        return { success: true, message: `${entityType} created successfully`, data: record };
      }
      
      case 'sendNotification': {
        const { userId, type, message, priority } = args;
        console.log(`🔔 [Notification] Sending alert to ${userId} (${type}):`, message);
        const notif = await Notification.create({
          userId,
          type,
          message,
          priority: priority || 'low'
        });
        return { success: true, message: 'Notification dispatched successfully', data: notif };
      }
      
      case 'generateReport': {
        const { reportType, parametersJson } = args;
        const params = parametersJson ? JSON.parse(parametersJson) : {};
        console.log(`📊 [Report] Generating report of type ${reportType} with:`, params);
        
        if (reportType === 'inventory_balance') {
          const stats = await Product.aggregate([
            { $group: { _id: '$category', totalStock: { $sum: '$stock' }, count: { $sum: 1 } } }
          ]);
          return { success: true, reportType, data: stats };
        }
        
        if (reportType === 'sales_summary') {
          const stats = await Sale.aggregate([
            { $group: { _id: '$region', totalSales: { $sum: '$totalAmount' }, profit: { $sum: '$profit' } } }
          ]);
          return { success: true, reportType, data: stats };
        }

        if (reportType === 'profit_analysis') {
          const stats = await Sale.aggregate([
            { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, totalProfit: { $sum: '$profit' } } }
          ]);
          return { success: true, reportType, data: stats };
        }
        
        return { error: `Unknown report type: ${reportType}` };
      }
      
      default:
        return { error: `Unknown tool function name: ${name}` };
    }
  } catch (error) {
    console.error(`🔴 [Tool Error] Failed to execute tool ${name}:`, error.message);
    return { success: false, error: error.message };
  }
};
