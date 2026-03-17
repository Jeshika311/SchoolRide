import routeModel from '../models/routeModel.js';
import userModel from '../models/userModel.js';
import expressAsyncHandler from 'express-async-handler';
import { calculateRouteDetails } from '../services/mapService.js';

/**
 * @desc    Create a new Route
 * @route   POST /api/routes
 * @access  Private/Admin
 */
export const createRoute = expressAsyncHandler(async (req, res) => {
    const { driver, start_location, end_location, stops } = req.body;

    if (!driver || !start_location || !end_location) {
        return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const driverDoc = await userModel.findById(driver);
    if (!driverDoc) {
        return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    // Test map integration (calculate distance/time before creating)
    const mapDetails = await calculateRouteDetails(start_location, end_location, stops || []);

    const route = await routeModel.create({
        driver,
        start_location,
        end_location,
        stops: stops || []
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
    const routes = await routeModel.find().populate('driver', 'name email role');
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
    const route = await routeModel.findById(req.params.id).populate('driver', 'name email role');

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
