import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  username: {
    type: String,
    default: ''
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    index: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'employee'],
    default: 'employee'
  },
  avatar: {
    type: String,
    default: ''
  },
  company: {
    type: String,
    required: [true, 'Please add a company name'],
    index: true
  },
  workspaceId: {
    type: String,
    index: true,
    default: function() {
      if (this.company) {
        return this.company.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);
      }
      return 'workspace-' + Math.floor(100000 + Math.random() * 900000);
    }
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
