import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Please specify if transaction is income or expense'],
    index: true
  },
  category: {
    type: String,
    required: [true, 'Please add a transaction category'],
    trim: true,
    index: true // e.g. 'sale', 'utility', 'salary', 'inventory', 'marketing'
  },
  amount: {
    type: Number,
    required: [true, 'Please add a transaction amount'],
    min: [0, 'Transaction amount cannot be negative']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'other'],
    required: [true, 'Please select a payment method']
  }
}, {
  timestamps: true
});

// Compound indexes for timeline-based accounting filter queries
transactionSchema.index({ owner: 1, createdAt: -1 });
transactionSchema.index({ type: 1, date: -1 });
transactionSchema.index({ category: 1, date: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
