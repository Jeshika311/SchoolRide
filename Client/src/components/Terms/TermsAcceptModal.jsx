import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowDown, FiCheckCircle, FiClock, FiFileText, FiMapPin, FiShield, FiUsers, FiAlertTriangle } from 'react-icons/fi';
import { fetchApi } from '../../api';

const sections = [
  {
    title: 'Safety first',
    content: 'All riders, parents, and drivers must follow the SchoolRide safety rules and campus pickup procedures.',
    icon: FiShield
  },
  {
    title: 'Live tracking',
    content: 'Trip tracking is used only for ride coordination, security, and arrival transparency.',
    icon: FiMapPin
  },
  {
    title: 'Timely updates',
    content: 'Delay alerts, cab arrival events, and SOS notices may be delivered through push and in-app channels.',
    icon: FiClock
  },
  {
    title: 'Community conduct',
    content: 'Parents, drivers, and staff should communicate respectfully and keep children’s safety the priority.',
    icon: FiUsers
  },
  {
    title: 'Account responsibility',
    content: 'You are responsible for maintaining accurate profile information and secure account access.',
    icon: FiCheckCircle
  },
  {
    title: 'Route compliance',
    content: 'Drivers must follow approved routes and report unexpected deviations immediately.',
    icon: FiAlertTriangle
  }
];

export default function TermsAcceptModal({ onAccept }) {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const [canAccept, setCanAccept] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const progressLabel = useMemo(() => `${Math.round(scrollProgress)}%`, [scrollProgress]);

  useEffect(() => {
    const onScroll = () => {
      const element = containerRef.current;
      if (!element) {
        return;
      }

      const totalScrollable = element.scrollHeight - element.clientHeight;
      const progress = totalScrollable > 0 ? (element.scrollTop / totalScrollable) * 100 : 100;
      setScrollProgress(progress);
      setCanAccept(progress >= 95);
    };

    onScroll();
    const element = containerRef.current;
    if (element) {
      element.addEventListener('scroll', onScroll);
    }

    return () => {
      if (element) {
        element.removeEventListener('scroll', onScroll);
      }
    };
  }, []);

  const handleAgreeClick = async () => {
    if (!canAccept || submitting) {
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const { status, data } = await fetchApi('/auth/accept-terms', {
        method: 'POST'
      });

      if (status === 200 && data?.success) {
        const currentUser = JSON.parse(localStorage.getItem('authUser') || '{}');
        const updatedUser = {
          ...currentUser,
          ...(data.user || {}),
          termsAccepted: true
        };

        localStorage.setItem('authUser', JSON.stringify(updatedUser));
        localStorage.setItem('termsAccepted', 'true');
        onAccept?.();
        return;
      }

      if (status === 401 || status === 403) {
        localStorage.removeItem('authUser');
        localStorage.setItem('termsAccepted', 'false');
        setErrorMsg('Your session is not available. Please log in again.');
        navigate('/login', { replace: true });
        return;
      }

      setErrorMsg(data?.message || 'Unable to confirm acceptance right now.');
    } catch (error) {
      setErrorMsg(error.message || 'Unable to confirm acceptance right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(8px)',
        display: 'grid',
        placeItems: 'center',
        padding: 'clamp(12px, 3vw, 20px)'
      }}
    >
      <div
        style={{
          width: 'min(780px, calc(100vw - 24px))',
          maxHeight: 'calc(100vh - 24px)',
          overflow: 'hidden',
          borderRadius: '28px',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          boxShadow: '0 30px 80px rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(148, 163, 184, 0.28)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 'inherit', minHeight: 0 }}>
          <div style={{ padding: 'clamp(18px, 3vw, 26px) clamp(18px, 3vw, 26px) 18px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '14px', textAlign: 'left' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '18px', background: '#eff6ff', border: '1px solid #dbeafe', display: 'grid', placeItems: 'center', color: '#2563eb', flexShrink: 0 }}>
              <FiFileText size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '11px', fontWeight: 800, color: '#64748b' }}>
                Required user agreement
              </p>
              <h2 style={{ margin: '6px 0 8px', fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em' }}>
                Terms & Safety Policy
              </h2>
              <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>
                Please review the core policy points below before continuing. This keeps ride tracking, parent communication, and driver coordination aligned.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(scrollProgress, 100)}%`, height: '100%', background: scrollProgress >= 95 ? '#10b981' : '#2563eb', transition: 'width 0.15s ease' }} />
              </div>
              <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#64748b' }}>{progressLabel} read</p>
            </div>

            {!canAccept && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#2563eb', fontSize: '12px', fontWeight: 700, lineHeight: 1.4 }}>
                <FiArrowDown /> Scroll to the bottom to unlock acceptance
              </div>
            )}
          </div>
          </div>

          <div
            ref={containerRef}
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              padding: '20px clamp(18px, 3vw, 26px)',
              display: 'grid',
              gap: '14px',
              textAlign: 'left'
            }}
          >
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <article
                  key={section.title}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr',
                    gap: '14px',
                    alignItems: 'start',
                    padding: '14px',
                    borderRadius: '18px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', color: '#2563eb', flexShrink: 0 }}>
                    <Icon size={18} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: '#0f172a', lineHeight: 1.25 }}>{section.title}</h3>
                    <p style={{ margin: 0, color: '#475569', lineHeight: 1.7, fontSize: '14px', overflowWrap: 'anywhere' }}>{section.content}</p>
                  </div>
                </article>
              );
            })}
          </div>

          {errorMsg && (
            <div style={{ padding: '0 clamp(18px, 3vw, 26px) 14px', color: '#dc2626', fontSize: '13px', fontWeight: 700, textAlign: 'center', flexShrink: 0 }}>
              {errorMsg}
            </div>
          )}

          <div style={{ padding: '0 clamp(18px, 3vw, 26px) clamp(18px, 3vw, 26px)', display: 'grid', gap: '10px', flexShrink: 0, borderTop: '1px solid #e2e8f0', background: 'linear-gradient(180deg, rgba(248,250,252,0.2) 0%, rgba(248,250,252,1) 100%)' }}>
            <button
              type="button"
              onClick={handleAgreeClick}
              disabled={!canAccept || submitting}
              style={{
                width: '100%',
                border: 'none',
                borderRadius: '18px',
                padding: '16px 18px',
                cursor: canAccept && !submitting ? 'pointer' : 'not-allowed',
                background: canAccept ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : '#cbd5e1',
                color: canAccept ? '#fff' : '#64748b',
                fontSize: '15px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: canAccept ? '0 14px 30px rgba(37, 99, 235, 0.28)' : 'none'
              }}
            >
              {submitting ? 'Processing...' : <><FiCheckCircle /> I Agree & Continue</>}
            </button>

            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textAlign: 'center',
                color: '#64748b',
                textDecoration: 'none',
                fontSize: '12px',
                fontWeight: 700
              }}
            >
              Open the full terms page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
