import express from 'express';
import { register, login, verifyEmail, logout, sendResetOtp, googleLogin, sendVerifyOtp, verifyResetOtp, resetPassword } from '../controllers/authController.js';

const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/send-verify-otp', sendVerifyOtp);
authRouter.post('/verify-email', verifyEmail);
authRouter.post('/login', login);
authRouter.post('/google-login', googleLogin); 
authRouter.post('/logout', logout);

authRouter.post('/forgot-password', sendResetOtp);
authRouter.post('/verify-reset-otp', verifyResetOtp);
authRouter.post('/reset-password', resetPassword);

export default authRouter;