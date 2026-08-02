import mongoose from 'mongoose';

const busSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    default: null,
    index: true
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'route',
    default: null,
    index: true
  },
  busNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active',
    index: true
  },
  totalSeats: {
    type: Number,
    required: true,
    min: 1
  },
  occupiedSeats: {
    type: [Number],
    default: []
  },
  routeName: {
    type: String,
    required: true,
    trim: true
  },
  pickupStops: {
    type: [String],
    default: []
  },
  dropStops: {
    type: [String],
    default: []
  },
  currentLocation: {
    lat: {
      type: Number,
      default: 0.0
    },
    lng: {
      type: Number,
      default: 0.0
    }
  }
}, { timestamps: true });

const busModel = mongoose.models.bus || mongoose.model('bus', busSchema);

export default busModel;
