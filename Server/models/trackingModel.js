import mongoose from 'mongoose';

const trackingSchema = new mongoose.Schema({
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'bus',
    required: true,
    unique: true,
    index: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  speed: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const trackingModel = mongoose.models.tracking || mongoose.model('tracking', trackingSchema);

export default trackingModel;
