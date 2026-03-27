import express from 'express';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import RoleMiddleware from '../middlewares/RoleMiddleware.js';
import ValidationMiddleware from '../middlewares/ValidationMiddleware.js';
import {
	createLocation,
	deleteLocation,
	getLatestTripLocation,
	getLocationById,
	getLocations,
	getNearbyLocations,
	getTripLocationHistory,
	updateLocation,
	validateObjectIdParam
} from '../controllers/locationController.js';
import {
	createLocationSchema,
	locationHistoryQuerySchema,
	locationListQuerySchema,
	nearbyLocationQuerySchema,
	updateLocationSchema
} from '../validators/locationValidator.js';

const locationRouter = express.Router();

locationRouter.use(AuthMiddleware);

locationRouter.get(
	'/nearby/search',
	ValidationMiddleware(nearbyLocationQuerySchema, 'query'),
	getNearbyLocations
);

locationRouter.get(
	'/trip/:tripId/latest',
	validateObjectIdParam('tripId'),
	getLatestTripLocation
);

locationRouter.get(
	'/trip/:tripId/history',
	validateObjectIdParam('tripId'),
	ValidationMiddleware(locationHistoryQuerySchema, 'query'),
	getTripLocationHistory
);

locationRouter.route('/')
	.post(
		RoleMiddleware('driver', 'admin', 'manager'),
		ValidationMiddleware(createLocationSchema),
		createLocation
	)
	.get(ValidationMiddleware(locationListQuerySchema, 'query'), getLocations);

locationRouter.route('/:id')
	.get(validateObjectIdParam('id'), getLocationById)
	.put(
		validateObjectIdParam('id'),
		RoleMiddleware('driver', 'admin', 'manager'),
		ValidationMiddleware(updateLocationSchema),
		updateLocation
	)
	.delete(
		validateObjectIdParam('id'),
		RoleMiddleware('admin', 'manager'),
		deleteLocation
	);

export default locationRouter;
