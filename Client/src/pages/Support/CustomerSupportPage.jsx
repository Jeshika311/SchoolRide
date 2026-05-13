import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SupportPages.css';
import supportArt from '../../assets/Customer_Support.png';

export default function CustomerSupportPage() {
  const navigate = useNavigate();

  return (
    <div className="support-page">
      <header className="support-page__header">
        <button className="support-page__back" onClick={() => navigate(-1)} aria-label="Go back">←</button>
        <h1 className="support-page__title">Customer Support</h1>
      </header>

      <main className="support-page__content">
        <section className="support-hero">
          <div className="support-hero__art support-hero__art--support" aria-hidden="true">
            <img className="support-hero__image" src={supportArt} alt="" />
          </div>
          <div className="support-hero__body">
            <h2>How Can We Assist You?</h2>
            <p>
              Our support team is here to help with ride issues, booking questions, account concerns,
              and anything else you need.
            </p>
          </div>
        </section>

        <section className="support-card-stack" aria-label="Support options">
          <button className="action-item" onClick={() => navigate('/faqs')}>
            <span className="action-item__icon">❓</span>
            <span className="action-item__meta">
              <p className="action-item__title">Help Center</p>
              <p className="action-item__subtitle">Find answers to common questions</p>
            </span>
            <span className="action-item__chevron">›</span>
          </button>

          <button className="action-item" onClick={() => window.location.href = 'mailto:support@schoolride.com'}>
            <span className="action-item__icon">💬</span>
            <span className="action-item__meta">
              <p className="action-item__title">Chat With Support</p>
              <p className="action-item__subtitle">Send a message to our support team</p>
            </span>
            <span className="action-item__chevron">›</span>
          </button>

          <button className="action-item" onClick={() => window.location.href = 'tel:+919876543210'}>
            <span className="action-item__icon">📞</span>
            <span className="action-item__meta">
              <p className="action-item__title">Call Us</p>
              <p className="action-item__subtitle">Reach us directly by phone</p>
            </span>
            <span className="action-item__chevron">›</span>
          </button>
        </section>
      </main>
    </div>
  );
}
