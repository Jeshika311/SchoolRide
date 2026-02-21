import mongoose from 'mongoose';

const parentProfileSchema = new mongoose.Schema({

  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    unique: true,
    index: true
  },
  pickup_address: {
    type: String,
    default: ''
  },
  drop_address: {
    type: String,
    default: ''
  }
}, { timestamps: true }) 

export default mongoose.models.parentProfile || mongoose.model('parentProfile', parentProfileSchema);