import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Notification must be linked to a user account'],
    index: true
  },
  type: {
    type: String,
    required: [true, 'Please specify alert type'], // e.g. 'inventory_alert', 'payment_pending', 'system_event'
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Please add notification message content'],
    trim: true
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low',
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for retrieving unread alerts by priority first
notificationSchema.index({ owner: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1, priority: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
