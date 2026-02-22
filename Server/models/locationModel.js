import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  trip_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'trip',
    required: true,
    index: true
  },
  location : {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(val){
          return (
            val.length === 2 &&
            val[0] >= -180 && val[0] <= 180 &&
            val[1] >= -90 && val[1] <= 90
          );
        },
        message: 'Invalid longitude and latitude values'
      }
    }
  },
  speed: {
    type: Number,
    default: 0
  }
}, { timestamps: true })

locationSchema.index({ location: '2dsphere' });

const locationModel = mongoose.models.location || mongoose.model('location', locationSchema);

export default locationModel;