import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Please add a customer name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    index: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true, index: true },
    state: { type: String, trim: true, index: true },
    zip: { type: String, trim: true }
  },
  totalPurchases: {
    type: Number,
    default: 0,
    min: [0, 'Total purchases count cannot be negative']
  },
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: [0, 'Loyalty points cannot be negative']
  },
  segment: {
    type: String,
    enum: ['vip', 'regular', 'new'],
    default: 'new',
    index: true
  },
  joinDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for timeline queries and scoped email uniqueness
customerSchema.index({ owner: 1, createdAt: -1 });
customerSchema.index({ owner: 1, email: 1 }, { unique: true });

// Segment automatically hooks into calculations (e.g. VIP threshold calculations)
customerSchema.pre('save', function(next) {
  // Simple heuristic for loyalty points/totalPurchases segmentation
  if (this.loyaltyPoints > 500 || this.totalPurchases > 5000) {
    this.segment = 'vip';
  } else if (this.loyaltyPoints > 100 || this.totalPurchases > 1000) {
    this.segment = 'regular';
  } else {
    this.segment = 'new';
  }
  next();
});

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
