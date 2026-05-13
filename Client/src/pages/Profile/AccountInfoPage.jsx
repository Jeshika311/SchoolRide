import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../../api';
import './AccountInfoPage.css';

const initialForm = {
  name: '',
  email: '',
  phone_number: '',
  child_name: '',
  school_name: '',
  grade_class: '',
  pickup_address: '',
  drop_address: '',
  license_number: '',
  vehicle_type: '',
  years_experience: '',
  vehicle_number: '',
  vehicle_seats: '',
};

export default function AccountInfoPage() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('authUser') || '{}');
  const [role, setRole] = useState(localStorage.getItem('userRole') || 'parent');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setMessage(null);

      const { status, data } = await fetchApi('/user/getProfile');

      if (status !== 200 || !data?.success) {
        setMessage({ type: 'error', text: data?.message || 'Unable to load account information.' });
        setLoading(false);
        return;
      }

      const user = data.user || {};
      const profile = data.roleProfile || {};
      const userRole = user.role || localStorage.getItem('userRole') || 'parent';
      setRole(userRole);

      setForm((previous) => ({
        ...previous,
        name: user.name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        child_name: profile.child_name || '',
        school_name: profile.school_name || '',
        grade_class: profile.grade_class || '',
        pickup_address: profile.pickup_address || '',
        drop_address: profile.drop_address || '',
        license_number: profile.license_number || '',
        vehicle_type: profile.vehicle_type || '',
        years_experience: profile.years_experience ?? '',
        vehicle_number: profile.vehicle_number || '',
        vehicle_seats: profile.vehicle_seats ?? '',
      }));

      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const displayName = form.name || storedUser.name || 'User';
  const displayRole = role === 'driver' ? 'Driver Profile' : 'Parent Profile';
  const displayEmail = form.email || storedUser.email || '';
  const displayPhone = form.phone_number || storedUser.phone_number || storedUser.phone || '';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const userPayload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone_number: form.phone_number.trim(),
    };

    const { status: userStatus, data: userData } = await fetchApi('/user/updateProfile', {
      method: 'PUT',
      body: JSON.stringify(userPayload),
    });

    if (userStatus !== 200 || !userData?.success) {
      setMessage({ type: 'error', text: userData?.message || 'Unable to update user information.' });
      setSaving(false);
      return;
    }

    let profileStatus = 200;
    let profileData = { success: true };

    if (role === 'parent') {
      const { status, data } = await fetchApi('/user/updateParentProfile', {
        method: 'PUT',
        body: JSON.stringify({
          child_name: form.child_name,
          school_name: form.school_name,
          grade_class: form.grade_class,
          pickup_address: form.pickup_address,
          drop_address: form.drop_address,
        }),
      });
      profileStatus = status;
      profileData = data;
    }

    if (role === 'driver') {
      const { status, data } = await fetchApi('/user/updateDriverProfile', {
        method: 'PUT',
        body: JSON.stringify({
          license_number: form.license_number,
          vehicle_type: form.vehicle_type,
          years_experience: form.years_experience === '' ? '' : Number(form.years_experience),
          vehicle_number: form.vehicle_number,
          vehicle_seats: form.vehicle_seats === '' ? '' : Number(form.vehicle_seats),
        }),
      });
      profileStatus = status;
      profileData = data;
    }

    if (profileStatus !== 200 || !profileData?.success) {
      setMessage({ type: 'error', text: profileData?.message || 'User data saved, but profile details failed to update.' });
      setSaving(false);
      return;
    }

    localStorage.setItem('authUser', JSON.stringify(userData.user || {}));
    localStorage.setItem('userRole', userData.user?.role || role);

    if (role === 'parent') {
      const profile = profileData.profile || {};
      const profileState = {
        child_name: profile.child_name || '',
        school_name: profile.school_name || '',
        grade_class: profile.grade_class || '',
        pickup_address: profile.pickup_address || '',
        drop_address: profile.drop_address || '',
      };
      localStorage.setItem('profileData', JSON.stringify(profileState));
      window.dispatchEvent(new Event('schoolNameUpdated'));
    }

    setMessage({ type: 'success', text: 'Account information updated successfully.' });
    setSaving(false);
  };

  return (
    <div className="account-page">
      <header className="account-page__header">
        <button className="account-page__back" onClick={() => navigate(-1)} aria-label="Go back">←</button>
        <h1 className="account-page__title">Account Information</h1>
      </header>

      <main className="account-page__content">
        {message && <div className={`account-alert account-alert--${message.type}`}>{message.text}</div>}

        <section className="account-hero">
          <div className="account-hero__avatar">{displayName.charAt(0).toUpperCase()}</div>
          <div className="account-hero__content">
            <h2>{displayName}</h2>
            <p>{displayRole}</p>
            <div className="account-hero__meta">
              <span>📧 {displayEmail || 'No email found'}</span>
              <span>📱 {displayPhone || 'No phone found'}</span>
            </div>
          </div>
        </section>

        <form className="account-card" onSubmit={handleSubmit}>
          {loading ? (
            <div className="account-loading">Loading account details...</div>
          ) : (
            <>
              <section className="account-section">
                <div className="account-section__header">
                  <div>
                    <h2 className="account-section__title">Basic Information</h2>
                    <p className="account-section__subtitle">Keep your contact details up to date.</p>
                  </div>
                </div>
                <div className="account-grid">
                  <label className="account-field">
                    <span className="account-field__label">👤 Name</span>
                    <input name="name" value={form.name} onChange={handleChange} className="account-input" />
                  </label>
                  <label className="account-field">
                    <span className="account-field__label">✉️ Email</span>
                    <input name="email" type="email" value={form.email} onChange={handleChange} className="account-input" />
                  </label>
                  <label className="account-field">
                    <span className="account-field__label">📞 Phone Number</span>
                    <input name="phone_number" value={form.phone_number} onChange={handleChange} className="account-input" />
                  </label>
                </div>
              </section>

              {role === 'parent' && (
                <section className="account-section">
                  <div className="account-section__header">
                    <div>
                      <h2 className="account-section__title">Parent Details</h2>
                      <p className="account-section__subtitle">Update school and child information for ride planning.</p>
                    </div>
                  </div>
                  <div className="account-grid">
                    <label className="account-field">
                      <span className="account-field__label">🧒 Child Name</span>
                      <input name="child_name" value={form.child_name} onChange={handleChange} className="account-input" />
                    </label>
                    <label className="account-field">
                      <span className="account-field__label">🏫 School Name</span>
                      <input name="school_name" value={form.school_name} onChange={handleChange} className="account-input" />
                    </label>
                    <label className="account-field">
                      <span className="account-field__label">🎒 Grade / Class</span>
                      <input name="grade_class" value={form.grade_class} onChange={handleChange} className="account-input" />
                    </label>
                    <label className="account-field">
                      <span className="account-field__label">📍 Pickup Address</span>
                      <input name="pickup_address" value={form.pickup_address} onChange={handleChange} className="account-input" />
                    </label>
                    <label className="account-field account-field--full">
                      <span className="account-field__label">🚩 Drop Address</span>
                      <input name="drop_address" value={form.drop_address} onChange={handleChange} className="account-input" />
                    </label>
                  </div>
                </section>
              )}

              {role === 'driver' && (
                <section className="account-section">
                  <div className="account-section__header">
                    <div>
                      <h2 className="account-section__title">Driver Details</h2>
                      <p className="account-section__subtitle">Manage license and vehicle information here.</p>
                    </div>
                  </div>
                  <div className="account-grid">
                    <label className="account-field">
                      <span className="account-field__label">🪪 License Number</span>
                      <input name="license_number" value={form.license_number} onChange={handleChange} className="account-input" />
                    </label>
                    <label className="account-field">
                      <span className="account-field__label">🚐 Vehicle Type</span>
                      <input name="vehicle_type" value={form.vehicle_type} onChange={handleChange} className="account-input" />
                    </label>
                    <label className="account-field">
                      <span className="account-field__label">⭐ Years of Experience</span>
                      <input name="years_experience" type="number" min="0" value={form.years_experience} onChange={handleChange} className="account-input" />
                    </label>
                    <label className="account-field">
                      <span className="account-field__label">🔢 Vehicle Number</span>
                      <input name="vehicle_number" value={form.vehicle_number} onChange={handleChange} className="account-input" />
                    </label>
                    <label className="account-field account-field--full">
                      <span className="account-field__label">💺 Vehicle Seats</span>
                      <input name="vehicle_seats" type="number" min="0" value={form.vehicle_seats} onChange={handleChange} className="account-input" />
                    </label>
                  </div>
                </section>
              )}

              <div className="account-actions">
                <button type="button" className="account-btn account-btn--ghost" onClick={() => navigate(-1)}>
                  Cancel
                </button>
                <button type="submit" className="account-btn account-btn--primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          )}
        </form>
      </main>
    </div>
  );
}
