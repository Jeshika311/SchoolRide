import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../../api';
import { FiLogOut } from 'react-icons/fi';
import './ProfilePage.css';

export default function ProfilePage({ isPopup = false, onClose }) {
  const navigate = useNavigate();
  const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
  const [showSettings, setShowSettings] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleNavigate = (path) => {
    // Placeholder: navigate to real routes if exist
    if (path) navigate(path);
  };

  const openSettings = () => setShowSettings(true);
  const closeSettings = () => setShowSettings(false);

  const handleLogout = async () => {
    const deviceToken = authUser.device_token || authUser.fcmToken || authUser.deviceToken;

    await fetchApi('/auth/logout', {
      method: 'POST',
      body: JSON.stringify(deviceToken ? { device_token: deviceToken } : {}),
    });

    localStorage.removeItem('authUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('profileData');
    localStorage.removeItem('currentBooking');

    navigate('/login', { replace: true });
  };

  const handleDeleteAccount = async () => {
    const isConfirmed = window.confirm('Are you sure you want to delete your account? This cannot be undone.');
    if (!isConfirmed) return;

    const { status, data } = await fetchApi('/user/deleteAccount', {
      method: 'DELETE'
    });

    if (status !== 200) {
      window.alert(data?.message || 'Unable to delete account right now.');
      return;
    }

    // Keep onboarding state; remove signed-in user/session data.
    localStorage.removeItem('authUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('profileData');
    localStorage.removeItem('currentBooking');

    navigate('/register', { replace: true });
  };

  return (
    <div className={`profile-shell ${isPopup ? 'is-popup' : ''}`}>
      <div className="profile-header">
        <div className="profile-avatar">{authUser.name ? authUser.name.charAt(0) : 'U'}</div>
        <div className="profile-info">
          <div className="profile-name">{authUser.name || 'User'}</div>
          <div className="profile-phone">{authUser.phone || authUser.mobile || ''}</div>
        </div>
      </div>

      <div className="profile-menu">
        {!showSettings ? (
          <>
            <button className="menu-item" onClick={() => {
              if (isPopup && onClose) {
                onClose();
              } else {
                handleNavigate('/home');
              }
            }}>
              <span className="menu-icon">🏠</span>
              <span className="menu-label">Dashboard</span>
            </button>

            <button className="menu-item" onClick={() => handleNavigate('/customer-support')}>
              <span className="menu-icon">🧑‍💻</span>
              <span className="menu-label">Customer Support</span>
            </button>

            <button className="menu-item" onClick={() => handleNavigate('/faqs')}>
              <span className="menu-icon">💬</span>
              <span className="menu-label">FAQs</span>
            </button>

            <button className="menu-item" onClick={() => handleNavigate('/privacy-terms')}>
              <span className="menu-icon">🔒</span>
              <span className="menu-label">Privacy & Terms</span>
            </button>

            <button className="menu-item" onClick={openSettings}>
              <span className="menu-icon">⚙️</span>
              <span className="menu-label">Setting</span>
            </button>

            <button className="menu-item danger" onClick={handleDeleteAccount}>
              <span className="menu-icon">🗑️</span>
              <span className="menu-label">Delete Account</span>
            </button>

            <button className="menu-item logout" onClick={handleLogout}>
              <span className="menu-icon"><FiLogOut /></span>
              <span className="menu-label">Logout</span>
            </button>
          </>
        ) : (
          <div className="settings-panel">
            <div className="settings-header">
              <button className="back-btn" onClick={closeSettings}>←</button>
              <h3>Setting</h3>
            </div>

            <div className="settings-card">
              <div className="settings-item toggle-row">
                <div className="toggle-left">
                  <span className="settings-icon">🔔</span>
                  <span className="settings-label">Notifications</span>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={notificationsEnabled} onChange={() => setNotificationsEnabled(prev => !prev)} />
                  <span className="slider" />
                </label>
              </div>

              <div className="divider" />

              <button className="settings-item" onClick={() => handleNavigate('/account-info')}>
                <span className="settings-icon">👤</span>
                <span className="settings-label">Account Information</span>
              </button>
              <div className="divider" />

              <button className="settings-item" onClick={() => handleNavigate('/change-password')}>
                <span className="settings-icon">🔐</span>
                <span className="settings-label">Change Password</span>
              </button>
              <div className="divider" />

              <button className="settings-item" onClick={() => handleNavigate('/terms-conditions')}>
                <span className="settings-icon">📄</span>
                <span className="settings-label">Terms & Conditions</span>
              </button>
              <div className="divider" />

              <button className="settings-item" onClick={() => handleNavigate('/privacy-policy')}>
                <span className="settings-icon">🔒</span>
                <span className="settings-label">Privacy Policy</span>
              </button>
            </div>

            <button className="menu-item danger" onClick={handleDeleteAccount}>
              <span className="menu-icon">🗑️</span>
              <span className="menu-label">Delete Account</span>
            </button>

            <button className="menu-item logout" onClick={handleLogout}>
              <span className="menu-icon"><FiLogOut /></span>
              <span className="menu-label">Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
