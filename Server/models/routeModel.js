import mongoose from "mongoose";

const routeSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
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
  }
}, { timestamps: true })

const routeModel = mongoose.models.route || mongoose.model('route', routeSchema);

export default routeModel;