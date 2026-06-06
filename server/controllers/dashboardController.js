import DashboardMetric from '../models/DashboardMetric.js';
import csv from 'csv-parser';
import fs from 'fs';

// Mock initial data in case database is empty or connection fails
const MOCK_METRICS = [
  { name: 'Total Revenue', value: 124500, previousValue: 112000, change: 11.16, unit: '$', category: 'financial', trend: [100, 105, 108, 112, 118, 124.5] },
  { name: 'Active Users', value: 14205, previousValue: 13100, change: 8.44, unit: '', category: 'users', trend: [12.5, 12.8, 13.0, 13.2, 13.6, 14.2] },
  { name: 'Conversion Rate', value: 3.24, previousValue: 2.90, change: 11.72, unit: '%', category: 'operations', trend: [2.8, 2.9, 2.7, 3.0, 3.1, 3.24] },
  { name: 'System Uptime', value: 99.98, previousValue: 99.95, change: 0.03, unit: '%', category: 'system', trend: [99.9, 99.95, 99.92, 99.97, 99.96, 99.98] }
];

// @desc    Get all dashboard metrics
// @route   GET /api/dashboard/metrics
// @access  Public
export const getMetrics = async (req, res, next) => {
  try {
    let metrics = await DashboardMetric.find({});
    
    // Seed mock data if DB is empty
    if (metrics.length === 0) {
      try {
        metrics = await DashboardMetric.insertMany(MOCK_METRICS);
      } catch (dbError) {
        console.warn('Could not insert mock data into MongoDB, returning memory mock:', dbError.message);
        metrics = MOCK_METRICS;
      }
    }
    
    res.status(200).json({ success: true, count: metrics.length, data: metrics });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update a dashboard metric
// @route   POST /api/dashboard/metrics
// @access  Public
export const updateMetric = async (req, res, next) => {
  const { name, value, unit, category, trend } = req.body;
  
  try {
    let metric = await DashboardMetric.findOne({ name });
    
    if (metric) {
      metric.previousValue = metric.value;
      metric.value = value;
      if (unit) metric.unit = unit;
      if (category) metric.category = category;
      if (trend) metric.trend = trend;
      await metric.save();
    } else {
      metric = await DashboardMetric.create({ name, value, unit, category, trend: trend || [value] });
    }

    // Emit Socket.io event for real-time updates if io is attached
    if (req.app.get('socketio')) {
      req.app.get('socketio').emit('metric_update', metric);
      req.app.get('socketio').emit('dashboard-update', metric);
    }
    
    res.status(200).json({ success: true, data: metric });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload CSV to import metrics
// @route   POST /api/dashboard/upload
// @access  Public
export const uploadCSV = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a CSV file' });
  }

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        const io = req.app.get('socketio');
        
        for (const row of results) {
          // Expect columns: name, value, unit, category
          if (row.name && row.value) {
            const parsedValue = parseFloat(row.value);
            let metric = await DashboardMetric.findOne({ name: row.name });
            
            if (metric) {
              metric.previousValue = metric.value;
              metric.value = parsedValue;
              if (row.unit) metric.unit = row.unit;
              if (row.category) metric.category = row.category;
              if (metric.trend) {
                metric.trend.push(parsedValue);
                if (metric.trend.length > 10) metric.trend.shift();
              }
              await metric.save();
            } else {
              metric = await DashboardMetric.create({
                name: row.name,
                value: parsedValue,
                unit: row.unit || '',
                category: row.category || 'operations',
                trend: [parsedValue]
              });
            }

            if (io) {
              io.emit('metric_update', metric);
              io.emit('dashboard-update', metric);
            }
          }
        }
        
        // Remove file after processing
        fs.unlinkSync(req.file.path);
        
        res.status(200).json({
          success: true,
          message: `Successfully processed ${results.length} rows from CSV`,
          data: results
        });
      } catch (error) {
        // Cleanup file on error
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        next(error);
      }
    });
};
