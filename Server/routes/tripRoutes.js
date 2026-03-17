import express from 'express';
import { createTrip, getTrips, updateTripStatus, getTripDetails } from '../controllers/tripController.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import RoleMiddleware from '../middlewares/RoleMiddleware.js';

const router = express.Router();

router.use(AuthMiddleware);

router.route('/')
    .post(RoleMiddleware('admin', 'manager'), createTrip)
    .get(getTrips);

router.route('/:id/status')
    .put(RoleMiddleware('driver', 'admin', 'manager'), updateTripStatus);

router.route('/:id')
    .get(getTripDetails);

export default router;
