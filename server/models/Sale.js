import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  priceAtSale: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  products: {
    type: [saleItemSchema],
    validate: [val => val.length > 0, 'Sale must contain at least one product']
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Sale must be linked to a customer'],
    index: true
  },
  totalAmount: {
    type: Number,
    required: [true, 'Please add a total amount'],
    min: [0, 'Total amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'other'],
    required: [true, 'Please add a payment method']
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'cancelled'],
    default: 'completed',
    index: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Sale must be linked to an employee'],
    index: true
  },
  profit: {
    type: Number,
    required: [true, 'Please add profit calculations'],
    default: 0
  },
  region: {
    type: String,
    required: [true, 'Please specify a sales region'],
    trim: true,
    index: true
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for analytics (sorting by region, date, or status)
saleSchema.index({ region: 1, date: -1 });
saleSchema.index({ date: -1, status: 1 });

const Sale = mongoose.model('Sale', saleSchema);
export default Sale;
