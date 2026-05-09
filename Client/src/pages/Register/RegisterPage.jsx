import { useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../api';
import './RegisterPage.css';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: '',
    acceptTerms: false,
  });

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    if (!formData.acceptTerms) {
      setMessage({ type: 'error', text: 'Please accept the terms to continue.' });
      return;
    }

    setLoading(true);

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone_number: formData.phone_number.trim(),
      password: formData.password,
      role: 'parent',
      preferred_language: 'English',
    };

    const { status, data } = await fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (status === 201 || status === 200) {
      setMessage({ type: 'success', text: data.message || 'Account created successfully.' });
      setFormData({
        name: '',
        email: '',
        phone_number: '',
        password: '',
        acceptTerms: false,
      });
      setShowPassword(false);
      return;
    }

    setMessage({ type: 'error', text: data.message || 'Failed to create account.' });
  };

  return (
    <div className="register-page">
      <div className="register-shell">
        <h1 className="register-title">Sign Up</h1>

        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="field-group">
            <label className="field-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              className="text-input"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder='Enter name'
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              className="text-input"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder='Enter email'
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="phone_number">Phone Number</label>
             <input
               id="phone_number"
               className="text-input"
               type="tel"
               name="phone_number"
               placeholder="Phone Number"
               value={formData.phone_number}
               onChange={handleChange}
               required
             />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="password">Password</label>
            <div className="password-row">
              <input
                id="password"
                className="password-input"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder='Enter password'
                required
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '◠' : '◔'}
              </button>
            </div>
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleChange}
              required
            />
            <span>
              I Have Read and Agree to <a href="#">User Agreement</a> <a href="#">Privacy Policy</a>
            </span>
          </label>

          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>

        <div className="helper-row">
          Already Have an Account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}
