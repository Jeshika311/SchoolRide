import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SupportPages.css';
import privacyArt from '../../assets/privacy.png';

export default function PrivacyTermsPage() {
  const navigate = useNavigate();

  return (
    <div className="support-page">
      <header className="support-page__header">
        <button className="support-page__back" onClick={() => navigate(-1)} aria-label="Go back">←</button>
        <h1 className="support-page__title">Privacy & Terms</h1>
      </header>

      <main className="support-page__content">
        <section className="support-hero">
          <div className="support-hero__art support-hero__art--privacy" aria-hidden="true">
            <img className="support-hero__image" src={privacyArt} alt="" />
          </div>
          <div className="support-hero__body">
            <h2>Your Privacy Matters</h2>
            <p>
              Learn how we protect your data and make sure your experience stays safe and secure.
            </p>
          </div>
        </section>

        <section className="privacy-stack" aria-label="Privacy and terms options">
          <button className="privacy-card privacy-card--action" onClick={() => navigate('/privacy-policy')}>
            <p className="privacy-card__title">Privacy Policy</p>
            <p className="privacy-card__text">
              Understand how we collect, use, and protect your information across the platform.
            </p>
          </button>

          <button className="privacy-card privacy-card--action" onClick={() => navigate('/terms-conditions')}>
            <p className="privacy-card__title">Terms & Conditions</p>
            <p className="privacy-card__text">
              Read the rules and guidelines that apply when you use our services.
            </p>
          </button>

          <div className="privacy-links">
            <button className="privacy-link" onClick={() => navigate('/customer-support')}>
              <span className="privacy-link__icon">👤</span>
              <span className="privacy-link__meta">
                <p className="privacy-link__title">How can I contact support?</p>
                <p className="privacy-link__text">Go back to customer support options</p>
              </span>
              <span className="action-item__chevron">›</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
