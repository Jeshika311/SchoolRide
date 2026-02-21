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
    required: true,
    unique: true,
    match: [/^\d{10}$/, 'Please use a valid 10-digit phone number.'],
    index: true
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['parent', 'driver', 'admin'],
    required: true,
    index: true
  },

  // profile fields
  preferred_language: { 
    type: String, 
    enum: ['English', 'Hindi'],
    default: 'English' 
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

userSchema.pre('findOneAndDelete', async function (next) {
  try{
    const user = await this.model.findOne(this.getFilter());

    if(!user) return next();

    if(user.role === 'driver'){
      await DriverProfile.deleteOne({user_id: user._id});
    }

    if(user.role === 'parent'){
      await parentProfile.deleteOne({user_id: user._id});
    }
    next();
  }
  catch(error){
    next(error);
  }
})

const userModel = mongoose.models.user || mongoose.model('user', userSchema);

export default userModel;