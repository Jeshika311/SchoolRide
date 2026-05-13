import express from "express";
import {sendNotification, sendBulkNotification, getMyNotifications, getNotificationById, markNotificationAsRead, 
  markAllNotificationsAsRead, deleteNotification, getNotificationStats, updateDeviceToken } from "../controllers/notificationController.js";

import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import RoleMiddleware from "../middlewares/RoleMiddleware.js";
import ValidationMiddleware from "../middlewares/ValidationMiddleware.js";
import { sendNotificationSchema, sendBulkNotificationSchema, notificationListQuerySchema, updateDeviceTokenSchema
} from "../validators/notificationValidator.js";

const NotificationRouter = express.Router();

NotificationRouter.put(
	'/device-token',
	AuthMiddleware,
	ValidationMiddleware(updateDeviceTokenSchema),
	updateDeviceToken
);

NotificationRouter.post(
	'/send',
	AuthMiddleware,
	RoleMiddleware('admin', 'driver'),
	ValidationMiddleware(sendNotificationSchema),
	sendNotification
);

NotificationRouter.post(
	'/send-bulk',
	AuthMiddleware,
	RoleMiddleware('admin'),
	ValidationMiddleware(sendBulkNotificationSchema),
	sendBulkNotification
);

NotificationRouter.get(
	'/',
	AuthMiddleware,
	ValidationMiddleware(notificationListQuerySchema, 'query'),
	getMyNotifications
);

NotificationRouter.get('/stats', AuthMiddleware, getNotificationStats);
NotificationRouter.get('/:id', AuthMiddleware, getNotificationById);
NotificationRouter.patch('/:id/read', AuthMiddleware, markNotificationAsRead);
NotificationRouter.patch('/read-all', AuthMiddleware, markAllNotificationsAsRead);
NotificationRouter.delete('/:id', AuthMiddleware, deleteNotification);

export default NotificationRouter;