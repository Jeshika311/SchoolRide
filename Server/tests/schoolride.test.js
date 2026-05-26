import test from 'node:test';
import assert from 'node:assert';
import * as busController from '../controllers/busController.js';
import * as bookingNewController from '../controllers/bookingNewController.js';
import * as paymentController from '../controllers/paymentController.js';
import * as trackingController from '../controllers/trackingController.js';

// --- MOCK DATABASE STORES --- //
let mockBuses = [];
let mockBookings = [];
let mockPayments = [];
let mockTrackings = [];
let idCounter = 1;

// --- MODEL MONKEY PATCHES --- //
import busModel from '../models/busModel.js';
import bookingNewModel from '../models/bookingNewModel.js';
import paymentModel from '../models/paymentModel.js';
import trackingModel from '../models/trackingModel.js';

// Bus Model Patching
busModel.prototype.save = async function () {
  this._id = `bus_${idCounter++}`;
  mockBuses.push(this);
  return this;
};
busModel.findOne = async (query) => {
  if (query.busNumber) {
    return mockBuses.find(b => b.busNumber === query.busNumber) || null;
  }
  return null;
};
busModel.findById = async (id) => {
  const b = mockBuses.find(x => x._id === id);
  if (!b) return null;
  b.save = async function() {
    const idx = mockBuses.findIndex(x => x._id === id);
    mockBuses[idx] = this;
    return this;
  };
  return b;
};
busModel.find = (query) => {
  const chain = {
    sort: () => chain,
    limit: () => chain,
    skip: async () => mockBuses
  };
  return chain;
};
busModel.countDocuments = async () => mockBuses.length;

busModel.findOneAndUpdate = async (query, update) => {
  const b = mockBuses.find(x => x._id === query._id);
  if (!b) return null;
  
  if (query.occupiedSeats && query.occupiedSeats.$ne) {
    const seatNum = query.occupiedSeats.$ne;
    if (b.occupiedSeats.includes(seatNum)) {
      return null;
    }
  }

  if (update && update.$push && update.$push.occupiedSeats) {
    b.occupiedSeats.push(update.$push.occupiedSeats);
  }

  return b;
};

// Booking New Model Patching
bookingNewModel.prototype.save = async function () {
  this._id = `booking_${idCounter++}`;
  mockBookings.push(this);
  return this;
};
bookingNewModel.findOne = async (query) => {
  return mockBookings.find(b => {
    if (query.busId && b.busId.toString() !== query.busId.toString()) return false;
    if (query.seatNumber && b.seatNumber !== query.seatNumber) return false;
    if (query.studentId && b.studentId.toString() !== query.studentId.toString()) return false;
    if (query.bookingStatus && query.bookingStatus.$in) {
      return query.bookingStatus.$in.includes(b.bookingStatus);
    }
    return true;
  }) || null;
};
bookingNewModel.find = (query) => {
  let results = mockBookings;
  if (query.studentId) results = results.filter(b => b.studentId.toString() === query.studentId.toString());
  if (query.busId) results = results.filter(b => b.busId.toString() === query.busId.toString());
  if (query.bookingStatus) results = results.filter(b => b.bookingStatus === query.bookingStatus);
  const chain = {
    populate: () => chain,
    sort: () => chain,
    then: (resolve) => resolve(results)
  };
  return chain;
};
bookingNewModel.findById = async (id) => {
  const b = mockBookings.find(x => x._id === id);
  if (!b) return null;
  b.save = async function() {
    const idx = mockBookings.findIndex(x => x._id === id);
    mockBookings[idx] = this;
    return this;
  };
  b.populate = () => {
    const chain = {
      populate: () => chain,
      then: (resolve) => resolve(b)
    };
    return chain;
  };
  return b;
};

// Payment Model Patching
paymentModel.prototype.save = async function () {
  this._id = `payment_${idCounter++}`;
  mockPayments.push(this);
  return this;
};
paymentModel.findOne = async (query) => {
  if (query.orderId) {
    const p = mockPayments.find(x => x.orderId === query.orderId);
    if (!p) return null;
    p.save = async function() {
      return this;
    };
    return p;
  }
  return null;
};
paymentModel.find = () => {
  const chain = {
    populate: () => chain,
    sort: async () => mockPayments
  };
  return chain;
};

// Tracking Model Patching
trackingModel.findOneAndUpdate = async (query, update, options) => {
  const existing = mockTrackings.find(t => t.busId === query.busId);
  if (existing) {
    Object.assign(existing, update);
    existing.updatedAt = new Date();
    return existing;
  }
  const newTrack = {
    busId: query.busId,
    ...update,
    updatedAt: new Date()
  };
  mockTrackings.push(newTrack);
  return newTrack;
};
trackingModel.findOne = async (query) => {
  return mockTrackings.find(t => t.busId === query.busId) || null;
};

// --- MOCK RESPONSE BUILDER --- //
const mockResponse = () => {
  const res = {};
  let statusSet, jsonSet;
  res.status = (code) => { statusSet = code; return res; };
  res.json = (data) => { jsonSet = data; return res; };
  res.getStatus = () => statusSet;
  res.getJson = () => jsonSet;
  return res;
};

// --- TEST SUITE CASES --- //

test('1. createBus - successful admin bus creation', async () => {
  mockBuses = [];
  const req = {
    body: {
      busNumber: 'BUS-101',
      totalSeats: 20,
      routeName: 'Downtown Express',
      pickupStops: ['Stop A', 'Stop B'],
      dropStops: ['School Main']
    }
  };
  const res = mockResponse();
  const next = (err) => { throw err; };

  await busController.createBus(req, res, next);

  assert.strictEqual(res.getStatus(), 201);
  assert.strictEqual(res.getJson().success, true);
  assert.strictEqual(mockBuses.length, 1);
  assert.strictEqual(mockBuses[0].busNumber, 'BUS-101');
});

test('2. getBusSeats - returns correct seat states', async () => {
  mockBuses = [{
    _id: 'bus_seats_test',
    busNumber: 'BUS-102',
    totalSeats: 5,
    occupiedSeats: [2, 4],
    routeName: 'Test Route',
    pickupStops: [],
    dropStops: []
  }];

  const req = { params: { id: 'bus_seats_test' } };
  const res = mockResponse();
  const next = (err) => { throw err; };

  await busController.getBusSeats(req, res, next);

  assert.strictEqual(res.getStatus(), 200);
  const seats = res.getJson().data.seats;
  assert.strictEqual(seats.length, 5);
  assert.strictEqual(seats[0].isOccupied, false); // seat 1
  assert.strictEqual(seats[1].isOccupied, true);  // seat 2
});

test('3. createBooking - rejects invalid seat numbers', async () => {
  mockBuses = [{
    _id: 'bus_booking_test',
    busNumber: 'BUS-103',
    totalSeats: 15,
    occupiedSeats: [],
    routeName: 'Route 3'
  }];
  mockBookings = [];

  const req = {
    user: { id: 'stud1' },
    body: {
      busId: 'bus_booking_test',
      pickupStop: 'A',
      dropStop: 'B',
      seatNumber: 18 // out of bounds
    }
  };
  const res = mockResponse();
  const next = (err) => { throw err; };

  await bookingNewController.createBooking(req, res, next);

  assert.strictEqual(res.getStatus(), 400);
  assert.match(res.getJson().message, /Invalid seat number/);
});

test('4. createBooking - rejects occupied seats', async () => {
  mockBuses = [{
    _id: 'bus_booking_test2',
    busNumber: 'BUS-104',
    totalSeats: 10,
    occupiedSeats: [5],
    routeName: 'Route 4'
  }];
  mockBookings = [];

  const req = {
    user: { id: 'stud2' },
    body: {
      busId: 'bus_booking_test2',
      pickupStop: 'A',
      dropStop: 'B',
      seatNumber: 5 // occupied
    }
  };
  const res = mockResponse();
  const next = (err) => { throw err; };

  await bookingNewController.createBooking(req, res, next);

  assert.strictEqual(res.getStatus(), 400);
  assert.match(res.getJson().message, /already booked/);
});

test('5. verifyPayment - mock callback payment success confirms seat', async () => {
  const busRef = {
    _id: 'bus_payment_test',
    busNumber: 'BUS-105',
    totalSeats: 10,
    occupiedSeats: [],
    routeName: 'Route 5'
  };
  mockBuses = [busRef];

  const bookingRef = {
    _id: 'booking_payment_test',
    studentId: 'student_pay_1',
    busId: 'bus_payment_test',
    seatNumber: 3,
    bookingStatus: 'Payment Pending'
  };
  mockBookings = [bookingRef];

  const paymentRef = {
    bookingId: 'booking_payment_test',
    studentId: 'student_pay_1',
    amount: 1500,
    orderId: 'order_mock_test123',
    paymentStatus: 'Pending'
  };
  mockPayments = [paymentRef];

  const req = {
    body: {
      razorpay_order_id: 'order_mock_test123',
      razorpay_payment_id: 'pay_mock_success111'
    },
    app: {
      get: () => null // no socket io configured for this test
    }
  };
  const res = mockResponse();
  const next = (err) => { throw err; };

  await paymentController.verifyPayment(req, res, next);

  assert.strictEqual(res.getStatus(), 200);
  assert.strictEqual(bookingRef.bookingStatus, 'Confirmed');
  assert.strictEqual(paymentRef.paymentStatus, 'Paid');
  assert.deepStrictEqual(busRef.occupiedSeats, [3]);
});

test('6. trackingController - updates telemetry and location record', async () => {
  mockBuses = [{
    _id: 'bus_telemetry_test',
    busNumber: 'BUS-106',
    totalSeats: 10,
    occupiedSeats: [],
    routeName: 'Route 6',
    currentLocation: { lat: 0, lng: 0 }
  }];
  mockTrackings = [];

  const req = {
    body: {
      busId: 'bus_telemetry_test',
      latitude: 12.91234,
      longitude: 77.67890,
      speed: 40
    },
    app: {
      get: () => null
    }
  };
  const res = mockResponse();
  const next = (err) => { throw err; };

  await trackingController.updateBusLocation(req, res, next);

  assert.strictEqual(res.getStatus(), 200);
  assert.strictEqual(mockBuses[0].currentLocation.lat, 12.91234);
  assert.strictEqual(mockTrackings.length, 1);
  assert.strictEqual(mockTrackings[0].speed, 40);
});

test('7. getBusCoRiders - returns list of confirmed co-riders on the bus', async () => {
  mockBookings = [
    {
      _id: 'booking_co1',
      studentId: { _id: 'student_1', name: 'Alice Cooper', email: 'alice@school.com' },
      busId: 'bus_co_test',
      seatNumber: 12,
      pickupStop: 'A',
      dropStop: 'B',
      bookingStatus: 'Confirmed'
    },
    {
      _id: 'booking_co2',
      studentId: { _id: 'student_2', name: 'Bob Dylan', email: 'bob@school.com' },
      busId: 'bus_co_test',
      seatNumber: 15,
      pickupStop: 'C',
      dropStop: 'D',
      bookingStatus: 'Confirmed'
    },
    {
      _id: 'booking_co3',
      studentId: 'student_3',
      busId: 'bus_co_test',
      seatNumber: 8,
      bookingStatus: 'Payment Pending'
    }
  ];

  const req = { params: { id: 'bus_co_test' } };
  const res = mockResponse();
  const next = (err) => { throw err; };

  await busController.getBusCoRiders(req, res, next);

  assert.strictEqual(res.getStatus(), 200);
  const data = res.getJson().data;
  assert.strictEqual(data.length, 2);
  assert.strictEqual(data[0].name, 'Alice Cooper');
  assert.strictEqual(data[0].seatNumber, 12);
  assert.strictEqual(data[1].name, 'Bob Dylan');
  assert.strictEqual(data[1].seatNumber, 15);
});
