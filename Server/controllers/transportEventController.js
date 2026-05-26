import expressAsyncHandler from 'express-async-handler';
import transportEventModel from '../models/transportEventModel.js';
import tripModel from '../models/tripModel.js';
import bookingModel from '../models/bookingModel.js';
import locationModel from '../models/locationModel.js';
import routeModel from '../models/routeModel.js';
import parentProfile from '../models/parentProfile.js';
import { emitToRole, emitToTrip, emitToUser } from '../sockets/socketManager.js';
import { sendNotificationToUser } from '../utils/sendNotification.js';

const toPoint = (longitude, latitude) => ({
  type: 'Point',
  coordinates: [longitude, latitude]
});

const resolveNotificationMeta = (eventType) => {
  switch (eventType) {
    case 'child_boarded':
      return { title: 'Child Boarded Cab', type: 'safety' };
    case 'child_dropped':
      return { title: 'Child Reached Destination', type: 'safety' };
    case 'emergency_sos':
      return { title: 'Emergency SOS Alert', type: 'alert' };
    case 'cab_delayed':
      return { title: 'Route Delay Warning', type: 'delay' };
    default:
      return { title: 'Ride Update', type: 'general' };
  }
};

export const createTransportEvent = expressAsyncHandler(async (req, res) => {
  const {
    trip_id,
    event_type,
    child_id,
    description,
    longitude,
    latitude,
    speed = 0,
    eta_minutes = 0,
    metadata = {}
  } = req.body;

  if (!trip_id || !event_type || !description || longitude === undefined || latitude === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required event fields' });
  }

  const trip = await tripModel.findById(trip_id);
  if (!trip) {
    return res.status(404).json({ success: false, message: 'Trip not found' });
  }

  const event = await transportEventModel.create({
    trip_id,
    cab_id: trip.vehicle,
    event_type,
    child_id: child_id || null,
    description,
    location: toPoint(longitude, latitude),
    speed,
    eta_minutes,
    metadata
  });

  emitToTrip(trip_id, 'transport_event_broadcast', {
    eventId: event._id,
    tripId: trip_id,
    eventType: event_type,
    description,
    location: event.location,
    etaMinutes: eta_minutes,
    timestamp: event.createdAt
  });

  if (event_type === 'emergency_sos') {
    emitToRole('admin', 'sos_broadcast', {
      tripId: trip_id,
      description,
      location: event.location,
      timestamp: event.createdAt
    });
  }

  const notificationsMeta = resolveNotificationMeta(event_type);
  const query = {
    trip_id: trip._id,
    status: 'accepted'
  };

  const bookings = await bookingModel.find(query);
  for (const booking of bookings) {
    const sent = await sendNotificationToUser({
      userId: booking.parent_id,
      title: notificationsMeta.title,
      message: description,
      type: notificationsMeta.type,
      data: { tripId: String(trip_id), childId: child_id ? String(child_id) : '' }
    });

    emitToUser(booking.parent_id, 'new_notification', {
      id: sent.notification?._id,
      title: notificationsMeta.title,
      message: description,
      type: notificationsMeta.type
    });
  }

  return res.status(201).json({
    success: true,
    data: event
  });
});

export const getTransportEvents = expressAsyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
  const skip = (page - 1) * limit;

  const query = { soft_deleted: false };
  if (req.query.trip_id) {
    query.trip_id = req.query.trip_id;
  }
  if (req.query.event_type) {
    query.event_type = req.query.event_type;
  }

  const [events, total] = await Promise.all([
    transportEventModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    transportEventModel.countDocuments(query)
  ]);

  return res.status(200).json({
    success: true,
    count: events.length,
    data: events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

export const getChildTransportEvents = expressAsyncHandler(async (req, res) => {
  const { childId } = req.params;

  if (req.user.role !== 'admin') {
    const profile = await parentProfile.findOne({ user_id: req.user.id });
    if (!profile || String(profile._id) !== childId) {
      return res.status(403).json({ success: false, message: 'Access denied: Profile mismatch' });
    }
  }

  const events = await transportEventModel.find({
    child_id: childId,
    soft_deleted: false
  }).sort({ createdAt: -1 }).limit(50);

  return res.status(200).json({
    success: true,
    data: events
  });
});

export const getLiveCabStatus = expressAsyncHandler(async (req, res) => {
  const { cabId } = req.params;

  const activeTrip = await tripModel.findOne({
    vehicle: cabId,
    status: 'ongoing'
  });

  if (!activeTrip) {
    return res.status(404).json({ success: false, message: 'No active trip ongoing for this vehicle' });
  }

  const [latestLocation, latestEvent, route] = await Promise.all([
    locationModel.findOne({ trip_id: activeTrip._id }).sort({ createdAt: -1 }),
    transportEventModel.findOne({ trip_id: activeTrip._id }).sort({ createdAt: -1 }),
    routeModel.findById(activeTrip.route_id)
  ]);

  return res.status(200).json({
    success: true,
    data: {
      trip_id: activeTrip._id,
      status: activeTrip.status,
      speed: latestLocation?.speed || 0,
      coordinates: latestLocation?.location?.coordinates || null,
      last_ping: latestLocation?.createdAt || null,
      last_event: latestEvent?.event_type || 'none',
      last_event_description: latestEvent?.description || 'No events logged',
      eta_minutes: latestEvent?.eta_minutes || route?.duration_minutes || 0
    }
  });
});
