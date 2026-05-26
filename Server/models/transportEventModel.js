import mongoose from 'mongoose';

const transportEventSchema = new mongoose.Schema({
  trip_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'trip',
    required: true,
    index: true
  },
  cab_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'vehicle',
    required: true,
    index: true
  },
  event_type: {
    type: String,
    enum: [
      'cab_started',
      'cab_delayed',
      'cab_arrived_pickup',
      'cab_arrived_school',
      'cab_completed',
      'child_boarded',
      'child_dropped',
      'emergency_sos',
      'unauthorized_drop',
      'route_deviation'
    ],
    required: true,
    index: true
  },
  child_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'parentProfile',
    default: null,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function (value) {
          return (
            value.length === 2 &&
            value[0] >= -180 && value[0] <= 180 &&
            value[1] >= -90 && value[1] <= 90
          );
        },
        message: 'Invalid longitude and latitude coordinates'
      }
    }
  },
  speed: {
    type: Number,
    default: 0
  },
  eta_minutes: {
    type: Number,
    default: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  soft_deleted: {
    type: Boolean,
    default: false,
    index: true
  }
}, { timestamps: true });

transportEventSchema.index({ location: '2dsphere' });

const transportEventModel = mongoose.models.transportEvent || mongoose.model('transportEvent', transportEventSchema);

export default transportEventModel;
