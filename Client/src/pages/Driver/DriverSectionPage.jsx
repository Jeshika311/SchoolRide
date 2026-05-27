import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiBookOpen, FiDollarSign, FiMapPin, FiTruck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { fetchApi } from '../../api';
import DriverLayout from '../../components/Driver/DriverLayout';

const sectionConfig = {
  rides: {
    title: 'Ride Management',
    subtitle: 'Handle assigned ride requests, accept or reject bookings, and update trip state in one place.',
    emptyText: 'No assigned rides yet.',
    statsLabel: 'Active ride tasks',
    icon: FiTruck,
  },
  tracking: {
    title: 'Live Tracking',
    subtitle: 'Track active trips and route movement with a map placeholder ready for live GPS integration.',
    emptyText: 'No live trip selected.',
    statsLabel: 'Live trip status',
    icon: FiMapPin,
  },
  notifications: {
    title: 'Notifications',
    subtitle: 'Monitor ride alerts, safety messages, and system updates from one clean inbox.',
    emptyText: 'No notifications yet.',
    statsLabel: 'Unread alerts',
    icon: FiBell,
  },
  earnings: {
    title: 'Earnings & Payments',
    subtitle: 'Review earnings, pending payouts, and payment placeholders for driver settlements.',
    emptyText: 'No earning records yet.',
    statsLabel: 'Estimated earnings',
    icon: FiDollarSign,
  },
  history: {
    title: 'Booking History',
    subtitle: 'Browse completed and rejected rides from your driver timeline.',
    emptyText: 'No ride history yet.',
    statsLabel: 'History records',
    icon: FiBookOpen,
  },
};

const formatTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Scheduled ride' : date.toLocaleString();
};

const statusTone = {
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  accepted: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  rejected: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  picked: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200',
  dropped: 'bg-slate-50 text-slate-700 ring-1 ring-slate-200',
};

function StatPill({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-[0_16px_34px_rgba(15,23,42,0.05)]">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

export default function DriverSectionPage({ section }) {
  const navigate = useNavigate();
  const config = sectionConfig[section] || sectionConfig.rides;
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingAvailability, setSavingAvailability] = useState(false);

  const loadDashboard = async () => {
    const { status, data } = await fetchApi('/user/driver-dashboard');
    if (status === 401) {
      navigate('/login', { replace: true });
      return;
    }
    if (status !== 200 || !data?.success) {
      throw new Error(data?.message || 'Unable to load driver dashboard.');
    }
    setDashboard(data.data);
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await loadDashboard();
      } catch (err) {
        toast.error(err.message || 'Unable to load driver dashboard.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [section]);

  const handleAvailabilityToggle = async () => {
    try {
      setSavingAvailability(true);
      const nextAvailability = !dashboard?.availability;
      const { status, data } = await fetchApi('/user/updateDriverAvailability', {
        method: 'PUT',
        body: JSON.stringify({ isAvailable: nextAvailability }),
      });

      if (status !== 200 || !data?.success) throw new Error(data?.message || 'Unable to update availability.');
      setDashboard((previous) => ({ ...previous, availability: data.user?.isAvailable ?? nextAvailability, user: data.user || previous.user }));
      toast.success(data.message || 'Availability updated successfully.');
    } catch (err) {
      toast.error(err.message || 'Unable to update availability.');
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleLogout = async () => {
    const storedUser = JSON.parse(localStorage.getItem('authUser') || '{}');
    const deviceToken = storedUser.device_token || storedUser.fcmToken || storedUser.deviceToken;
    await fetchApi('/auth/logout', { method: 'POST', body: JSON.stringify(deviceToken ? { device_token: deviceToken } : {}) });
    localStorage.removeItem('authUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('profileData');
    localStorage.removeItem('driverProfileData');
    navigate('/login', { replace: true });
  };

  const user = dashboard?.user || JSON.parse(localStorage.getItem('authUser') || '{}');
  const profile = dashboard?.profile || {};
  const items =
    section === 'tracking' ? dashboard?.activeBookings?.slice(0, 1) || [] :
    section === 'notifications' ? dashboard?.notifications || [] :
    section === 'earnings' ? dashboard?.bookingHistory || [] :
    section === 'history' ? dashboard?.bookingHistory || [] :
    dashboard?.activeBookings || [];

  const stats = dashboard?.stats || {};

  const summary = (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Driver</p>
        <p className="mt-2 text-2xl font-black text-slate-900">{user.name || 'Driver'}</p>
        <p className="mt-1 text-sm text-slate-600">{user.email || 'No email linked'}</p>
      </div>
      <StatPill label={config.statsLabel} value={section === 'earnings' ? `₹${stats.estimatedEarnings || 0}` : items.length} />
      <StatPill label="Availability" value={dashboard?.availability ? 'Online' : 'Offline'} />
      <StatPill label="Vehicle" value={profile.vehicle_type || 'Not set'} />
    </div>
  );

  const actions = (
    <>
      <button
        type="button"
        onClick={() => navigate('/driver/dashboard')}
        className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 ring-1 ring-blue-100"
      >
        Dashboard
      </button>
      <button
        type="button"
        onClick={handleAvailabilityToggle}
        disabled={savingAvailability}
        className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-black disabled:opacity-60"
      >
        {dashboard?.availability ? 'Set Offline' : 'Set Online'}
      </button>
    </>
  );

  if (loading) {
    return (
      <DriverLayout
        title={config.title}
        subtitle={config.subtitle}
        summary={summary}
        actions={actions}
        availability={dashboard?.availability}
        availabilityLoading={savingAvailability}
        onAvailabilityToggle={handleAvailabilityToggle}
        onLogout={handleLogout}
        activePath={`/driver/${section}`}
      >
        <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 text-sm text-slate-500 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur">
          Loading {config.title.toLowerCase()}...
        </div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout
      title={config.title}
      subtitle={config.subtitle}
      summary={summary}
      actions={actions}
      availability={dashboard?.availability}
      availabilityLoading={savingAvailability}
      onAvailabilityToggle={handleAvailabilityToggle}
      onLogout={handleLogout}
      activePath={`/driver/${section}`}
    >
      <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur">
        <h3 className="text-xl font-black text-slate-900">{config.title}</h3>
        <p className="mt-1 text-sm text-slate-500">{config.subtitle}</p>

        <div className="mt-4 grid gap-3">
          {items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              {config.emptyText}
            </div>
          ) : (
            items.map((booking) => (
              <div key={booking.id || booking._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{booking.childName || booking.title || booking.titleText || 'Ride item'}</p>
                    <p className="mt-1 text-sm text-slate-500">{booking.pickupPoint || booking.message || 'Ride details'}</p>
                    {booking.dropPoint && <p className="mt-1 text-sm text-slate-500">{booking.pickupPoint} → {booking.dropPoint}</p>}
                    {booking.createdAt && <p className="mt-1 text-xs text-slate-400">{formatTime(booking.createdAt)}</p>}
                  </div>
                  {(booking.status || booking.type) && (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusTone[booking.status || booking.type] || 'bg-slate-100 text-slate-700'}`}>
                      {booking.status || booking.type}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DriverLayout>
  );
}