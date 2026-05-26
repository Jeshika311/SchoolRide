import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

export default function ResetPassword() {
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    // call reset API
    navigate('/login');
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <h1 className="auth-title">Create a New Password</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <label className="field-label">New Password</label>
            <input name="password" value={form.password} onChange={handleChange} className="password-input" type="password" placeholder="New Password" required />
          </div>

          <div>
            <label className="field-label">Confirm Password</label>
            <input name="confirm" value={form.confirm} onChange={handleChange} className="password-input" type="password" placeholder="Confirm Password" required />
          </div>

          {error && <div className="note-error">{error}</div>}

          <button className="big-btn" type="submit">Reset Password</button>
        </form>
      </div>
    </div>
  );
}
