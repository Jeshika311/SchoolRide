import busModel from '../models/busModel.js';
import bookingNewModel from '../models/bookingNewModel.js';
import routeModel from '../models/routeModel.js';
import { getDriverAssignmentSummary, buildAssignmentNotification } from '../utils/assignmentHelpers.js';
import { sendNotificationToUser } from '../utils/sendNotification.js';
import { emitToRole } from '../sockets/socketManager.js';

// Create a bus
export const createBus = async (req, res, next) => {
  try {
    const { busNumber, totalSeats, routeName, pickupStops, dropStops, currentLocation, driver, route, status = 'active' } = req.body;

    if (!busNumber || !totalSeats || !routeName) {
      return res.status(400).json({
        success: false,
        message: 'Bus Number, Total Seats, and Route Name are required.'
      });
    }

    let driverSummary = null;
    let routeDoc = null;

    if (driver) {
      driverSummary = await getDriverAssignmentSummary(driver);
      if (!driverSummary.ok) {
        return res.status(driverSummary.status).json({ success: false, message: driverSummary.message });
      }
    }

    if (route) {
      routeDoc = await routeModel.findById(route);
      if (!routeDoc) {
        return res.status(404).json({ success: false, message: 'Route not found.' });
      }
    }

    const existingBus = await busModel.findOne({ busNumber });
    if (existingBus) {
      return res.status(400).json({
        success: false,
        message: 'A bus with this number already exists.'
      });
    }

    const bus = new busModel({
      driver: driver || null,
      route: route || null,
      busNumber,
      totalSeats,
      routeName,
      status,
      pickupStops: pickupStops || [],
      dropStops: dropStops || [],
      currentLocation: currentLocation || { lat: 0.0, lng: 0.0 }
    });

    await bus.save();

    if (routeDoc) {
      routeDoc.assignedBus = bus._id;
      routeDoc.driver = driver || routeDoc.driver;
      if (!routeDoc.route_name) {
        routeDoc.route_name = routeName;
      }
      await routeDoc.save();
    }

    if (driverSummary?.ok) {
      const notification = buildAssignmentNotification({
        route: routeDoc,
        bus,
        fallbackTitle: 'Bus assignment created'
      });

      await sendNotificationToUser({
        userId: driverSummary.user._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        data: notification.data,
        saveOnly: false
      });
    }

    ['admin', 'driver', 'parent', 'student'].forEach((role) => {
      emitToRole(role, 'dashboard_updated', { entity: 'bus', id: bus._id, action: 'created' });
    });

    res.status(201).json({
      success: true,
      message: 'Bus created successfully.',
      data: bus
    });
  } catch (error) {
    next(error);
  }
};

// Update a bus
export const updateBus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { busNumber, totalSeats, routeName, pickupStops, dropStops, currentLocation, driver, route, status } = req.body;

    const bus = await busModel.findById(id).populate('driver').populate('route');
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found.'
      });
    }

    const previousDriverId = bus.driver?._id ? String(bus.driver._id) : null;
    const nextDriverId = driver || previousDriverId;
    let driverSummary = null;
    if (driver && String(driver) !== previousDriverId) {
      driverSummary = await getDriverAssignmentSummary(driver);
      if (!driverSummary.ok) {
        return res.status(driverSummary.status).json({ success: false, message: driverSummary.message });
      }
    } else if (nextDriverId) {
      driverSummary = await getDriverAssignmentSummary(nextDriverId);
    }

    let routeDoc = null;
    if (route) {
      routeDoc = await routeModel.findById(route);
      if (!routeDoc) {
        return res.status(404).json({ success: false, message: 'Route not found.' });
      }
    }

    if (busNumber && busNumber !== bus.busNumber) {
      const existingBus = await busModel.findOne({ busNumber });
      if (existingBus) {
        return res.status(400).json({
          success: false,
          message: 'Another bus with this number already exists.'
        });
      }
      bus.busNumber = busNumber;
    }

    if (totalSeats !== undefined) bus.totalSeats = totalSeats;
    if (routeName !== undefined) bus.routeName = routeName;
    if (pickupStops !== undefined) bus.pickupStops = pickupStops;
    if (dropStops !== undefined) bus.dropStops = dropStops;
    if (currentLocation !== undefined) bus.currentLocation = currentLocation;
    if (driver !== undefined) bus.driver = driver;
    if (route !== undefined) bus.route = route;
    if (status !== undefined) bus.status = status;

    await bus.save();

    if (routeDoc) {
      routeDoc.assignedBus = bus._id;
      if (driver !== undefined) {
        routeDoc.driver = driver;
      }
      routeDoc.route_name = routeDoc.route_name || routeName || bus.routeName;
      await routeDoc.save();
    }

    if (driverSummary?.ok && String(driverSummary.user._id) !== previousDriverId) {
      const notification = buildAssignmentNotification({
        route: routeDoc || bus.route,
        bus,
        fallbackTitle: 'Bus assignment updated'
      });

      await sendNotificationToUser({
        userId: driverSummary.user._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        data: notification.data,
        saveOnly: false
      });
    }

    ['admin', 'driver', 'parent', 'student'].forEach((role) => {
      emitToRole(role, 'dashboard_updated', { entity: 'bus', id: bus._id, action: 'updated' });
    });

    res.status(200).json({
      success: true,
      message: 'Bus updated successfully.',
      data: bus
    });
  } catch (error) {
    next(error);
  }
};

// Delete a bus
export const deleteBus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bus = await busModel.findByIdAndDelete(id);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bus deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// Get all buses (with optional route filtering, search, and pagination)
export const getBuses = async (req, res, next) => {
  try {
    const { routeName, search, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (routeName) {
      filter.routeName = { $regex: routeName, $options: 'i' };
    }

    if (search) {
      filter.$or = [
        { busNumber: { $regex: search, $options: 'i' } },
        { routeName: { $regex: search, $options: 'i' } },
        { pickupStops: { $elemMatch: { $regex: search, $options: 'i' } } },
        { dropStops: { $elemMatch: { $regex: search, $options: 'i' } } }
      ];
    }

    const skipIndex = (parseInt(page) - 1) * parseInt(limit);
    const total = await busModel.countDocuments(filter);
    const buses = await busModel.find(filter)
      .populate('driver', 'name email phone_number profile_photo role isAvailable')
      .populate('route')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skipIndex);

    res.status(200).json({
      success: true,
      data: buses,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get a bus by ID
export const getBusById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bus = await busModel.findById(id).populate('driver', 'name email phone_number profile_photo role isAvailable').populate('route');

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: bus
    });
  } catch (error) {
    next(error);
  }
};

// Get seats for a bus (GET /api/buses/:id/seats)
export const getBusSeats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bus = await busModel.findById(id);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found.'
      });
    }

    const seats = [];
    for (let i = 1; i <= bus.totalSeats; i++) {
      seats.push({
        seatNumber: i,
        isOccupied: bus.occupiedSeats.includes(i)
      });
    }

    res.status(200).json({
      success: true,
      data: {
        busId: bus._id,
        totalSeats: bus.totalSeats,
        occupiedSeats: bus.occupiedSeats,
        seats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get co-riders for a bus (GET /api/buses/:id/co-riders)
export const getBusCoRiders = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find all bookings for this bus that are Confirmed
    const bookings = await bookingNewModel.find({
      busId: id,
      bookingStatus: 'Confirmed'
    }).populate('studentId', 'name email');

    const coRiders = bookings.map(b => ({
      studentId: b.studentId?._id,
      name: b.studentId?.name || 'Fellow Student',
      email: b.studentId?.email,
      seatNumber: b.seatNumber,
      pickupStop: b.pickupStop,
      dropStop: b.dropStop
    }));

    res.status(200).json({
      success: true,
      data: coRiders
    });
  } catch (error) {
    next(error);
  }
};
