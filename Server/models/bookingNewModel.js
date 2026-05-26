import mongoose from 'mongoose';

const bookingNewSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true
  },
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'bus',
    required: true,
    index: true
  },
  pickupStop: {
    type: String,
    required: true
  },
  dropStop: {
    type: String,
    required: true
  },
  seatNumber: {
    type: Number,
    required: true
  },
  paymentId: {
    type: String,
    default: null
  },
  bookingStatus: {
    type: String,
    enum: ['Pending', 'Payment Pending', 'Confirmed', 'Cancelled'],
    default: 'Pending',
    index: true
  }
}, { timestamps: true });

// Avoid duplicate booking check logic index: one active booking per student per bus
bookingNewSchema.index(
  { studentId: 1, busId: 1 },
  { unique: true, partialFilterExpression: { bookingStatus: { $in: ['Pending', 'Payment Pending', 'Confirmed'] } } }
);

const bookingNewModel = mongoose.models.bookingNew || mongoose.model('bookingNew', bookingNewSchema);

export default bookingNewModel;
