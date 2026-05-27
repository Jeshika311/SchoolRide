import mongoose from "mongoose";
import DriverProfile from "./DriverProfile.js";
import parentProfile from "./parentProfile.js";

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/\S+@\S+\.\S+/, 'Please use a valid email address.'],
    lowercase: true,
    trim: true,
    index: true
  },
  phone_number: { 
    type: String, 
    required: false,
    unique: true,
    sparse: true,
    match: [/^\d{10}$/, 'Please use a valid 10-digit phone number.'],
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['parent', 'driver', 'admin', 'student'],
    required: true,
    default: 'parent',
    index: true
  },

  // profile fields
  preferred_language: { 
    type: String, 
    enum: ['English', 'Hindi'],
    default: 'English' 
  },

  profile_photo: {
    type: String,
    default: ''
  },

  google_id: {
    type: String,
    default: null,
    index: true
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
  device_token: { 
    type: String, 
    default: null
  },
  termsAccepted: {
    type: Boolean,
    default: false
  },
  termsAcceptedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true })

userSchema.pre('findOneAndDelete', async function () {
  try{
    const user = await this.model.findOne(this.getFilter());

    if(!user) return;

    if(user.role === 'driver'){
      await DriverProfile.deleteOne({user_id: user._id});
    }

    if(user.role === 'parent'){
      await parentProfile.deleteOne({user_id: user._id});
    }
  }
  catch(error){
    throw error;
  }
})

const userModel = mongoose.models.user || mongoose.model('user', userSchema);

export default userModel;