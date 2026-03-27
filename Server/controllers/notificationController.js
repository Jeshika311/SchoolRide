import mongoose from 'mongoose';
import notificationModel from '../models/notificationModel.js';
import userModel from '../models/userModel.js';
import {
  sendNotificationToUser,
  sendBulkNotifications
} from '../utils/sendNotification.js';

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
};

export const updateDeviceToken = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { device_token } = req.body;

    const user = await userModel.findByIdAndUpdate(
      userId,
      { device_token: device_token || null },
      { new: true }
    ).select('_id device_token');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Device token updated successfully',
      data: {
        userId: user._id,
        device_token: user.device_token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const sendNotification = async (req, res, next) => {
  try {
    const {
      user_id,
      title,
      body,
      message,
      type = 'general',
      data = {},
      save_only = false
    } = req.body;

    const result = await sendNotificationToUser({
      userId: user_id,
      title,
      message: message || body,
      type,
      data,
      saveOnly: parseBoolean(save_only)
    });

    return res.status(201).json({
      success: true,
      message: 'Notification processed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const sendBulkNotification = async (req, res, next) => {
  try {
    const {
      user_ids,
      title,
      body,
      message,
      type = 'general',
      data = {},
      save_only = false
    } = req.body;

    const result = await sendBulkNotifications({
      userIds: user_ids,
      title,
      message: message || body,
      type,
      data,
      saveOnly: parseBoolean(save_only)
    });

    return res.status(200).json({
      success: true,
      message: 'Bulk notification processing completed',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const readFilter = req.query.read;
    const skip = (page - 1) * limit;

    const query = { user: userId };
    if (readFilter !== undefined) {
      query.read = parseBoolean(readFilter);
    }

    const [notifications, total] = await Promise.all([
      notificationModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      notificationModel.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getNotificationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification id' });
    }

    const notification = await notificationModel.findById(id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    return res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification id' });
    }

    const notification = await notificationModel.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const result = await notificationModel.updateMany(
      { user: req.user.id, read: false },
      { read: true, readAt: new Date() }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification id' });
    }

    const deleted = await notificationModel.findOneAndDelete({ _id: id, user: req.user.id });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getNotificationStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [total, unread, read] = await Promise.all([
      notificationModel.countDocuments({ user: userId }),
      notificationModel.countDocuments({ user: userId, read: false }),
      notificationModel.countDocuments({ user: userId, read: true })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total,
        unread,
        read
      }
    });
  } catch (error) {
    next(error);
  }
};