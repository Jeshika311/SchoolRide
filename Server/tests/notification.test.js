import test from 'node:test';
import assert from 'node:assert';

import * as notificationController from '../controllers/notificationController.js';
import notificationModel from '../models/notificationModel.js';
import userModel from '../models/userModel.js';

const mockResponse = () => {
  const res = {};
  let statusSet;
  let jsonSet;

  res.status = (code) => {
    statusSet = code;
    return res;
  };

  res.json = (data) => {
    jsonSet = data;
    return res;
  };

  res.getStatus = () => statusSet;
  res.getJson = () => jsonSet;
  return res;
};

test('1. updateDeviceToken updates token for authenticated user', async () => {
  userModel.findByIdAndUpdate = () => ({
    select: async () => ({ _id: 'u1', device_token: 'token-123' })
  });

  const req = {
    user: { id: 'u1' },
    body: { device_token: 'token-123' }
  };
  const res = mockResponse();

  await notificationController.updateDeviceToken(req, res, (err) => {
    throw err;
  });

  assert.strictEqual(res.getStatus(), 200);
  assert.strictEqual(res.getJson().success, true);
  assert.strictEqual(res.getJson().data.device_token, 'token-123');
});

test('2. sendNotification stores notification in save-only mode', async () => {
  userModel.findById = () => ({
    select: async () => ({ _id: 'u2', device_token: null })
  });

  notificationModel.create = async (payload) => ({
    _id: 'n1',
    ...payload
  });

  const req = {
    body: {
      user_id: 'u2',
      title: 'Ride Update',
      body: 'Driver reached pickup point',
      type: 'trip',
      save_only: true
    }
  };
  const res = mockResponse();

  await notificationController.sendNotification(req, res, (err) => {
    throw err;
  });

  assert.strictEqual(res.getStatus(), 201);
  assert.strictEqual(res.getJson().success, true);
  assert.strictEqual(res.getJson().data.notification.title, 'Ride Update');
});

test('3. getMyNotifications returns paginated notifications', async () => {
  notificationModel.find = () => {
    const chain = {
      sort: () => chain,
      skip: () => chain,
      limit: async () => [{ _id: 'n1' }, { _id: 'n2' }]
    };
    return chain;
  };

  notificationModel.countDocuments = async () => 2;

  const req = {
    user: { id: 'u3' },
    query: { page: '1', limit: '20', read: 'false' }
  };
  const res = mockResponse();

  await notificationController.getMyNotifications(req, res, (err) => {
    throw err;
  });

  assert.strictEqual(res.getStatus(), 200);
  assert.strictEqual(res.getJson().success, true);
  assert.strictEqual(res.getJson().pagination.total, 2);
  assert.strictEqual(res.getJson().data.length, 2);
});

test('4. markAllNotificationsAsRead returns modified count', async () => {
  notificationModel.updateMany = async () => ({ modifiedCount: 3 });

  const req = {
    user: { id: 'u4' }
  };
  const res = mockResponse();

  await notificationController.markAllNotificationsAsRead(req, res, (err) => {
    throw err;
  });

  assert.strictEqual(res.getStatus(), 200);
  assert.strictEqual(res.getJson().success, true);
  assert.strictEqual(res.getJson().data.modifiedCount, 3);
});
