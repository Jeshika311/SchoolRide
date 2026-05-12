import { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchApi } from '../../api';
import '../Login/Login.css';
import './ChangePasswordPage.css';

const otpLength = 6;

export default function VerifyOTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, newPassword } = location.state || {};

  const [otp, setOtp] = useState(Array(otpLength).fill(''));
  const otpRefs = useRef([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const normalizedEmail = email?.trim().toLowerCase() || '';
  const otpValue = otp.join('');

  // Redirect if required state is missing
  if (!email || !newPassword) {
    return (
      <div className="auth-page change-password-page">
        <div className="auth-shell change-password-shell">
          <div className="auth-topbar">
            <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">←</button>
          </div>
          <h1 className="auth-title">Error</h1>
          <p className="small-muted">Session expired. Please try again.</p>
          <button className="big-btn" onClick={() => navigate('/change-password')}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const updateOtp = (index, value) => {
    const nextValue = value.slice(-1).replace(/\D/g, '');
    setOtp((previous) => {
      const next = [...previous];
      next[index] = nextValue;
      return next;
    });

    if (nextValue && index < otpLength - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyAndChange = async (event) => {
    event.preventDefault();
    setMessage(null);

    if (otpValue.length !== otpLength) {
      setMessage({ type: 'error', text: 'Enter the 6-digit OTP sent to your email.' });
      return;
    }

    setLoading(true);
    const verifyResult = await fetchApi('/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ email: normalizedEmail, otp: otpValue }),
    });

    if (verifyResult.status !== 200 || !verifyResult.data?.success) {
      setLoading(false);
      setMessage({ type: 'error', text: verifyResult.data?.message || 'OTP verification failed.' });
      return;
    }

    const resetResult = await fetchApi('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email: normalizedEmail, newPassword }),
    });
    setLoading(false);

    if (resetResult.status !== 200 || !resetResult.data?.success) {
      setMessage({ type: 'error', text: resetResult.data?.message || 'Unable to change password.' });
      return;
    }

    setMessage({ type: 'success', text: 'Password changed successfully.' });
    setTimeout(() => navigate('/profile', { replace: true }), 1200);
  };

  const resendOtp = async () => {
    if (!normalizedEmail) return;

    setLoading(true);
    const { status, data } = await fetchApi('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: normalizedEmail }),
    });
    setLoading(false);

    if (status !== 200 || !data?.success) {
      setMessage({ type: 'error', text: data?.message || 'Unable to resend OTP.' });
      return;
    }

    setOtp(Array(otpLength).fill(''));
    setMessage({ type: 'success', text: 'A new OTP has been sent to your email.' });
  };

  return (
    <div className="auth-page change-password-page">
      <div className="auth-shell change-password-shell">
        <div className="auth-topbar">
          <button className="back-btn" onClick={() => navigate('/change-password')} aria-label="Go back">←</button>
        </div>

        <h1 className="auth-title">Verify OTP</h1>
        <p className="small-muted change-password-subtitle">
          Enter the 6-digit code we sent to your email to confirm the password change.
        </p>

        {message && <div className={`change-password-alert change-password-alert--${message.type}`}>{message.text}</div>}

        <form className="auth-form change-password-form" onSubmit={handleVerifyAndChange}>
          <div className="change-password-otp-block">
            <div className="field-label">OTP Code</div>
            <div className="otp-row change-password-otp-row">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => { otpRefs.current[index] = element; }}
                  className="otp-input"
                  maxLength={1}
                  value={digit}
                  onChange={(event) => updateOtp(index, event.target.value)}
                  onKeyDown={(event) => handleOtpKeyDown(index, event)}
                  inputMode="numeric"
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            </div>
            <div className="small-muted change-password-hint">Enter the 6-digit code we sent to {normalizedEmail}.</div>
          </div>

          <button className="big-btn" type="submit" disabled={loading}>
            Verify OTP & Change Password
          </button>

          <button className="change-password-link" type="button" onClick={resendOtp} disabled={loading}>
            Resend OTP
          </button>
        </form>
      </div>
    </div>
  );
}
