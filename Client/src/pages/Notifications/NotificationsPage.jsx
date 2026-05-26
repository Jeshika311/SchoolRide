import { useMemo, useState } from 'react';
import { FiAlertTriangle, FiBell, FiCheckCircle, FiRefreshCw, FiShield } from 'react-icons/fi';
import { useNotifications } from '../../context/NotificationContext';
import NotificationList from '../../components/Notification/NotificationList';

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    unreadNotifications,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const [filter, setFilter] = useState('all');

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return unreadNotifications;
    }

    if (filter === 'alerts') {
      return notifications.filter((notification) => ['alert', 'delay', 'safety'].includes(notification.type));
    }

    return notifications;
  }, [filter, notifications, unreadNotifications]);

  const stats = [
    { label: 'Total', value: notifications.length, icon: FiBell, color: '#2563eb', background: '#eff6ff' },
    { label: 'Unread', value: unreadCount, icon: FiShield, color: '#059669', background: '#ecfdf5' },
    { label: 'Alerts', value: notifications.filter((notification) => ['alert', 'delay', 'safety'].includes(notification.type)).length, icon: FiAlertTriangle, color: '#d97706', background: '#fffbeb' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #eef2ff 0%, #f8fafc 40%, #ffffff 100%)', padding: '28px 16px 40px' }}>
      <div style={{ maxWidth: '980px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '11px', fontWeight: 800, color: '#64748b' }}>
              Live updates
            </p>
            <h1 style={{ margin: '8px 0 10px', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em' }}>
              Notifications
            </h1>
            <p style={{ margin: 0, color: '#475569', fontSize: '15px', maxWidth: '620px', lineHeight: 1.7 }}>
              Track ride events, safety alerts, delays, and system updates in one place.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => refreshNotifications()}
              style={{
                border: '1px solid #dbeafe',
                background: '#fff',
                color: '#2563eb',
                padding: '12px 16px',
                borderRadius: '16px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FiRefreshCw />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => markAllAsRead()}
              style={{
                border: 'none',
                background: '#2563eb',
                color: '#fff',
                padding: '12px 16px',
                borderRadius: '16px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FiCheckCircle />
              Mark all read
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} style={{ padding: '18px', borderRadius: '22px', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 14px 32px rgba(15, 23, 42, 0.05)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: stat.background, color: stat.color, display: 'grid', placeItems: 'center' }}>
                  <Icon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', marginTop: '4px' }}>{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
          {[
            { id: 'all', label: 'All notifications' },
            { id: 'unread', label: 'Unread only' },
            { id: 'alerts', label: 'Alerts & safety' }
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              style={{
                border: '1px solid',
                borderColor: filter === option.id ? '#2563eb' : '#cbd5e1',
                background: filter === option.id ? '#2563eb' : '#fff',
                color: filter === option.id ? '#fff' : '#334155',
                padding: '10px 14px',
                borderRadius: '999px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        <NotificationList
          notifications={filteredNotifications}
          onMarkRead={markAsRead}
          onDelete={deleteNotification}
        />
      </div>
    </div>
  );
}
