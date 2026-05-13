import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SupportPages.css';

export default function TermsConditionsPage() {
  const navigate = useNavigate();

  return (
    <div className="support-page">
      <header className="support-page__header">
        <button className="support-page__back" onClick={() => navigate(-1)} aria-label="Go back">←</button>
        <h1 className="support-page__title">Terms & Conditions</h1>
      </header>

      <main className="support-page__content">
        <section className="legal-card">
          <h2>Terms & Conditions</h2>
          <p>
            These Terms govern your use of SchoolRide services. By using the app, you agree to these
            terms.
          </p>

          <h3>1. Account Responsibility</h3>
          <p>
            Users must provide accurate information and keep account credentials secure.
          </p>

          <h3>2. Booking Rules</h3>
          <p>
            Bookings should be created with correct trip details, pickup/drop locations, and contact
            information.
          </p>

          <h3>3. Safety and Conduct</h3>
          <p>
            Users and drivers must follow platform safety guidelines and applicable local laws.
          </p>

          <h3>4. Payment and Charges</h3>
          <p>
            Any applicable charges must be paid according to the payment method configured in your account.
          </p>

          <h3>5. Service Availability</h3>
          <p>
            Service availability may vary by route, time, and operational conditions.
          </p>

          <h3>6. Termination</h3>
          <p>
            Accounts may be suspended or terminated for misuse, fraud, or violation of platform policies.
          </p>
        </section>
      </main>
    </div>
  );
}
