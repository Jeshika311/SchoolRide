import mongoose from "mongoose";

const tripSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  route: {
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
    default: 'scheduled'
  },
  date: {
    type: Date,
    required: true
  }
}, { timestamps: true })

const tripModel = mongoose.models.trip || mongoose.model('trip', tripSchema);

export default tripModel;