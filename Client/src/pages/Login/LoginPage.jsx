import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchApi } from '../../api';
import '../../pages/Register/RegisterPage.css';
import './Login.css';

export default function LoginPage() {
  const [method, setMethod] = useState('phone');
  const [form, setForm] = useState({ phone: '', email: '', password: '' });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!acceptTerms) {
      setMessage({ type: 'error', text: 'Please accept the Terms & Conditions and Privacy Policy to continue.' });
      return;
    }

    setLoading(true);

    const payload = {
      password: form.password,
      ...(method === 'email'
        ? { email: form.email.trim() }
        : { phone_number: form.phone.trim() }),
    };

    const { status, data } = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (status === 200) {
      localStorage.setItem('authUser', JSON.stringify(data.user || {}));
      localStorage.setItem('termsAccepted', data.user?.termsAccepted ? 'true' : 'false');
      if (data.user?.role) {
        localStorage.setItem('userRole', data.user.role);
      }
      navigate('/home', { replace: true });
      return;
    }

    setMessage({ type: 'error', text: data.message || 'Login failed.' });
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <h1 className="auth-title">Login</h1>

        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        <div className="pill-toggle" role="tablist" aria-label="Login method">
          <button className={method === 'phone' ? 'active' : ''} onClick={() => setMethod('phone')}>Phone</button>
          <button className={method === 'email' ? 'active' : ''} onClick={() => setMethod('email')}>Email</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {method === 'phone' ? (
            <div>
              <label className="field-label">Phone Number</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="text-input" placeholder="Phone Number" required />
            </div>
          ) : (
            <div>
              <label className="field-label">Email Address</label>
              <input name="email" value={form.email} onChange={handleChange} className="text-input" type="email" placeholder="Enter Your Email Id" required />
            </div>
          )}

          <div>
            <label className="field-label">Password</label>
            <input name="password" value={form.password} onChange={handleChange} className="password-input" type="password" placeholder="Password" required />
          </div>

          <label className="checkbox-row" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px', marginBottom: '14px', textAlign: 'left', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="acceptTerms"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              required
              style={{ cursor: 'pointer', width: '16px', height: '16px', flexShrink: 0 }}
            />
            <span style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
              I have read and agree to the <Link to="/terms" style={{ color: '#0b76ff', fontWeight: 600 }}>Terms & Conditions</Link> & <Link to="/privacy" style={{ color: '#0b76ff', fontWeight: 600 }}>Privacy Policy</Link>
            </span>
          </label>

          <button className="big-btn" type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>

          <div className="link-row">
            <div className="small-muted"><Link to="/forgot">Forgot Your Password?</Link></div>
            <div className="small-muted">Don't Have an Account? <Link to="/register">Sign Up</Link></div>
          </div>

        </form>
      </div>
    </div>
  );
}
