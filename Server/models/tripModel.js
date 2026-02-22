import mongoose from "mongoose";

const tripSchema = new mongoose.Schema({
  driver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true
  },
  route_id: {
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
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  date: {
    type: Date,
    required: true
  }
}, { timestamps: true })

tripSchema.index({ driver_id: 1, date: 1 });
tripSchema.index({ driver_id: 1, status: 1 });
tripSchema.index({ route_id: 1, date: 1 });

const tripModel = mongoose.models.trip || mongoose.model('trip', tripSchema);

export default tripModel;