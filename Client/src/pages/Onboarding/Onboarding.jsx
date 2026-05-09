import { useState } from 'react';
import './Onboarding.css';
import bg from '../../assets/bg_splash.webp';
import slide1 from '../../assets/img_walkthrough1.webp';
import slide2 from '../../assets/img_walkthrough2.webp';
import slide3 from '../../assets/img_walkthrough3.webp';
import parentImg from '../../assets/parent.png';
import driverImg from '../../assets/driver.png';
import arrow from '../../assets/arrow_next_with_blue_shape.webp';
import { FaUsers, FaBus } from 'react-icons/fa';

const accountCards = [
  {
    key: 'parent',
    title: 'Parent',
    desc: "Book and track your child's ride",
    image: parentImg,
    icon: FaUsers,
    iconClass: 'parent-icon',
  },
  {
    key: 'driver',
    title: 'Driver',
    desc: 'Provides rides and manage trips',
    image: driverImg,
    icon: FaBus,
    iconClass: 'driver-icon',
  },
];

export default function Onboarding({ onFinish }) {
  const slides = [
    {
      img: slide1,
      title: 'Safe & Verified Rides',
      desc: 'Trusted drivers and verified vehicles for your child\'s daily travel.'
    },
    {
      img: slide2,
      title: 'Live Tracking & Updates',
      desc: 'Track the van in real-time and get pickup/drop notifications instantly.'
    },
    {
      img: slide3,
      title: 'Easy Booking & Payments',
      desc: 'Choose a route, confirm seat, and pay monthly or per ride with ease.'
    }
  ];

  const [index, setIndex] = useState(0);

  const next = () => {
    if (index < slides.length - 1) setIndex(i => i + 1);
    else setIndex(slides.length); // move to choose-account screen
  };

  const skip = () => onFinish && onFinish();

  if (index === slides.length) {
    return (
      <div className="onboarding-root">
        <div className="choose-screen">
          <h2 className="choose-title">Choose Your Account Type</h2>
          <div className="account-grid">
            {accountCards.map(({ key, title, desc, image, icon: Icon, iconClass }) => (
              <button key={key} className="account-card" onClick={() => onFinish && onFinish(key)}>
                <div className="account-hero">
                  <img src={image} alt={title} />
                </div>
                <div className="account-body-row">
                  <div className={`account-icon ${iconClass}`} aria-hidden="true">
                    <Icon />
                  </div>
                  <div className="account-body">
                    <strong>{title}</strong>
                    <small>{desc}</small>
                  </div>
                  <span className="account-chevron" aria-hidden="true">›</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const slide = slides[index];

  return (
    <div className="onboarding-root">
      <div className="onboarding-card">
        <button className="skip-btn" onClick={skip}>Skip</button>
        <div className="onboarding-image">
          <img src={slide.img} alt={slide.title} />
        </div>

        <div className="onboarding-content">
          <h3>{slide.title}</h3>
          <p>{slide.desc}</p>
        </div>

        <div className="onboarding-footer">
          <div className="dots">
            {slides.map((_, i) => (
              <span key={i} className={i === index ? 'dot active' : 'dot'} />
            ))}
          </div>

          <button className="next-btn" onClick={next} aria-label="Next">
            <img src={arrow} alt="next" />
          </button>
        </div>
      </div>
    </div>
  );
}
