import generateOtp from './generateOtp.js';

export const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

export const issueOtp = async (user, mode = 'verify') => {
  const otp = generateOtp();
  const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

  if (mode === 'verify') {
    user.verifyOtp = otp;
    user.verifyOtpExpireAt = expiry;
  } 
  else if (mode === 'reset') {
    user.resetOtp = otp;
    user.resetOtpExpireAt = expiry;
  } 
  else {
    throw new Error(`Unsupported OTP mode: ${mode}`);
  }

  await user.save();
  return otp;
};
