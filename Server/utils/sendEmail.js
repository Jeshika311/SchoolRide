import transporter from '../config/nodemailer.js';

const sendEmail = async ({to, subject, text}) => {
  try {
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to,
      subject,
      text
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error.message);
    throw error;
  }
}

export const sendVerificationEmail = async (email, otp) => {
  const subject = "Your SchoolRide Verification OTP";
  const text = `Your OTP for verifying your email on SchoolRide is: ${otp}. This OTP is valid for 10 minutes.\n\nBest regards,\nThe SchoolRide Team`;
  await sendEmail({to: email, subject, text});
}

export const sendResetPasswordEmail = async (email, otp) => {
  const subject = "Your SchoolRide Password Reset OTP";
  const text = `Your OTP for resetting your password on SchoolRide is: ${otp}. This OTP is valid for 10 minutes.\n\nBest regards,\nThe SchoolRide Team`;
  await sendEmail({to: email, subject, text});
}

export const sendWelcomeEmail = async (email, name) => {
  const subject = 'Welcome to SchoolRide';
  const text = `Hi ${name},\n\nWelcome to SchoolRide! We're excited to have you on board. If you have any questions or need assistance, feel free to reach out to our support team.\n\nBest regards,\nThe SchoolRide Team`;
  await sendEmail({to: email, subject, text});
}

export default sendEmail;