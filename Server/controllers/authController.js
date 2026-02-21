import bcrypt from 'bcryptjs';
import userModel from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import { sendResetPasswordEmail, sendVerificationEmail, sendWelcomeEmail } from '../utils/sendEmail.js';
import { setAuthCookie, issueOtp } from '../utils/authHelpers.js';
import DriverProfile from '../models/DriverProfile.js';
import parentProfile from '../models/parentProfile.js';

export const register = async (req, res) => {
  let {name, email, password, role, phone_number, preferred_language} = req.body;

  if(!name || !email || !password || !role || !phone_number || !preferred_language){
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    })
  }

  email = email.toLowerCase().trim();

  if(!['parent','driver'].includes(role)){
    return res.status(400).json({
      success: false,
      message: "Role must be either 'parent' or 'driver'"
    });
  }
  if(password.length < 6){
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      })
    }

  try { 

    const existingUser = await userModel.findOne({email});

    if(existingUser){
      return res.status(400).json({
        success: false,
        message: "User already exists"
      })
    }

    const existingPhone = await userModel.findOne({phone_number});

    if(existingPhone){
      return res.status(400).json({
        success: false,
        message: "Phone number already in use"
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new userModel({
      name,
      email,
      password: hashedPassword,
      role,
      phone_number,
      preferred_language
    })
    await user.save();

    if(role === 'driver'){
      console.log("Creating driver profile for user:", user._id);
      await DriverProfile.create({user_id: user._id});
      console.log("Driver profile created for user:", user._id);
    }

    if(role === 'parent'){
      await parentProfile.create({user_id: user._id});
    }

    const token = generateToken(user);
    setAuthCookie(res, token);

    sendWelcomeEmail(user.email, user.name).catch(console.error);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone_number: user.phone_number,
        preferred_language: user.preferred_language
      }
    })
  }
  catch(error){
    console.log("Signup error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const sendVerifyOtp = async (req,res) => {
  try {
    let {email} = req.body;

    if(!email){
      return res.status(400).json({
        success: false,
        message: "Email is required"
      })
    }

    email = email.toLowerCase().trim();

    const user = await userModel.findOne({email});

    if(!user){
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      })
    }

    if(user.isAccountVerified){
      return res.status(400).json({
        success: false,
        message: "Account is already verified"
      })
    }

    // create and save OTP on user
    const otp = await issueOtp(user, 'verify');
    await sendVerificationEmail(email, otp);

    return res.json({
      success: true,
      message: "OTP sent successfully"
    })
  }
  catch(error){
    console.log("Send OTP error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const verifyEmail = async (req,res) => {
  let {otp, email} = req.body;

  if(!email || !otp){
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required"
    })
  }

  email = email.toLowerCase().trim();

  try {
    const user = await userModel.findOne({email});

    if(!user){
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials"
      })
    }

    if(user.verifyOtp === '' || user.verifyOtp !== otp){
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      })
    }

    if(user.verifyOtpExpireAt < Date.now()){
      return res.status(400).json({
        success: false,
        message: "OTP has expired"
      })
    }

    user.isAccountVerified = true;
    user.verifyOtp = '';
    user.verifyOtpExpireAt = 0;
    await user.save();

    return res.json({
      success: true,
      message: "Email verified successfully"
    })
  }
  catch(error){
    console.log("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const login = async (req,res) => {
  let {email, password} = req.body;

  if(!email || !password){
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    })
  }

  email = email.toLowerCase().trim();

  try{
    const user = await userModel.findOne({email});

    if(!user){
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      })
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      })
    }

    const token = generateToken(user);
    setAuthCookie(res, token);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone_number: user.phone_number,
        preferred_language: user.preferred_language
      }
     })
  }
  catch(error){
    console.log("Login error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const googleLogin = async (req,res) => {
  try {
    let {name, email} = req.body;

    if(!email){
      return res.status(400).json({
        success: false,
        message: "Email is required for Google login"
      });
    }

    email = email.toLowerCase().trim();

    let user = await userModel.findOne({email});

    if(!user){
      return res.status(400).json({
        success: false,
        message: "No account found for this email. Please sign up first."
      });
    }

    if(name && user.name !== name){
      user.name = name;
      await user.save();
    }

    const token = generateToken(user);
    setAuthCookie(res, token);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone_number: user.phone_number,
        preferred_language: user.preferred_language
      }
    })
  }
  catch(error){
    console.log("Google Login error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const logout = async (req,res) => {
  try{
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    })
    return res.status(200).json({
      success: true,
      message: "Logout successful"
    })
  }
  catch(error){
    console.log("Logout error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const sendResetOtp = async (req, res) => {
  let {email} = req.body;

  if(!email){
    return res.status(400).json({
      success: false,
      message: "Email is required"
    })
  }

  email = email.toLowerCase().trim();

  try {
    const user = await userModel.findOne({email});

    if(!user){
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      })
    }

    // create and save OTP on user
    const otp = await issueOtp(user, 'reset');
    await sendResetPasswordEmail(email, otp);

    return res.json({
      success: true,
      message: "Reset OTP sent successfully"
    })
  }

  catch(error){
    console.log("Send Reset OTP error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const resetPassword = async (req, res) => {
  let {email, otp, newPassword} = req.body;

  if(!email || !otp || !newPassword){
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    })
  }

  email = email.toLowerCase().trim();
 
  try {
    const user = await userModel.findOne({email});

    if(!user){
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      })
    }
    if(user.resetOtp === '' || user.resetOtp !== otp){
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      })
    }
    if(user.resetOtpExpireAt < Date.now()){
      return res.status(400).json({
        success: false,
        message: "OTP has expired"
      })
    }

    if(newPassword.length < 6){
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetOtp = '';
    user.resetOtpExpireAt = 0;
    await user.save();

    return res.json({
      success: true,
      message: "Password reset successful"
    })
  }

  catch(error){
    console.log("Reset Password error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}