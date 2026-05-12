import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SupportPages.css';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="support-page">
      <header className="support-page__header">
        <button className="support-page__back" onClick={() => navigate(-1)} aria-label="Go back">←</button>
        <h1 className="support-page__title">Privacy Policy</h1>
      </header>

      <main className="support-page__content">
        <section className="legal-card">
          <h2>Privacy Policy</h2>
          <p>
            This Privacy Policy explains how SchoolRide collects, uses, stores, and protects your data
            when you use our platform.
          </p>

          <h3>1. Information We Collect</h3>
          <p>
            We may collect account information, contact details, booking details, and app usage data
            required to provide ride services.
          </p>

          <h3>2. How We Use Your Information</h3>
          <p>
            Your data is used to manage bookings, share ride updates, improve safety, and support your
            account experience.
          </p>

          <h3>3. Data Sharing</h3>
          <p>
            We only share required data with authorized drivers, schools, and service providers directly
            involved in service delivery.
          </p>

          <h3>4. Data Security</h3>
          <p>
            We apply reasonable technical and operational safeguards to protect personal information from
            unauthorized access or misuse.
          </p>

          <h3>5. User Rights</h3>
          <p>
            You can request profile updates or account deletion through in-app settings and support.
          </p>

          <h3>6. Contact</h3>
          <p>
            For any privacy concern, contact support from the Customer Support section.
          </p>
        </section>
      </main>
    </div>
  );
}
