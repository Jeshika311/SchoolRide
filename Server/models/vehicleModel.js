import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  vehicle_number: { 
    type: String,
    required: true,
    unique: true
  },
  total_seats: {
    type: Number,
    required: true
  },
  available_seats: {
    type: Number,
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  }
}, { timestamps: true })

const vehicleModel = mongoose.models.vehicle || mongoose.model('vehicle', vehicleSchema);

export default vehicleModel;