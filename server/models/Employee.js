import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'leave'],
    required: true
  }
}, { _id: false });

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  dueDate: {
    type: Date
  }
}, { _id: false });

const employeeSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employee must be linked to a user account'],
    index: true
  },
  department: {
    type: String,
    required: [true, 'Please specify a department'],
    trim: true,
    index: true
  },
  position: {
    type: String,
    required: [true, 'Please specify a position/job title'],
    trim: true
  },
  salary: {
    type: Number,
    required: [true, 'Please add a salary amount'],
    min: [0, 'Salary cannot be negative']
  },
  performance: {
    type: Number,
    min: [0, 'Performance score cannot be less than 0'],
    max: [100, 'Performance score cannot be more than 100'],
    default: 100
  },
  attendance: {
    type: [attendanceSchema],
    default: []
  },
  tasks: {
    type: [taskSchema],
    default: []
  }
}, {
  timestamps: true
});

// Compound index for timeline queries and scoped userId uniqueness
employeeSchema.index({ owner: 1, createdAt: -1 });
employeeSchema.index({ owner: 1, userId: 1 }, { unique: true });

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
