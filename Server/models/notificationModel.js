import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

const notificationModel = mongoose.models.notification || mongoose.model('notification', notificationSchema);

export default notificationModel;