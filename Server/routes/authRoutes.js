import express from 'express';
import { signup, login, verifyEmail, logout, sendResetOtp, resetPassword, googleLogin, sendVerifyOtp } from '../controllers/authController.js';
import userAuth from '../middlewares/AuthMiddleware.js';

const authRouter = express.Router();

authRouter.post('/signup', signup);
authRouter.post('/send-verify-otp', sendVerifyOtp);
authRouter.post('/verify-email', verifyEmail);
authRouter.post('/login', login);
authRouter.post('/google-login', googleLogin); 
authRouter.post('/logout', logout);

authRouter.post('/forgot-password', sendResetOtp);
authRouter.post('/reset-password', resetPassword);

export default authRouter;