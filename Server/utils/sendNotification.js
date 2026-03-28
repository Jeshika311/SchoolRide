import admin, { isFirebaseReady } from '../config/firebase.js';
import notificationModel from '../models/notificationModel.js';
import userModel from '../models/userModel.js';

const DELIVERY_STATUS = {
	SENT: 'sent',
	FAILED: 'failed',
	NOT_ATTEMPTED: 'not_attempted'
};

const normalizeDataValues = (data = {}) => {
	const safeData = {};
	Object.entries(data).forEach(([key, value]) => {
		safeData[key] = value === null || value === undefined ? '' : String(value);
	});
	return safeData;
};

export const sendNotificationToUser = async ({
	userId,
	title,
	message,
	type = 'general',
	data = {},
	saveOnly = false
}) => {
	if (!userId || !title || !message) {
		throw new Error('userId, title and message are required');
	}

	const user = await userModel.findById(userId).select('device_token');

	if (!user) {
		throw new Error('User not found');
	}

	let deliveryStatus = DELIVERY_STATUS.NOT_ATTEMPTED;
	let deliveryMessage = 'Push not attempted';
	let fcmResponse = null;

	const hasDeviceToken = Boolean(user.device_token);
	const canSendPush = !saveOnly && hasDeviceToken && isFirebaseReady();

	if (canSendPush) {
		try {
			const response = await admin.messaging().send({
				token: user.device_token,
				notification: {
					title,
					body: message
				},
				data: normalizeDataValues(data)
			});

			fcmResponse = response;
			deliveryStatus = DELIVERY_STATUS.SENT;
			deliveryMessage = 'Notification sent via FCM';
		} catch (error) {
			deliveryStatus = DELIVERY_STATUS.FAILED;
			deliveryMessage = error.message || 'Failed to send via FCM';
		}
	} else if (!hasDeviceToken) {
		deliveryMessage = 'User has no device token';
	} else if (!isFirebaseReady()) {
		deliveryMessage = 'Firebase not configured';
	}

	const notification = await notificationModel.create({
		user: userId,
		title,
		message,
		type,
		data,
		deliveryStatus,
		deliveryMessage
	});

	return {
		notification,
		deliveryStatus,
		deliveryMessage,
		fcmResponse
	};
};

export const sendBulkNotifications = async ({
	userIds = [],
	title,
	message,
	type = 'general',
	data = {},
	saveOnly = false
}) => {
	const uniqueUserIds = [...new Set(userIds.filter(Boolean).map((id) => String(id)))];

	if (!uniqueUserIds.length) {
		throw new Error('At least one userId is required');
	}

	const result = {
		total: uniqueUserIds.length,
		success: 0,
		failed: 0,
		items: []
	};

	for (const userId of uniqueUserIds) {
		try {
			const sent = await sendNotificationToUser({
				userId,
				title,
				message,
				type,
				data,
				saveOnly
			});

			result.success += 1;
			result.items.push({
				userId,
				success: true,
				deliveryStatus: sent.deliveryStatus,
				deliveryMessage: sent.deliveryMessage,
				notificationId: sent.notification._id
			});
		} catch (error) {
			result.failed += 1;
			result.items.push({
				userId,
				success: false,
				error: error.message
			});
		}
	}

	return result;
};
