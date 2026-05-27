import express from 'express';
import {
  createBooking,
  cancelBooking,
  getMyBookings,
  getAllBookings,
  getBookingById
} from '../controllers/bookingNewController.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import RoleMiddleware from '../middlewares/RoleMiddleware.js';

const bookingNewRouter = express.Router();

// Get student's own bookings (Student only)
bookingNewRouter.get('/my-bookings', AuthMiddleware, RoleMiddleware('student'), getMyBookings);

// Get specific booking details (Student or Admin)
bookingNewRouter.get('/:id', AuthMiddleware, getBookingById);

// Create a booking (Student only)
bookingNewRouter.post('/', AuthMiddleware, RoleMiddleware('student'), createBooking);

// Cancel a booking (Student or Admin)
bookingNewRouter.delete('/:id', AuthMiddleware, cancelBooking);

// Get all bookings (Admin only)
bookingNewRouter.get('/', AuthMiddleware, RoleMiddleware('admin'), getAllBookings);

export default bookingNewRouter;
