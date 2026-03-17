import tripModel from '../models/tripModel.js';
import routeModel from '../models/routeModel.js';
import expressAsyncHandler from 'express-async-handler';
import userModel from '../models/userModel.js';

/**
 * @desc    Create a new Trip
 * @route   POST /api/trips
 * @access  Private/Admin
 */
export const createTrip = expressAsyncHandler(async (req, res) => {
    const { driver_id, route_id, vehicle, date } = req.body;

    if (!driver_id || !route_id || !vehicle || !date) {
        return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const route = await routeModel.findById(route_id);
    if (!route) {
        return res.status(404).json({ success: false, message: 'Route not found' });
    }

    const driver = await userModel.findById(driver_id);
    if (!driver) {
        return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const newTrip = await tripModel.create({
        driver_id,
        route_id,
        vehicle,
        date,
        status: 'scheduled'
    });

    res.status(201).json({
        success: true,
        data: newTrip
    });
});

/**
 * @desc    Get all Trips
 * @route   GET /api/trips
 * @access  Public
 */
export const getTrips = expressAsyncHandler(async (req, res) => {
    const query = req.query; // basic filtering support out of the box e.g., ?status=ongoing
    
    let filters = {};
    if (query.status) filters.status = query.status;
    if (query.driver_id) filters.driver_id = query.driver_id;

    const trips = await tripModel.find(filters)
        .populate('driver_id', 'name email role')
        .populate('route_id')
        .populate('vehicle', 'make model license_plate capacity');

    res.status(200).json({
        success: true,
        count: trips.length,
        data: trips
    });
});

/**
 * @desc    Update Trip Status (Location-based management trigger)
 * @route   PUT /api/trips/:id/status
 * @access  Private/Driver
 */
export const updateTripStatus = expressAsyncHandler(async (req, res) => {
    const { status } = req.body;
    const allowedStatuses = ['scheduled', 'ongoing', 'completed', 'cancelled'];

    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid or missing status field' });
    }

    const trip = await tripModel.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });

    if (!trip) {
        return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    res.status(200).json({
        success: true,
        data: trip
    });
});

/**
 * @desc    Get single trip details
 * @route   GET /api/trips/:id
 * @access  Public
 */
export const getTripDetails = expressAsyncHandler(async (req, res) => {
    const trip = await tripModel.findById(req.params.id)
        .populate('driver_id', 'name email phone')
        .populate('route_id')
        .populate('vehicle');

    if (!trip) {
        return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    res.status(200).json({
        success: true,
        data: trip
    });
});
