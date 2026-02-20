import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'route',
    required: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'vehicle',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending'
  },
  child_name: {
    type: String,
    required: true
  },
  pickup_point: {
    type: String,
    required: true
  },
  drop_point: {
    type: String,
    required: true
  }
}, { timestamps: true })

const bookingModel = mongoose.models.booking || mongoose.model('booking', bookingSchema);

export default bookingModel;