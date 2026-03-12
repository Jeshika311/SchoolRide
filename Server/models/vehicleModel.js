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
    min: 0,
    validate: {
      validator: function(val) {
        // `this` may be the document (on create) or the query/update object (on find*AndUpdate)
        // try to read total_seats from either context
        const total = this.total_seats !== undefined
          ? this.total_seats
          : (this.get && this.get('total_seats')); // when context: 'query'
        return total === undefined || val <= total;
      },
      message: 'Available seats cannot exceed total seats'
    }
  }
}, { timestamps: true })

// schema validator handles the limit; no middleware needed

const vehicleModel = mongoose.models.vehicle || mongoose.model('vehicle', vehicleSchema);

export default vehicleModel;