import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true
  },
  driver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true
  },
  route_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'route',
    required: true,
    index: true
  },
  trip_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'trip',
    required: true,
    index: true
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
  trip_status:{
    type: String,
    enum: ['pending', 'picked', 'dropped'],
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

bookingSchema.index(
  { parent_id: 1, trip_id: 1 },
  { unique: true, partialFilterExpression : {status: {$ne: 'rejected'}} }
);

const bookingModel = mongoose.models.booking || mongoose.model('booking', bookingSchema);

export default bookingModel;