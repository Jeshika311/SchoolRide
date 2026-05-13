import Joi from 'joi';

export const sendNotificationSchema = Joi.object({
  user_id: Joi.string().required(),
  title: Joi.string().trim().min(2).max(150).required(),
  body: Joi.string().trim().min(1).max(1000).optional(),
  message: Joi.string().trim().min(1).max(1000).optional(),
  type: Joi.string().valid('general', 'booking', 'trip', 'system', 'alert').default('general'),
  data: Joi.object().optional(),
  save_only: Joi.boolean().optional().default(false)
}).custom((value, helpers) => {
  if (!value.body && !value.message) {
    return helpers.error('any.custom', { message: 'Either body or message is required' });
  }
  return value;
}, 'body/message requirement');

export const sendBulkNotificationSchema = Joi.object({
  user_ids: Joi.array().items(Joi.string().required()).min(1).required(),
  title: Joi.string().trim().min(2).max(150).required(),
  body: Joi.string().trim().min(1).max(1000).optional(),
  message: Joi.string().trim().min(1).max(1000).optional(),
  type: Joi.string().valid('general', 'booking', 'trip', 'system', 'alert').default('general'),
  data: Joi.object().optional(),
  save_only: Joi.boolean().optional().default(false)
}).custom((value, helpers) => {
  if (!value.body && !value.message) {
    return helpers.error('any.custom', { message: 'Either body or message is required' });
  }
  return value;
}, 'body/message requirement');

export const notificationListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  read: Joi.boolean().optional()
});

export const updateDeviceTokenSchema = Joi.object({
  device_token: Joi.string().allow('', null).optional()
});
