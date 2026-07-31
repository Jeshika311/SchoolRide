import routeModel from '../models/routeModel.js';
import userModel from '../models/userModel.js';
import busModel from '../models/busModel.js';
import expressAsyncHandler from 'express-async-handler';
import { calculateRouteDetails } from '../services/mapService.js';
import { getDriverAssignmentSummary, buildAssignmentNotification } from '../utils/assignmentHelpers.js';
import { sendNotificationToUser } from '../utils/sendNotification.js';
import { emitToRole } from '../sockets/socketManager.js';

/**
 * @desc    Create a new Route
 * @route   POST /api/routes
 * @access  Private/Admin
 */
export const createRoute = expressAsyncHandler(async (req, res) => {
    const {
        driver,
        assignedBus,
        route_name,
        start_location,
        end_location,
        stops,
        coordinates,
        estimated_time_minutes,
        distance_km
    } = req.body;

    if (!driver || !start_location || !end_location) {
        return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const driverSummary = await getDriverAssignmentSummary(driver);
    if (!driverSummary.ok) {
        return res.status(driverSummary.status).json({ success: false, message: driverSummary.message });
    }

    let busDoc = null;
    if (assignedBus) {
        busDoc = await busModel.findById(assignedBus);
        if (!busDoc) {
            return res.status(404).json({ success: false, message: 'Bus not found' });
        }
    }

    // Test map integration (calculate distance/time before creating)
    const mapDetails = await calculateRouteDetails(start_location, end_location, stops || []);

    const route = await routeModel.create({
        driver,
        assignedBus: assignedBus || null,
        route_name: route_name || `${start_location} to ${end_location}`,
        start_location,
        end_location,
        stops: stops || [],
        coordinates: coordinates || [],
        start_coords: mapDetails.start_coords,
        end_coords: mapDetails.end_coords,
        distance_km: distance_km || mapDetails.distance_km,
        duration_minutes: mapDetails.duration_minutes,
        estimated_time_minutes: estimated_time_minutes || mapDetails.duration_minutes
    });

    if (busDoc) {
        busDoc.route = route._id;
        busDoc.driver = driver;
        busDoc.routeName = route.route_name;
        await busDoc.save();
    }

    const notification = buildAssignmentNotification({
        route,
        bus: busDoc,
        fallbackTitle: 'Route assignment created'
    });

    await sendNotificationToUser({
        userId: driverSummary.user._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        data: notification.data,
        saveOnly: false
    });

    ['admin', 'driver', 'parent', 'student'].forEach((role) => {
        emitToRole(role, 'dashboard_updated', { entity: 'route', id: route._id, action: 'created' });
    });

    res.status(201).json({
        success: true,
        data: route,
        map_details: mapDetails
    });
});

/**
 * @desc    Get all routes
 * @route   GET /api/routes
 * @access  Public
 */
export const getRoutes = expressAsyncHandler(async (req, res) => {
    const routes = await routeModel.find().populate('driver', 'name email role profile_photo isAvailable').populate('assignedBus');
    res.status(200).json({
        success: true,
        count: routes.length,
        data: routes
    });
});

/**
 * @desc    Get single route by ID and generate dynamic Map routing details
 * @route   GET /api/routes/:id
 * @access  Public
 */
export const getRouteById = expressAsyncHandler(async (req, res) => {
    const route = await routeModel.findById(req.params.id).populate('driver', 'name email role profile_photo isAvailable').populate('assignedBus');

    if (!route) {
        return res.status(404).json({ success: false, message: 'Route not found' });
    }

    // Call Map API for Distance & Time on Request
    const mapDetails = await calculateRouteDetails(route.start_location, route.end_location, route.stops);

    res.status(200).json({
        success: true,
        data: route,
        map_details: mapDetails
    });
});

/**
 * @desc    Delete route
 * @route   DELETE /api/routes/:id
 * @access  Private/Admin
 */
export const deleteRoute = expressAsyncHandler(async (req, res) => {
    const route = await routeModel.findByIdAndDelete(req.params.id);

    if (!route) {
        return res.status(404).json({ success: false, message: 'Route not found' });
    }

    res.status(200).json({
        success: true,
        message: 'Route deleted successfully'
    });
});

/**
 * @desc    Update route and optionally reassign driver/bus
 * @route   PUT /api/routes/:id
 * @access  Private/Admin
 */
export const updateRoute = expressAsyncHandler(async (req, res) => {
        const { id } = req.params;
        const {
                driver,
                assignedBus,
                route_name,
                start_location,
                end_location,
                stops,
                coordinates,
                estimated_time_minutes,
                distance_km
        } = req.body;

        const route = await routeModel.findById(id).populate('driver').populate('assignedBus');
        if (!route) {
                return res.status(404).json({ success: false, message: 'Route not found' });
        }

        let driverSummary = null;
        if (driver) {
            driverSummary = await getDriverAssignmentSummary(driver);
            if (!driverSummary.ok) {
                return res.status(driverSummary.status).json({ success: false, message: driverSummary.message });
            }
        }

        let busDoc = null;
        if (assignedBus) {
            busDoc = await busModel.findById(assignedBus);
            if (!busDoc) {
                return res.status(404).json({ success: false, message: 'Bus not found' });
            }
        }

        if (driver !== undefined) route.driver = driver;
        if (assignedBus !== undefined) route.assignedBus = assignedBus;
        if (route_name !== undefined) route.route_name = route_name;
        if (start_location !== undefined) route.start_location = start_location;
        if (end_location !== undefined) route.end_location = end_location;
        if (stops !== undefined) route.stops = stops;
        if (coordinates !== undefined) route.coordinates = coordinates;
        if (estimated_time_minutes !== undefined) route.estimated_time_minutes = estimated_time_minutes;
        if (distance_km !== undefined) route.distance_km = distance_km;

        await route.save();

        if (busDoc) {
            busDoc.route = route._id;
            busDoc.driver = driver || route.driver;
            busDoc.routeName = route.route_name || `${route.start_location} to ${route.end_location}`;
            await busDoc.save();
        }

        if (driverSummary?.ok) {
            const notification = buildAssignmentNotification({
                route,
                bus: busDoc,
                fallbackTitle: 'Route assignment updated'
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
            emitToRole(role, 'dashboard_updated', { entity: 'route', id: route._id, action: 'updated' });
        });

        return res.status(200).json({
                success: true,
                message: 'Route updated successfully',
                data: route
        });
});
