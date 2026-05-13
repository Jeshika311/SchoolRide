import express from 'express';
import { createTrip, getTrips, updateTripStatus, getTripDetails } from '../controllers/tripController.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import RoleMiddleware from '../middlewares/RoleMiddleware.js';

const tripRouter = express.Router();

tripRouter.use(AuthMiddleware);

tripRouter.route('/')
    .post(RoleMiddleware('admin', 'manager'), createTrip)
    .get(getTrips);

tripRouter.route('/:id/status')
    .put(RoleMiddleware('driver', 'admin', 'manager'), updateTripStatus);

tripRouter.route('/:id')
    .get(getTripDetails);

export default tripRouter;
