import express from 'express';
import {
    createBooking,
    getParentBookings,
    getDriverBookings,
    getBookingById,
    updateBookingStatus,
    updateTripStatus,
    deleteBooking,
    getAllBookings
} from '../controllers/bookingController.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import RoleMiddleware from '../middlewares/RoleMiddleware.js';

const bookingRouter = express.Router();

// Route for a parent to create a booking
bookingRouter.post('/create', AuthMiddleware, RoleMiddleware('parent'), createBooking);

// Route for parent to get all their bookings
bookingRouter.get('/parent', AuthMiddleware, RoleMiddleware('parent'), getParentBookings);

// Route for driver to get all their bookings
bookingRouter.get('/driver', AuthMiddleware, RoleMiddleware('driver'), getDriverBookings);
bookingRouter.get('/driver/assigned', AuthMiddleware, RoleMiddleware('driver'), getDriverBookings);

// Route to get a specific booking by ID
bookingRouter.get('/:id', AuthMiddleware, getBookingById);

// Route for driver (or parent if canceling) to update booking status
bookingRouter.put('/:id/status', AuthMiddleware, updateBookingStatus);

// Route for driver to update the ongoing trip status
bookingRouter.put('/:id/trip-status', AuthMiddleware, RoleMiddleware('driver'), updateTripStatus);

// Route for admin to get all bookings
bookingRouter.get('/', AuthMiddleware, RoleMiddleware('admin'), getAllBookings);

// Route for parent to delete a pending booking
bookingRouter.delete('/:id', AuthMiddleware, RoleMiddleware('parent', 'admin'), deleteBooking);

export default bookingRouter;
