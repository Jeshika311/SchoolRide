import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../../api';
import '../Login/Login.css';
import './ChangePasswordPage.css';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('authUser') || '{}');
  const defaultEmail = useMemo(() => storedUser.email || '', [storedUser.email]);

  const [email, setEmail] = useState(defaultEmail);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const normalizedEmail = email.trim().toLowerCase();

  const handleSendOtp = async (event) => {
    event.preventDefault();
    setMessage(null);

    if (!normalizedEmail) {
      setMessage({ type: 'error', text: 'Email is required.' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    const { status, data } = await fetchApi('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: normalizedEmail }),
    });
    setLoading(false);

    if (status !== 200 || !data?.success) {
      setMessage({ type: 'error', text: data?.message || 'Unable to send OTP right now.' });
      return;
    }

    setMessage({ type: 'success', text: 'OTP sent to your email address.' });
    // Navigate to OTP verification page after a short delay
    setTimeout(() => {
      navigate('/verify-otp', {
        state: { email: normalizedEmail, newPassword },
      });
    }, 800);
  };

  return (
    <div className="auth-page change-password-page">
      <div className="auth-shell change-password-shell">
        <div className="auth-topbar">
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">←</button>
        </div>

        <h1 className="auth-title">Change Password</h1>
        <p className="small-muted change-password-subtitle">
          Confirm your identity with a code sent to your email, then set a new password.
        </p>

        {message && <div className={`change-password-alert change-password-alert--${message.type}`}>{message.text}</div>}

        <form className="auth-form change-password-form" onSubmit={handleSendOtp}>
          <div>
            <label className="field-label">Registered Email</label>
            <input
              className="text-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              type="email"
              required
            />
          </div>

          <div>
            <label className="field-label">New Password</label>
            <input
              className="password-input"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Enter a new password"
              type="password"
              required
            />
          </div>

          <div>
            <label className="field-label">Confirm New Password</label>
            <input
              className="password-input"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm your new password"
              type="password"
              required
            />
          </div>

          <button className="big-btn" type="submit" disabled={loading}>
            Send OTP
          </button>
        </form>
      </div>
    </div>
  );
}
