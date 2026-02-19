import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import transporter from '../config/nodemailer.js';

export const signup = async (req, res) => {
  const {name, email, password, role} = req.body;

  if(!name || !email || !password || !role){
    return res.status(400).json({
      success: false,
      message: "All fields are required"
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new userModel({
      name,
      email,
      password: hashedPassword,
      role
    })
    await user.save();

    const token = jwt.sign({id: user._id, role: user.role}, process.env.JWT_SECRET, {expiresIn: '1d'});

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
    })

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: 'Welcome to SchoolRide',
      text: `Hi ${name},\n\nWelcome to SchoolRide! We're excited to have you on board. If you have any questions or need assistance, feel free to reach out to our support team.\n\nBest regards,\nThe SchoolRide Team`
    }

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token: token
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
    const {email} = req.body;

    if(!email){
      return res.status(400).json({
        success: false,
        message: "Email is required"
      })
    }

    const user = await userModel.findOne({email});

    if(!user){
      return res.status(400).json({
        success: false,
        message: "User not found"
      })
    }

    if(user.isAccountVerified){
      return res.status(400).json({
        success: false,
        message: "Account is already verified"
      })
    }

    const otp = String(Math.floor(Math.random() * 900000) + 100000);
    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 10 * 60 * 1000;

    await user.save();

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: 'Your OTP for Email Verification',
      text: `Hi ${user.name},\n\nYour OTP for email verification is: ${otp}. This OTP is valid for 10 minutes.\n\nBest regards,\nThe SchoolRide Team`
    }
    await transporter.sendMail(mailOptions);
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
  const {otp, email} = req.body;

  if(!email || !otp){
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required"
    })
  }

  try {
    const user = await userModel.findOne({email});

    if(!user){
      return res.status(400).json({
        success: false,
        message: "User not found"
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
  const {email, password} = req.body;

  if(!email || !password){
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    })
  }

  try{
    const user = await userModel.findOne({email});

    if(!user){
      return res.status(400).json({
        success: false,
        message: "User not found"
      })
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      })
    }

    const token = jwt.sign({id: user._id, role: user.role}, process.env.JWT_SECRET, {expiresIn: '7d'});
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
    })
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: token
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
    const {name, email} = req.body;

    let user = await userModel.findOne({email});

    if(!user){

      const randomPwd = Math.random().toString(36).slice(-8);
      const hashPassword = await bcrypt.hash(randomPwd, 10);

      user = new userModel({
        name,
        email,
        password: hashPassword,
        role: 'parent',
        isAccountVerified: true
      })
      await user.save();
    }

    let token = jwt.sign({id: user._id, role: user.role}, process.env.JWT_SECRET, {expiresIn: '7d'});

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
    })
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: token
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
  const {email} = req.body;

  if(!email){
    return res.status(400).json({
      success: false,
      message: "Email is required"
    })
  }

  try {
    const user = await userModel.findOne({email});

    if(!user){
      return res.status(400).json({
        success: false,
        message: "User not found"
      })
    }

    const otp = String(Math.floor(Math.random() * 900000) + 100000);
    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 10 * 60 * 1000;

    await user.save();

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: 'Password Reset OTP',
      text: `Hi ${user.name},\n\nYour OTP for password reset is: ${otp}. This OTP is valid for 10 minutes.\n\nBest regards,\nThe SchoolRide Team`
    }

    await transporter.sendMail(mailOptions);
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
  const {email, otp, newPassword} = req.body;

  if(!email || !otp || !newPassword){
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    })
  }

  try {
    const user = await userModel.findOne({email});

    if(!user){
      return res.status(400).json({
        success: false,
        message: "User not found"
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