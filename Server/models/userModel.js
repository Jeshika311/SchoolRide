import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  phone_number: { 
    type: String, 
    default: '' 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['parent', 'driver', 'admin'], 
    default: 'parent', 
    required: true 
  },

  // profile fields
  preferred_language: { 
    type: String, 
    default: 'English' 
  },
  profile_photo: { 
    type: String, 
    default: '' 
  },

  // Parent-specific
  pickup_address: { 
    type: String, 
    default: '' 
  },
  drop_address: { 
    type: String, 
    default: '' 
  },

  // Driver-specific
  vehicle_number: { 
    type: String, 
    default: '' 
  },
  vehicle_type: { 
    type: String, 
    enum: ['van', 'bus', 'other'], 
    default: 'van' 
  },
  license_number: { 
    type: String, 
    default: '' 
  },
  vehicle_seats: { 
    type: Number, 
    default: 0 
  },

  // Verification & password reset
  verifyOtp: { 
    type: String, 
    default: '' 
  },
  isAccountVerified: { 
    type: Boolean, 
    default: false 
  },
  verifyOtpExpireAt: { 
    type: Number, 
    default: 0 
  },
  resetOtp: { 
    type: String, 
    default: '' 
  },
  resetOtpExpireAt: { 
    type: Number, 
    default: 0 
  },

  // FCM tokens for notifications
  fcmTokens: { 
    type: [String], 
    default: [] 
  }
}, { timestamps: true })

const userModel = mongoose.models.user || mongoose.model('user', userSchema);

export default userModel;