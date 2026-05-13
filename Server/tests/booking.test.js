import test from 'node:test';
import assert from 'node:assert';
import * as bookingController from '../controllers/bookingController.js';

// ---- MOCK SETUP ---- //

let mockDatabase = [];
let idCounter = 1;

// Because we are using ESM and standard Node test runner rather than Jest,
// we will intercept calls to the database.
// The easiest way is to temporarily replace the model functions during the test,
// or just modify the controller code to use dependency injection.
// Since we don't want to change the clean controller code, we can monkey-patch bookingModel.
import bookingModel from '../models/bookingModel.js';

bookingModel.prototype.save = async function () {
    this._id = `mock_id_${idCounter++}`;
    mockDatabase.push(this);
    return this;
};

bookingModel.find = (query) => {
    let results = mockDatabase;
    if (query && query.parent_id) results = results.filter(b => b.parent_id === query.parent_id);
    if (query && query.driver_id) results = results.filter(b => b.driver_id === query.driver_id);

    const populateMock = {
        populate: () => populateMock,
        sort: async () => results
    };
    return populateMock;
};

bookingModel.findById = (id) => {
    const doc = mockDatabase.find(b => b._id === id);
    if (!doc) return Promise.resolve(null);

    const _doc = { ...doc };
    const origParent = doc.parent_id;
    const origDriver = doc.driver_id;
    _doc.parent_id = { _id: origParent, toString: () => origParent.toString() };
    _doc.driver_id = { _id: origDriver, toString: () => origDriver.toString() };
    _doc.save = async () => {
        const index = mockDatabase.findIndex(b => b._id === doc._id);
        mockDatabase[index] = _doc;
        return _doc;
    };

    // We mock populate and make it awaitable
    const populateMock = {
        populate: () => populateMock,
        then: (resolve) => resolve(_doc),
        catch: () => populateMock
    };

    return populateMock;
};

bookingModel.findByIdAndDelete = async (id) => {
    mockDatabase = mockDatabase.filter(b => b._id !== id);
    return true;
};


// --- VEHICLE MODEL MOCK SETUP --- //
import vehicleModel from '../models/vehicleModel.js';

// track calls to the atomic update functions and control return values
let seatUpdates = [];
let rollbackUpdates = [];
let nextVehicleAvailable = true; // toggle behaviour per test

vehicleModel.findOneAndUpdate = (query, update, options) => {
    seatUpdates.push({ query, update, options });
    if (!nextVehicleAvailable) {
        return Promise.resolve(null);
    }
    // mimic updated document by returning an object with new available_seats
    const newSeats = (query.available_seats && query.available_seats.$gt === 0) ? 0 : undefined;
    return Promise.resolve({ _id: query._id, available_seats: newSeats });
};

vehicleModel.findByIdAndUpdate = (id, update) => {
    rollbackUpdates.push({ id, update });
    return Promise.resolve({ _id: id });
};

// ---- HELPER FOR MOCKING REQ/RES ---- //
const mockResponse = () => {
    const res = {};
    let statusSet, jsonSet;
    res.status = (code) => { statusSet = code; return res; };
    res.json = (data) => { jsonSet = data; return res; };

    res.getStatus = () => statusSet;
    res.getJson = () => jsonSet;
    return res;
};

// ---- TESTS ---- //

// additional seat-concurrency-specific tests

// helper used by several seat tests
function baseReq() {
    return {
        user: { id: 'parent123' },
        body: {
            driver_id: 'driver456',
            route_id: 'route789',
            trip_id: 'trip123',
            vehicle: 'veh123',
            child_name: 'QA First Last',
            pickup_point: 'Home',
            drop_point: 'School'
        }
    };
}

test('1. createBooking - successful creation', async () => {
    mockDatabase = []; // reset state

    const req = {
        user: { id: 'parent123' },
        body: {
            driver_id: 'driver456',
            route_id: 'route789',
            trip_id: 'trip123',
            vehicle: 'veh123',
            child_name: 'QA First Last',
            pickup_point: 'Home',
            drop_point: 'School'
        }
    };
    const res = mockResponse();
    const next = (err) => { throw err; };

    await bookingController.createBooking(req, res, next);

    assert.strictEqual(res.getStatus(), 201);
    assert.strictEqual(res.getJson().success, true);
    assert.strictEqual(mockDatabase.length, 1);
    assert.strictEqual(mockDatabase[0].child_name, 'QA First Last');
});

test('2. createBooking - missing fields', async () => {
    mockDatabase = [];
    seatUpdates = [];
    nextVehicleAvailable = true;

    const req = {
        user: { id: 'parent123' },
        body: {
            driver_id: 'driver456'
            // Missing other fields
        }
    };
    const res = mockResponse();
    const next = () => { };

    await bookingController.createBooking(req, res, next);

    assert.strictEqual(res.getStatus(), 400);
    assert.strictEqual(res.getJson().message, 'All required fields must be provided');
    assert.strictEqual(mockDatabase.length, 0);
    // ensure we never attempted a seat update because we failed early
    assert.strictEqual(seatUpdates.length, 0);
});

// seat concurrency test: no seats available
test('3. createBooking - fail when no seats available', async () => {
    mockDatabase = [];
    seatUpdates = [];
    nextVehicleAvailable = false; // simulate vehicle already full

    const req = baseReq();
    const res = mockResponse();
    const next = (err) => { throw err; };

    await bookingController.createBooking(req, res, next);

    assert.strictEqual(res.getStatus(), 400);
    assert.strictEqual(res.getJson().message, 'No seats available');
    assert.strictEqual(mockDatabase.length, 0);
    assert.strictEqual(seatUpdates.length, 1);
});

// rollback test: if saving booking fails due to duplicate, seats should be restored
test('4. createBooking - rollback when booking duplicate error', async () => {
    mockDatabase = [];
    seatUpdates = [];
    rollbackUpdates = [];
    nextVehicleAvailable = true;

    // make save throw on first attempt
    bookingModel.prototype.save = async function () {
        const err = new Error('dup');
        err.code = 11000;
        throw err;
    };

    const req = baseReq();
    const res = mockResponse();
    const next = (err) => { throw err; };

    await bookingController.createBooking(req, res, next);

    assert.strictEqual(res.getStatus(), 400);
    assert.strictEqual(res.getJson().message, 'A booking for this parent and trip already exists');
    assert.strictEqual(mockDatabase.length, 0);
    assert.strictEqual(seatUpdates.length, 1);
    assert.strictEqual(rollbackUpdates.length, 1);
});


test('5. updateBookingStatus - valid update by driver', async () => {
    mockDatabase = [];
    mockDatabase.push({
        _id: 'mock_edit_1',
        parent_id: 'parent123',
        driver_id: 'driver456',
        status: 'pending'
    });

    const req = {
        params: { id: 'mock_edit_1' },
        user: { id: 'driver456' },
        body: { status: 'accepted' }
    };
    const res = mockResponse();
    const next = (err) => { throw err; };

    await bookingController.updateBookingStatus(req, res, next);

    assert.strictEqual(res.getStatus(), 200);
    assert.strictEqual(res.getJson().data.status, 'accepted');
});

test('6. updateTripStatus - block invalid status', async () => {
    mockDatabase = [];
    mockDatabase.push({
        _id: 'mock_trip_1',
        driver_id: 'driver456',
        trip_status: 'pending'
    });

    const req = {
        params: { id: 'mock_trip_1' },
        user: { id: 'driver456' },
        body: { trip_status: 'flying' } // Invalid status
    };
    const res = mockResponse();
    const next = () => { };

    await bookingController.updateTripStatus(req, res, next);

    assert.strictEqual(res.getStatus(), 400);
    assert.strictEqual(res.getJson().success, false);
    assert.strictEqual(res.getJson().message, 'Invalid trip status');
});

test('7. deleteBooking - parent securely deletes pending booking', async () => {
    mockDatabase = [];
    rollbackUpdates = [];
    mockDatabase.push({
        _id: 'mock_del_1',
        parent_id: 'parent123',
        status: 'pending',
        vehicle: 'veh123'
    });

    const req = {
        params: { id: 'mock_del_1' },
        user: { id: 'parent123', role: 'parent' }
    };
    const res = mockResponse();
    const next = (err) => { throw err; };

    await bookingController.deleteBooking(req, res, next);

    assert.strictEqual(res.getStatus(), 200);
    assert.strictEqual(mockDatabase.length, 0); // successfully deleted
    // verify vehicle seat increment called
    assert.strictEqual(rollbackUpdates.length, 1);
    assert.deepStrictEqual(rollbackUpdates[0].update, { $inc: { available_seats: 1 } });
});
