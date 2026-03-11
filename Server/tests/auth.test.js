import test from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import * as authController from '../controllers/authController.js';
import userModel from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import { getPrivacy, getTerms } from '../controllers/infoController.js';

// make sure a secret exists
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

// --- MOCK SETUP ---
let fakeUser = null;

// monkey-patch findOne and findById
userModel.findOne = async (query) => {
  if(!fakeUser) return null;
  let result = null;
  if(query.email && fakeUser.email === query.email) result = fakeUser;
  if(query.phone_number && fakeUser.phone_number === query.phone_number) result = fakeUser;
  if(result){
    attachSave(result);
  }
  return result;
};

userModel.findById = async (id) => {
  if(fakeUser && fakeUser._id === id){
    attachSave(fakeUser);
    return fakeUser;
  }
  return null;
};

// ensure any returned user has a save() helper
const attachSave = (user) => {
  if(user && typeof user.save !== 'function'){
    user.save = async function(){
      fakeUser = this;
      return this;
    };
  }
};

userModel.prototype.save = async function () {
  fakeUser = { ...this };
  attachSave(fakeUser);
  return fakeUser;
};

// helper to create fresh fake user object
const createFakeUser = async () => {
  const hashed = await bcrypt.hash('password123', 10);
  fakeUser = {
    _id: 'user123',
    email: 'test@example.com',
    phone_number: '1234567890',
    password: hashed,
    role: 'parent',
    fcmTokens: []
  };
};

// helper for mock req/res
const mockResponse = () => {
  const res = {};
  let statusSet, jsonSet;
  res.status = (code) => { statusSet = code; return res; };
  res.json = (data) => { jsonSet = data; return res; };
  // cookie helpers used by authHelpers
  res.cookie = () => res;
  res.clearCookie = () => res;
  res.getStatus = () => statusSet;
  res.getJson = () => jsonSet;
  return res;
};

// tests

test('login with email works and stores device token', async () => {
  await createFakeUser();
  const req = { body: { email: fakeUser.email, password: 'password123', device_token: 'dev1' } };
  const res = mockResponse();
  await authController.login(req, res);
  assert.strictEqual(res.getStatus(), 200);
  const data = res.getJson();
  assert(data.success);
  assert(data.token);
  assert.deepStrictEqual(data.user.fcmTokens, ['dev1']);
});

test('login with phone number works', async () => {
  await createFakeUser();
  const req = { body: { phone_number: fakeUser.phone_number, password: 'password123', device_token: 'tokenB' } };
  const res = mockResponse();
  await authController.login(req, res);
  assert.strictEqual(res.getStatus(), 200);
  assert(res.getJson().success);
});


test('login rejects missing credentials or device token', async () => {
  const req = { body: { email: '', password: '' } };
  const res = mockResponse();
  await authController.login(req, res);
  assert.strictEqual(res.getStatus(), 400);
});


test('logout returns 401 if no token', async () => {
  const req = { body: {} , cookies: {}, headers: {} };
  const res = mockResponse();
  await authController.logout(req, res);
  assert.strictEqual(res.getStatus(), 401);
});


test('logout succeeds when token present and removes fcm token', async () => {
  await createFakeUser();
  // ensure user has a device token to remove
  fakeUser.fcmTokens = ['tokA'];
  const token = generateToken(fakeUser);
  const req = { body: { device_token: 'tokA' }, cookies: { token } , headers: {} };
  const res = mockResponse();
  await authController.logout(req, res);
  assert.strictEqual(res.getStatus(), 200);
  assert(fakeUser.fcmTokens.length === 0);
});

test('logout works with Authorization header as Bearer token', async () => {
  await createFakeUser();
  fakeUser.fcmTokens = ['hdrTok'];
  const token = generateToken(fakeUser);
  const req = { body: { device_token: 'hdrTok' }, cookies: {}, headers: { authorization: `Bearer ${token}` } };
  const res = mockResponse();
  await authController.logout(req, res);
  assert.strictEqual(res.getStatus(), 200);
  assert(fakeUser.fcmTokens.length === 0);
});


test('privacy endpoint returns static text', () => {
  const res = mockResponse();
  const req = {};
  getPrivacy(req, res);
  assert.strictEqual(res.getStatus(), undefined); // default is not set
  assert(res.getJson().privacy);
});

test('terms endpoint returns static text', () => {
  const res = mockResponse();
  getTerms({}, res);
  assert(res.getJson().terms);
});
