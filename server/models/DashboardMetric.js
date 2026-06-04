import mongoose from 'mongoose';

const dashboardMetricSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a metric name'],
    unique: true
  },
  value: {
    type: Number,
    required: [true, 'Please add a value']
  },
  previousValue: {
    type: Number,
    default: 0
  },
  change: {
    type: Number, // Percentage change
    default: 0
  },
  unit: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['financial', 'users', 'operations', 'system']
  },
  trend: {
    type: [Number], // Historical data points for charts
    default: []
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-calculate percentage change before saving
dashboardMetricSchema.pre('save', function(next) {
  if (this.isModified('value') || this.isModified('previousValue')) {
    if (this.previousValue && this.previousValue !== 0) {
      this.change = parseFloat(((this.value - this.previousValue) / this.previousValue * 100).toFixed(2));
    } else {
      this.change = 0;
    }
  }
  this.updatedAt = Date.now();
  next();
});

const DashboardMetric = mongoose.model('DashboardMetric', dashboardMetricSchema);
export default DashboardMetric;
