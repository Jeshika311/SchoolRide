import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SupportPages.css';
import supportArt from '../../assets/Customer_Support.png';

const faqItems = [
  {
    icon: '🚌',
    question: 'How do I book a ride?',
    answer: 'Open the booking screen, choose your child, select pickup and drop-off details, then confirm the ride.',
  },
  {
    icon: '📍',
    question: 'Can I change the drop-off location?',
    answer: 'Yes. Update the destination before confirming the booking. For live trips, contact support if changes are needed.',
  },
  {
    icon: '💳',
    question: 'How can I pay for my ride?',
    answer: 'You can pay using the payment method added in your account or follow the payment instructions shown during booking.',
  },
  {
    icon: '⏰',
    question: 'Is pre-booking available?',
    answer: 'Yes, you can book rides ahead of time so your child’s trip is scheduled in advance.',
  },
  {
    icon: '🛡️',
    question: 'How is safety ensured during the ride?',
    answer: 'Trips are monitored, driver details are tracked, and booking records help keep the ride secure and transparent.',
  },
  {
    icon: '👋',
    question: 'How can I contact support?',
    answer: 'You can use the Customer Support page, chat option, or call option from the drawer menu.',
  },
];

export default function FAQsPage() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenIndex((current) => (current === index ? -1 : index));
  };

  return (
    <div className="support-page">
      <header className="support-page__header">
        <button className="support-page__back" onClick={() => navigate(-1)} aria-label="Go back">←</button>
        <h1 className="support-page__title">FAQs</h1>
      </header>

      <main className="support-page__content">
        <section className="support-hero faq-hero">
          <div className="support-hero__art support-hero__art--support" aria-hidden="true">
            <img className="support-hero__image" src={supportArt} alt="" />
          </div>
          <div className="support-hero__body">
            <h2>Frequently Asked Questions</h2>
            <p>
              Find Answer To Common Questions Below
            </p>
          </div>
        </section>

        <section className="faq-panel" aria-label="Frequently asked questions">
          {faqItems.map((item, index) => (
            <article className="faq-item" key={item.question}>
              <button className="faq-item__button" onClick={() => toggleFaq(index)}>
                <span className="faq-item__icon">{item.icon}</span>
                <p className="faq-item__question">{item.question}</p>
                <span aria-hidden="true">{openIndex === index ? '⌃' : '⌄'}</span>
              </button>
              {openIndex === index ? <p className="faq-item__answer">{item.answer}</p> : null}
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
