import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    default: function () {
      return this.user;
    }
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    default: null
  },
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'parentProfile',
    default: null
  },
  cabId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'vehicle',
    default: null
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'route',
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'emergency'],
    default: 'normal'
  },
  redirectUrl: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['general', 'booking', 'trip', 'system', 'alert', 'safety', 'delay'],
    default: 'general'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'not_attempted'],
    default: 'pending'
  },
  deliveryMessage: {
    type: String,
    default: ''
  }
}, { timestamps: true })

notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

const notificationModel = mongoose.models.notification || mongoose.model('notification', notificationSchema);

export default notificationModel;