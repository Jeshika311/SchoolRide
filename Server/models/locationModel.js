import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'trip',
    required: true
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  speed: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    required: true
  }
}, { timestamps: true })

const locationModel = mongoose.models.location || mongoose.model('location', locationSchema);

export default locationModel;