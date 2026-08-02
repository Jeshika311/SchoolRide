import mongoose from "mongoose";

const routeSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  assignedBus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'bus',
    default: null,
    index: true
  },
  route_name: {
    type: String,
    default: '',
    trim: true,
    index: true
  },
  start_location: {
    type: String,
    required: true
  },
  end_location: {
    type: String,
    required: true
  },
  stops: {
    type: [String],
    default: []
  },
  coordinates: {
    type: [{
      latitude: Number,
      longitude: Number,
      label: String
    }],
    default: []
  },
  start_coords: {
    lat: { type: Number },
    lon: { type: Number }
  },
  end_coords: {
    lat: { type: Number },
    lon: { type: Number }
  },
  estimated_time_minutes: {
    type: Number,
    default: 0
  },
  distance_km: {
    type: Number,
    default: 0
  },
  duration_minutes: {
    type: Number,
    default: 0
  }
}, { timestamps: true })

routeSchema.index({ driver: 1 });
routeSchema.index({ start_location: 1, end_location: 1 });

const routeModel = mongoose.models.route || mongoose.model('route', routeSchema);

export default routeModel;