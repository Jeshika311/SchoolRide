import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  driver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true
  },
  vehicle_number: { 
    type: String,
    required: true,
    unique: true,
    index: true
  },
  total_seats: {
    type: Number,
    required: true
  },
  available_seats: {
    type: Number,
    required: true,
    min: 0
  }
}, { timestamps: true })

vehicleSchema.pre('save', function (next) {
  if (this.available_seats > this.total_seats) {
    return next(new Error('Available seats cannot exceed total seats'));
  }
  next();
});

const vehicleModel = mongoose.models.vehicle || mongoose.model('vehicle', vehicleSchema);

export default vehicleModel;