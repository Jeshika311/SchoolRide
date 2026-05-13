import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

export default function VerifyOtp() {
  const inputs = [useRef(), useRef(), useRef(), useRef()];
  const [values, setValues] = useState(['', '', '', '']);
  const [resendTimer, setResendTimer] = useState(45);
  const navigate = useNavigate();

  const handleChange = (index, e) => {
    const val = e.target.value.slice(-1);
    const next = [...values];
    next[index] = val;
    setValues(next);
    if (val && index < inputs.length - 1) inputs[index + 1].current.focus();
  };

  const handleVerify = (e) => {
    e.preventDefault();
    const code = values.join('');
    // verify code
    navigate('/reset');
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <h1 className="auth-title">Verify Your Email</h1>
        <p className="small-muted">We've sent a 4-digit code to your email.</p>

        <form className="auth-form" onSubmit={handleVerify}>
          <div className="otp-row">
            {inputs.map((ref, i) => (
              <input key={i} ref={ref} className="otp-input" maxLength={1} value={values[i]} onChange={(e) => handleChange(i, e)} />
            ))}
          </div>
          <button className="big-btn" type="submit">Verify OTP</button>
          <div className="link-row small-muted">Didn't receive code? <Link to="#">Resend in 00:{String(resendTimer).padStart(2,'0')}</Link></div>
        </form>
      </div>
    </div>
  );
}
