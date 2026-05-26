import express from 'express';
import {
  createBus,
  updateBus,
  deleteBus,
  getBuses,
  getBusById,
  getBusSeats,
  getBusCoRiders
} from '../controllers/busController.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import RoleMiddleware from '../middlewares/RoleMiddleware.js';

const busRouter = express.Router();

// Public/Authenticated routes (Students & Admins)
busRouter.get('/', AuthMiddleware, getBuses);
busRouter.get('/:id', AuthMiddleware, getBusById);
busRouter.get('/:id/seats', AuthMiddleware, getBusSeats);
busRouter.get('/:id/co-riders', AuthMiddleware, getBusCoRiders);

// Admin-only routes
busRouter.post('/', AuthMiddleware, RoleMiddleware('admin'), createBus);
busRouter.put('/:id', AuthMiddleware, RoleMiddleware('admin'), updateBus);
busRouter.delete('/:id', AuthMiddleware, RoleMiddleware('admin'), deleteBus);

export default busRouter;
