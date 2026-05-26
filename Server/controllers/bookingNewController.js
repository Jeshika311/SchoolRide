import bookingNewModel from '../models/bookingNewModel.js';
import busModel from '../models/busModel.js';

// Create a booking (initial state: Payment Pending)
export const createBooking = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { busId, pickupStop, dropStop, seatNumber } = req.body;

    if (!busId || !pickupStop || !dropStop || !seatNumber) {
      return res.status(400).json({
        success: false,
        message: 'Bus ID, Pickup Stop, Drop Stop, and Seat Number are required.'
      });
    }

    // 1. Fetch bus details
    const bus = await busModel.findById(busId);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found.'
      });
    }

    // 2. Validate seat number boundaries
    if (seatNumber < 1 || seatNumber > bus.totalSeats) {
      return res.status(400).json({
        success: false,
        message: `Invalid seat number. Must be between 1 and ${bus.totalSeats}.`
      });
    }

    // 3. Check if seat is already occupied in the bus model
    if (bus.occupiedSeats.includes(seatNumber)) {
      return res.status(400).json({
        success: false,
        message: 'This seat is already booked and occupied.'
      });
    }

    // 4. Check if seat is reserved/pending payment by another student
    const pendingOrConfirmedSeat = await bookingNewModel.findOne({
      busId,
      seatNumber,
      bookingStatus: { $in: ['Confirmed', 'Payment Pending'] }
    });

    if (pendingOrConfirmedSeat) {
      return res.status(400).json({
        success: false,
        message: 'This seat is currently reserved or pending payment by another student.'
      });
    }

    // 5. Check if the same student has already booked/reserved an active seat on this bus
    const duplicateBooking = await bookingNewModel.findOne({
      studentId,
      busId,
      bookingStatus: { $in: ['Confirmed', 'Payment Pending'] }
    });

    if (duplicateBooking) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active booking (confirmed or pending payment) on this bus.'
      });
    }

    // Create Booking
    const booking = new bookingNewModel({
      studentId,
      busId,
      pickupStop,
      dropStop,
      seatNumber,
      bookingStatus: 'Payment Pending'
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Booking request created. Proceed to payment.',
      data: booking
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A duplicate booking for this student and bus already exists.'
      });
    }
    next(error);
  }
};

// Cancel a booking
export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const booking = await bookingNewModel.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    // Authorization check: student who owns it OR admin
    if (booking.studentId.toString() !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this booking.'
      });
    }

    if (booking.bookingStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled.'
      });
    }

    // If confirmed, release the seat
    if (booking.bookingStatus === 'Confirmed') {
      const bus = await busModel.findById(booking.busId);
      if (bus) {
        bus.occupiedSeats = bus.occupiedSeats.filter(seat => seat !== booking.seatNumber);
        await bus.save();
      }
    }

    booking.bookingStatus = 'Cancelled';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully.',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// View student's own bookings
export const getMyBookings = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const bookings = await bookingNewModel.find({ studentId })
      .populate('busId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// View all bookings (Admin only)
export const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await bookingNewModel.find({})
      .populate('studentId', 'name email phone_number')
      .populate('busId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// Get booking by ID
export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await bookingNewModel.findById(id)
      .populate('studentId', 'name email phone_number')
      .populate('busId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    // Authorization check
    if (booking.studentId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this booking.'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
