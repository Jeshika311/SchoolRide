import mongoose from 'mongoose';

const driverProfileSchema = new mongoose.Schema({

  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    unique: true,
    index: true
  },
  vehicle_number: {
    type: String,
    default: '',
    index: true
  },
  vehicle_type: {
    type: String,
    enum: ['Car', 'Van', 'Bus'],
    default: 'Van'
  },
  license_number: {
    type: String,
    default: ''
  },
  vehicle_seats:{
    type: Number,
    default: 0
  },
  profile_photo: {
    type: String,
    default: ''
  },
}, { timestamps: true })

export default mongoose.models.driverProfile || mongoose.model('driverProfile', driverProfileSchema);