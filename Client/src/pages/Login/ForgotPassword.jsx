import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Login.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // send OTP request
    setSent(true);
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <h1 className="auth-title">Forgot Your Password?</h1>
        <p className="small-muted">Enter your registered email to receive a verification code.</p>

        {!sent ? (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div>
              <label className="field-label">Email ID</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="text-input" placeholder="Enter Your Email Id" required />
            </div>
            <button className="big-btn" type="submit">Send OTP</button>
            <div className="link-row"><Link to="/login">Back to Login</Link></div>
          </form>
        ) : (
          <div className="auth-form">
            <div className="small-muted">We've sent a verification code to {email}.</div>
            <div className="link-row"><Link to="/verify">Verify OTP</Link></div>
          </div>
        )}
      </div>
    </div>
  );
}
