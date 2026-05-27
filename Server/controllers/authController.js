import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import { sendResetPasswordEmail, sendVerificationEmail, sendWelcomeEmail } from '../utils/sendEmail.js';
import { setAuthCookie, issueOtp } from '../utils/authHelpers.js';
import DriverProfile from '../models/DriverProfile.js';
import parentProfile from '../models/parentProfile.js';

export const register = async (req, res) => {
  let {name, email, password, role, phone_number, preferred_language, device_token, fcmToken} = req.body;

  if(!name || !email || !password || !role || !phone_number || !preferred_language){
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    })
  }

  email = email.toLowerCase().trim();

  if(!['parent','driver','student','admin'].includes(role)){
    return res.status(400).json({
      success: false,
      message: "Role must be 'parent', 'driver', 'student', or 'admin'"
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
    const incomingToken = device_token || fcmToken;

    const user = new userModel({
      name,
      email,
      password: hashedPassword,
      role,
      phone_number,
      preferred_language,
      device_token: incomingToken || null,
      termsAccepted: false,
      termsAcceptedAt: null
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

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone_number: user.phone_number,
        preferred_language: user.preferred_language,
        device_token: user.device_token,
        termsAccepted: user.termsAccepted
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
        message: "No account found with this email"
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
  // allow login with either email or phone number
  let { email, phone_number, password, device_token, fcmToken } = req.body;

  if((!email && !phone_number) || !password){
    return res.status(400).json({
      success: false,
      message: "Email or phone number and password are required"
    })
  }

  // normalize identifier
  let query;
  if(email){
    email = email.toLowerCase().trim();
    query = { email };
  } else {
    // phone number will be used as-is
    query = { phone_number };
  }

  try{
    const user = await userModel.findOne(query);

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

    // add incoming FCM/device token
    const incomingToken = device_token || fcmToken;

    if(incomingToken){
      user.device_token = incomingToken;
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
        preferred_language: user.preferred_language,
        device_token: user.device_token,
        termsAccepted: user.termsAccepted
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

export const googleLogin = async (req, res) => {
  try {
    let { name, email, google_id, device_token, fcmToken } = req.body;

    if (!email || !google_id) {
      return res.status(400).json({
        success: false,
        message: "Email and Google ID are required for Google login"
      });
    }

    email = email.toLowerCase().trim();

    let user = await userModel.findOne({ email });

    const incomingToken = device_token || fcmToken;

    // 🟢 CREATE ACCOUNT IF USER DOES NOT EXIST
    if (!user) {

      // generate random password
      const randomPassword = Math.random().toString(36).slice(-10);

      // hash password
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = new userModel({
        name: name || "Google User",
        email,
        password: hashedPassword,
        google_id,
        role: "parent",
        preferred_language: "English",
        isAccountVerified: true,
        device_token: incomingToken || null,
        termsAccepted: false,
        termsAcceptedAt: null
      });

      await user.save();

      await parentProfile.create({
        user_id: user._id
      });
    }

    // 🟢 UPDATE EXISTING USER IF NECESSARY
    let updated = false;

    if (!user.google_id || user.google_id !== google_id) {
      user.google_id = google_id;
      updated = true;
    }

    if (name && user.name !== name) {
      user.name = name;
      updated = true;
    }

    if (incomingToken && user.device_token !== incomingToken) {
      user.device_token = incomingToken;
      updated = true;
    }

    if (!user.isAccountVerified) {
      user.isAccountVerified = true;
      updated = true;
    }

    if (updated) {
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
        preferred_language: user.preferred_language,
        fcmTokens: user.fcmTokens,
        google_id: user.google_id,
        termsAccepted: user.termsAccepted
      }
    });

  } catch (error) {
    console.log("Google Login error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const acceptTerms = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.termsAccepted = true;
    user.termsAcceptedAt = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Terms accepted successfully',
      user: {
        id: user._id,
        termsAccepted: user.termsAccepted,
        termsAcceptedAt: user.termsAcceptedAt
      }
    });
  } catch (error) {
    console.log('Accept terms error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const logout = async (req,res) => {
  try{
    const { device_token } = req.body;
    // support token in cookie or Authorization header
    let token = req.cookies?.token;
    if(!token){
      const authHeader = req.headers.authorization;
      if(authHeader && authHeader.startsWith('Bearer ')){
        token = authHeader.split(' ')[1];
      }
    }

    if(!token){
      return res.status(401).json({
        success:false,
        message:"Unauthorized: Token missing"
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);

    if(!user){
      return res.status(404).json({
        success:false,
        message:"User not found"
      })
    }

    if(device_token && user.device_token === device_token){
      user.device_token = null;
      await user.save();
    }

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

export const verifyResetOtp = async (req, res) => {
  let { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required"
    });
  }

  email = email.toLowerCase().trim();

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    if (user.resetOtp === '' || user.resetOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    if (user.resetOtpExpireAt < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired"
      });
    }

    return res.json({
      success: true,
      message: "OTP verified successfully"
    });

  } catch (error) {
    console.log("Verify Reset OTP error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const resetPassword = async (req, res) => {
  let { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Email and new password are required"
    });
  }

  email = email.toLowerCase().trim();

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetOtp = '';
    user.resetOtpExpireAt = 0;

    await user.save();

    return res.json({
      success: true,
      message: "Password reset successful"
    });

  } catch (error) {
    console.log("Reset Password error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};