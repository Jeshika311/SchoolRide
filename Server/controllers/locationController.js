import expressAsyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import locationModel from '../models/locationModel.js';
import tripModel from '../models/tripModel.js';
import routeModel from '../models/routeModel.js';
import bookingModel from '../models/bookingModel.js';
import transportEventModel from '../models/transportEventModel.js';
import { checkGeofenceTrigger } from '../utils/geofenceHelper.js';
import { detectTripAnomalies } from '../utils/etaHelper.js';
import { emitToTrip, emitToUser } from '../sockets/socketManager.js';
import { sendNotificationToUser } from '../utils/sendNotification.js';

const toPoint = (longitude, latitude) => ({
	type: 'Point',
	coordinates: [longitude, latitude]
});

/**
 * @desc    Create a location ping for a trip
 * @route   POST /api/location
 * @access  Private/Driver|Admin|Manager
 */
export const createLocation = expressAsyncHandler(async (req, res) => {
	const { trip_id, longitude, latitude, speed = 0 } = req.body;

       const trip = await tripModel.findById(trip_id);
	if (!trip) {
		return res.status(404).json({ success: false, message: 'Trip not found' });
	}

	const location = await locationModel.create({
		trip_id,
		location: toPoint(longitude, latitude),
		speed
	});

       const route = await routeModel.findById(trip.route_id);
       const driverCoords = { lat: latitude, lon: longitude };

       emitToTrip(trip_id, 'cab_location_broadcast', {
	       tripId: trip_id,
	       latitude,
	       longitude,
	       speed,
	       timestamp: new Date()
       });

       if (route) {
	       const anomaly = detectTripAnomalies(route, driverCoords, speed);

	       if (anomaly.isDelayed) {
		       const recentDelay = await transportEventModel.findOne({
			       trip_id,
			       event_type: 'cab_delayed',
			       createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
		       });

		       if (!recentDelay) {
			       await transportEventModel.create({
				       trip_id,
				       cab_id: trip.vehicle,
				       event_type: 'cab_delayed',
				       description: `Cab is taking longer than usual: ${anomaly.delayReason}`,
				       location: toPoint(longitude, latitude),
				       speed,
				       eta_minutes: anomaly.updatedEta
			       });

			       const bookings = await bookingModel.find({ trip_id, status: 'accepted' });
				       for (const booking of bookings) {
					       const sent = await sendNotificationToUser({
					       userId: booking.parent_id,
					       title: 'Delay Alert ⚠️',
					       message: `Your school cab is delayed. Estimated arrival: ${anomaly.updatedEta} mins. Reason: ${anomaly.delayReason}`,
					       type: 'delay',
					       data: { tripId: String(trip_id), eta: String(anomaly.updatedEta) }
				       });

				       emitToUser(booking.parent_id, 'new_notification', {
						       id: sent.notification?._id,
					       title: 'Delay Alert ⚠️',
					       message: `Your school cab is delayed. Reason: ${anomaly.delayReason}`,
					       type: 'delay'
				       });
			       }
		       }
	       }

	       if (route.end_coords && checkGeofenceTrigger(driverCoords, route.end_coords, 300)) {
		       const arrivedSchool = await transportEventModel.findOne({ trip_id, event_type: 'cab_arrived_school' });

		       if (!arrivedSchool) {
			       await transportEventModel.create({
				       trip_id,
				       cab_id: trip.vehicle,
				       event_type: 'cab_arrived_school',
				       description: 'Cab has arrived near the school campus',
				       location: toPoint(longitude, latitude),
				       speed,
				       eta_minutes: 0
			       });

			       const bookings = await bookingModel.find({ trip_id, status: 'accepted' });
				       for (const booking of bookings) {
					       const sent = await sendNotificationToUser({
					       userId: booking.parent_id,
					       title: 'Arrived at School 🏫',
					       message: `The cab carrying ${booking.child_name} has arrived safely near the school campus.`,
					       type: 'safety',
					       data: { tripId: String(trip_id) }
				       });

				       emitToUser(booking.parent_id, 'new_notification', {
						       id: sent.notification?._id,
					       title: 'Arrived at School 🏫',
					       message: 'The cab has arrived safely near the school campus.',
					       type: 'safety'
				       });
			       }
		       }
	       }

	       if (route.start_coords && checkGeofenceTrigger(driverCoords, route.start_coords, 300)) {
		       const arrivedPickup = await transportEventModel.findOne({ trip_id, event_type: 'cab_arrived_pickup' });

		       if (!arrivedPickup) {
			       await transportEventModel.create({
				       trip_id,
				       cab_id: trip.vehicle,
				       event_type: 'cab_arrived_pickup',
				       description: 'Cab is approaching the pickup location',
				       location: toPoint(longitude, latitude),
				       speed,
				       eta_minutes: anomaly.updatedEta
			       });

			       const bookings = await bookingModel.find({ trip_id, status: 'accepted' });
				       for (const booking of bookings) {
					       const sent = await sendNotificationToUser({
					       userId: booking.parent_id,
					       title: 'Cab Approaching 🚖',
					       message: 'Your school cab is approaching the pickup point. Please get ready.',
					       type: 'general',
					       data: { tripId: String(trip_id) }
				       });

				       emitToUser(booking.parent_id, 'new_notification', {
						       id: sent.notification?._id,
					       title: 'Cab Approaching 🚖',
					       message: 'Your school cab is approaching the pickup point.',
					       type: 'general'
				       });
			       }
		       }
	       }
       }

	res.status(201).json({
		success: true,
		data: location
	});
});

/**
 * @desc    Get all location pings with optional trip filter
 * @route   GET /api/location
 * @access  Private
 */
export const getLocations = expressAsyncHandler(async (req, res) => {
	const page = Math.max(parseInt(req.query.page || '1', 10), 1);
	const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
	const skip = (page - 1) * limit;

	const query = {};
	if (req.query.trip_id) {
		query.trip_id = req.query.trip_id;
	}

	const [locations, total] = await Promise.all([
		locationModel
			.find(query)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.populate('trip_id', 'driver_id route_id status date'),
		locationModel.countDocuments(query)
	]);

	res.status(200).json({
		success: true,
		count: locations.length,
		data: locations,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit)
		}
	});
});

/**
 * @desc    Get latest location for a specific trip
 * @route   GET /api/location/trip/:tripId/latest
 * @access  Private
 */
export const getLatestTripLocation = expressAsyncHandler(async (req, res) => {
	const { tripId } = req.params;

	const latest = await locationModel
		.findOne({ trip_id: tripId })
		.sort({ createdAt: -1 })
		.populate('trip_id', 'driver_id route_id status date');

	if (!latest) {
		return res.status(404).json({ success: false, message: 'No location data found for this trip' });
	}

	res.status(200).json({
		success: true,
		data: latest
	});
});

/**
 * @desc    Get location history for a trip
 * @route   GET /api/location/trip/:tripId/history
 * @access  Private
 */
export const getTripLocationHistory = expressAsyncHandler(async (req, res) => {
	const { tripId } = req.params;
	const page = Math.max(parseInt(req.query.page || '1', 10), 1);
	const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 500);
	const skip = (page - 1) * limit;

	const [items, total] = await Promise.all([
		locationModel
			.find({ trip_id: tripId })
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit),
		locationModel.countDocuments({ trip_id: tripId })
	]);

	res.status(200).json({
		success: true,
		count: items.length,
		data: items,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit)
		}
	});
});

/**
 * @desc    Get one location by id
 * @route   GET /api/location/:id
 * @access  Private
 */
export const getLocationById = expressAsyncHandler(async (req, res) => {
	const location = await locationModel
		.findById(req.params.id)
		.populate('trip_id', 'driver_id route_id status date');

	if (!location) {
		return res.status(404).json({ success: false, message: 'Location not found' });
	}

	res.status(200).json({
		success: true,
		data: location
	});
});

/**
 * @desc    Update a location ping
 * @route   PUT /api/location/:id
 * @access  Private/Driver|Admin|Manager
 */
export const updateLocation = expressAsyncHandler(async (req, res) => {
	const updates = {};

	if (req.body.trip_id) {
		const trip = await tripModel.findById(req.body.trip_id).select('_id');
		if (!trip) {
			return res.status(404).json({ success: false, message: 'Trip not found' });
		}
		updates.trip_id = req.body.trip_id;
	}

	if (req.body.longitude !== undefined && req.body.latitude !== undefined) {
		updates.location = toPoint(req.body.longitude, req.body.latitude);
	}

	if (req.body.speed !== undefined) {
		updates.speed = req.body.speed;
	}

	const location = await locationModel.findByIdAndUpdate(
		req.params.id,
		updates,
		{ new: true, runValidators: true }
	).populate('trip_id', 'driver_id route_id status date');

	if (!location) {
		return res.status(404).json({ success: false, message: 'Location not found' });
	}

	res.status(200).json({
		success: true,
		data: location
	});
});

/**
 * @desc    Delete a location ping
 * @route   DELETE /api/location/:id
 * @access  Private/Admin|Manager
 */
export const deleteLocation = expressAsyncHandler(async (req, res) => {
	const location = await locationModel.findByIdAndDelete(req.params.id);

	if (!location) {
		return res.status(404).json({ success: false, message: 'Location not found' });
	}

	res.status(200).json({
		success: true,
		message: 'Location deleted successfully'
	});
});

/**
 * @desc    Find locations near coordinates
 * @route   GET /api/location/nearby/search
 * @access  Private
 */
export const getNearbyLocations = expressAsyncHandler(async (req, res) => {
	const { longitude, latitude, radius = 1000 } = req.query;

	const nearby = await locationModel.find({
		location: {
			$near: {
				$geometry: {
					type: 'Point',
					coordinates: [Number(longitude), Number(latitude)]
				},
				$maxDistance: Number(radius)
			}
		}
	}).sort({ createdAt: -1 });

	res.status(200).json({
		success: true,
		count: nearby.length,
		data: nearby
	});
});

export const validateObjectIdParam = (paramName) => {
	return (req, res, next) => {
		const value = req.params[paramName];
		if (!mongoose.Types.ObjectId.isValid(value)) {
			return res.status(400).json({
				success: false,
				message: `Invalid ${paramName}`
			});
		}
		next();
	};
};
