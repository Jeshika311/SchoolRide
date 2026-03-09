import bookingModel from '../models/bookingModel.js';

export const createBooking = async (req, res, next) => {
    try {
        const parent_id = req.user.id;
        const { driver_id, route_id, trip_id, vehicle, child_name, pickup_point, drop_point } = req.body;

        if (!driver_id || !route_id || !trip_id || !vehicle || !child_name || !pickup_point || !drop_point) {
            return res.status(400).json({ success: false, message: 'All required fields must be provided' });
        }

        const newBooking = new bookingModel({
            parent_id,
            driver_id,
            route_id,
            trip_id,
            vehicle,
            child_name,
            pickup_point,
            drop_point,
            status: 'pending',
            trip_status: 'pending'
        });

        await newBooking.save();

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: newBooking
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'A booking for this parent and trip already exists' });
        }
        next(error);
    }
};

export const getParentBookings = async (req, res, next) => {
    try {
        const parent_id = req.user.id;
        const bookings = await bookingModel.find({ parent_id })
            .populate('driver_id', 'name email phone')
            .populate('route_id')
            .populate('trip_id')
            .populate('vehicle')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: bookings
        });
    } catch (error) {
        next(error);
    }
};
  
export const getDriverBookings = async (req, res, next) => {
    try {
        const driver_id = req.user.id;
        const bookings = await bookingModel.find({ driver_id })
            .populate('parent_id', 'name email phone')
            .populate('route_id')
            .populate('trip_id')
            .populate('vehicle')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: bookings
        });
    } catch (error) {
        next(error);
    }
};

export const getBookingById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const booking = await bookingModel.findById(id)
            .populate('parent_id', 'name email phone')
            .populate('driver_id', 'name email phone')
            .populate('route_id')
            .populate('trip_id')
            .populate('vehicle');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (booking.parent_id._id.toString() !== req.user.id && booking.driver_id._id.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
        }

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        next(error);
    }
};

export const updateBookingStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'accepted', 'rejected', 'completed'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const booking = await bookingModel.findById(id);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (booking.driver_id.toString() !== req.user.id && booking.parent_id.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        booking.status = status;
        await booking.save();

        res.status(200).json({
            success: true,
            message: 'Booking status updated successfully',
            data: booking
        });
    } catch (error) {
        next(error);
    }
};

export const updateTripStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { trip_status } = req.body;

        if (!['pending', 'picked', 'dropped'].includes(trip_status)) {
            return res.status(400).json({ success: false, message: 'Invalid trip status' });
        }

        const booking = await bookingModel.findById(id);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (booking.driver_id.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized format. Only driver can modify trip status' });
        }

        booking.trip_status = trip_status;
        await booking.save();

        res.status(200).json({
            success: true,
            message: 'Trip status updated successfully',
            data: booking
        });
    } catch (error) {
        next(error);
    }
};

export const deleteBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const booking = await bookingModel.findById(id);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Only parent who created the booking or an admin can delete
        if (booking.parent_id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this booking' });
        }

        if (booking.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Can only delete pending bookings' });
        }

        await bookingModel.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Booking deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

export const getAllBookings = async (req, res, next) => {
    try {
        // Typically for an admin to view all platform bookings
        const bookings = await bookingModel.find({})
            .populate('parent_id', 'name email phone')
            .populate('driver_id', 'name email phone')
            .populate('route_id')
            .populate('trip_id')
            .populate('vehicle')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: bookings
        });
    } catch (error) {
        next(error);
    }
};
