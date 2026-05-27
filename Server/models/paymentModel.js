import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'bookingNew',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentId: {
    type: String,
    default: null
  },
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending',
    index: true
  }
}, { timestamps: true });

const paymentModel = mongoose.models.payment || mongoose.model('payment', paymentSchema);

export default paymentModel;
