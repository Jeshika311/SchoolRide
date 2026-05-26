import express from 'express';
import {
  updateBusLocation,
  getBusLocation
} from '../controllers/trackingController.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';

const trackingRouter = express.Router();

// Retrieve live coordinates (Students & Admins)
trackingRouter.get('/:busId', AuthMiddleware, getBusLocation);

// Update coordinates (Driver or Admin, let's keep authenticated)
trackingRouter.post('/update-location', AuthMiddleware, updateBusLocation);

export default trackingRouter;
