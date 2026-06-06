import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true
  },
  sku: {
    type: String,
    required: [true, 'Please add a SKU number'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    trim: true,
    index: true
  },
  price: {
    type: Number,
    required: [true, 'Please add a selling price'],
    min: [0, 'Price cannot be negative']
  },
  cost: {
    type: Number,
    required: [true, 'Please add a product cost'],
    min: [0, 'Cost cannot be negative']
  },
  stock: {
    type: Number,
    required: [true, 'Please add stock quantity'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  minStock: {
    type: Number,
    default: 10,
    min: [0, 'Minimum stock threshold cannot be negative']
  },
  supplier: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'out-of-stock'],
    default: 'active'
  },
  images: {
    type: [String],
    default: []
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// SKU unique index
productSchema.index({ sku: 1 }, { unique: true });

// Pre-save hook to map stock levels to status automatically
productSchema.pre('save', function(next) {
  if (this.sku) {
    this.sku = this.sku.toUpperCase().trim();
  }
  
  if (this.stock === 0) {
    this.status = 'out-of-stock';
  } else if (this.status === 'out-of-stock' && this.stock > 0) {
    this.status = 'active';
  }
  
  next();
});

// Virtual field for profit margin amount
productSchema.virtual('margin').get(function() {
  return parseFloat((this.price - this.cost).toFixed(2));
});

// Virtual field for profit margin percentage
productSchema.virtual('marginPercentage').get(function() {
  if (!this.price || this.price === 0) return 0;
  return parseFloat((((this.price - this.cost) / this.price) * 100).toFixed(2));
});

const Product = mongoose.model('Product', productSchema);
export default Product;
