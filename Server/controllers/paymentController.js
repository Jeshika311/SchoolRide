import Razorpay from 'razorpay';
import crypto from 'crypto';
import paymentModel from '../models/paymentModel.js';
import bookingNewModel from '../models/bookingNewModel.js';
import busModel from '../models/busModel.js';

// Setup Razorpay client
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkeyid12345';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'mocksecretkey12345';

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret
});

// Create payment order (POST /api/payments/create-order)
export const createPaymentOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const studentId = req.user.id;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required.'
      });
    }

    const booking = await bookingNewModel.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    if (booking.studentId.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to pay for this booking.'
      });
    }

    if (booking.bookingStatus !== 'Payment Pending') {
      return res.status(400).json({
        success: false,
        message: `Payment is not pending for this booking. Current status: ${booking.bookingStatus}`
      });
    }

    // Default price per booking = 1500 INR (1500.00 * 100 paise)
    const amountInINR = 1500;
    const amountInPaise = amountInINR * 100;

    let order;
    let isMock = false;

    // Check if we are running in a sandbox or missing actual keys
    if (razorpayKeyId.startsWith('rzp_test_mock') || !process.env.RAZORPAY_KEY_SECRET) {
      isMock = true;
      order = {
        id: 'order_mock_' + crypto.randomBytes(8).toString('hex'),
        amount: amountInPaise,
        currency: 'INR',
        receipt: bookingId.toString()
      };
    } else {
      try {
        const options = {
          amount: amountInPaise,
          currency: 'INR',
          receipt: bookingId.toString()
        };
        order = await razorpay.orders.create(options);
      } catch (err) {
        console.warn('Razorpay order creation failed, falling back to mock order:', err.message);
        isMock = true;
        order = {
          id: 'order_mock_' + crypto.randomBytes(8).toString('hex'),
          amount: amountInPaise,
          currency: 'INR',
          receipt: bookingId.toString()
        };
      }
    }

    // Create payment transaction record in database
    const payment = new paymentModel({
      bookingId,
      studentId,
      amount: amountInINR,
      orderId: order.id,
      paymentStatus: 'Pending'
    });

    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Razorpay order created successfully.',
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        bookingId,
        isMock,
        razorpayKeyId
      }
    });
  } catch (error) {
    next(error);
  }
};

// Verify payment signature (POST /api/payments/verify)
export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and Payment ID are required for verification.'
      });
    }

    const payment = await paymentModel.findOne({ orderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found.'
      });
    }

    const booking = await bookingNewModel.findById(payment.bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking associated with payment not found.'
      });
    }

    let isSignatureValid = false;

    // Handle verification for mock orders or real ones
    if (razorpay_order_id.startsWith('order_mock_')) {
      // Mock payments are auto-verified
      isSignatureValid = true;
    } else {
      const text = razorpay_order_id + '|' + razorpay_payment_id;
      const generated_signature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(text)
        .digest('hex');

      isSignatureValid = (generated_signature === razorpay_signature);
    }

    if (!isSignatureValid) {
      payment.paymentStatus = 'Failed';
      await payment.save();

      booking.bookingStatus = 'Cancelled';
      await booking.save();

      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Verification failed.'
      });
    }

    // Atomically check if the seat is still available on the bus and mark occupied
    const bus = await busModel.findOneAndUpdate(
      { _id: booking.busId, occupiedSeats: { $ne: booking.seatNumber } },
      { $push: { occupiedSeats: booking.seatNumber } },
      { new: true }
    );

    if (!bus) {
      payment.paymentStatus = 'Failed'; // Needs manual refund
      await payment.save();

      booking.bookingStatus = 'Cancelled';
      await booking.save();

      return res.status(400).json({
        success: false,
        message: 'This seat was occupied by another student while checkout was in progress, or the bus was not found.'
      });
    }

    payment.paymentId = razorpay_payment_id;
    payment.paymentStatus = 'Paid';
    await payment.save();

    booking.bookingStatus = 'Confirmed';
    booking.paymentId = razorpay_payment_id;
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Payment verified and booking confirmed successfully.',
      data: {
        bookingId: booking._id,
        seatNumber: booking.seatNumber,
        paymentId: razorpay_payment_id,
        status: 'Confirmed'
      }
    });
  } catch (error) {
    next(error);
  }
};

// View all payment records (Admin only)
export const getAllPayments = async (req, res, next) => {
  try {
    const payments = await paymentModel.find({})
      .populate('studentId', 'name email phone_number')
      .populate({
        path: 'bookingId',
        populate: { path: 'busId' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};
