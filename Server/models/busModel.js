import mongoose from 'mongoose';

const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
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
