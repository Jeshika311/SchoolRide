import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiBookOpen, FiClock, FiEdit3, FiLogOut, FiRefreshCw, FiTruck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { fetchApi } from '../../api';
import DriverLayout from '../../components/Driver/DriverLayout';

const emptyDashboard = {
  user: {},
  profile: null,
  availability: false,
  stats: {
    totalBookings: 0,
    activeBookings: 0,
    upcomingBookings: 0,
    historyBookings: 0,
    unreadNotifications: 0,
    estimatedEarnings: 0,
    pendingPayout: 0,
  },
  activeBookings: [],
  upcomingBookings: [],
  bookingHistory: [],
  notifications: [],
  recentBooking: null,
};

const statCards = [
  { key: 'activeBookings', label: 'Active rides', icon: FiTruck, accent: 'from-blue-500 to-cyan-400' },
  { key: 'upcomingBookings', label: 'Upcoming rides', icon: FiClock, accent: 'from-violet-500 to-fuchsia-400' },
  { key: 'historyBookings', label: 'Ride history', icon: FiBookOpen, accent: 'from-emerald-500 to-green-400' },
  { key: 'unreadNotifications', label: 'Notifications', icon: FiBell, accent: 'from-amber-500 to-orange-400' },
];

function StatCard({ item, value }) {
  const Icon = item.icon;
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="flex items-center gap-4">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${item.accent} text-white shadow-lg shadow-slate-200`}>
          <Icon className="text-xl" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">{item.label}</p>
          <div className="text-3xl font-black tracking-tight text-slate-900">{value}</div>
        </div>
      </div>
    </div>
  );
}

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [error, setError] = useState('');

  const refreshDashboard = async () => {
    const { status, data } = await fetchApi('/user/driver-dashboard');

    if (status === 401) {
      navigate('/login', { replace: true });
      return;
    }

    if (status !== 200 || !data?.success) {
      throw new Error(data?.message || 'Unable to load driver dashboard.');
    }

    setDashboard(data.data || emptyDashboard);
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        await refreshDashboard();
      } catch (loadError) {
        setError(loadError.message || 'Unable to load dashboard.');
        toast.error(loadError.message || 'Unable to load dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleAvailabilityToggle = async () => {
    try {
      setSavingAvailability(true);
      const nextAvailability = !dashboard.availability;
      const { status, data } = await fetchApi('/user/updateDriverAvailability', {
        method: 'PUT',
        body: JSON.stringify({ isAvailable: nextAvailability }),
      });

      if (status !== 200 || !data?.success) {
        throw new Error(data?.message || 'Unable to update availability.');
      }

      setDashboard((previous) => ({ ...previous, availability: data.user?.isAvailable ?? nextAvailability, user: data.user || previous.user }));
      toast.success(data.message || 'Availability updated successfully.');
    } catch (toggleError) {
      toast.error(toggleError.message || 'Unable to update availability.');
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleLogout = async () => {
    const storedUser = JSON.parse(localStorage.getItem('authUser') || '{}');
    const deviceToken = storedUser.device_token || storedUser.fcmToken || storedUser.deviceToken;

    await fetchApi('/auth/logout', {
      method: 'POST',
      body: JSON.stringify(deviceToken ? { device_token: deviceToken } : {}),
    });

    localStorage.removeItem('authUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('profileData');
    localStorage.removeItem('driverProfileData');
    localStorage.removeItem('currentBooking');

    navigate('/login', { replace: true });
  };

  const user = dashboard.user || {};
  const stats = dashboard.stats || emptyDashboard.stats;

  const summary = (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Driver</p>
        <p className="mt-2 text-2xl font-black text-slate-900">{user.name || 'Driver'}</p>
        <p className="mt-1 text-sm text-slate-600">{user.email || 'No email linked'}</p>
      </div>
      {statCards.map((item) => (
        <StatCard key={item.key} item={item} value={stats[item.key] ?? 0} />
      ))}
    </div>
  );

  const actions = (
    <>
      <button type="button" onClick={() => navigate('/driver/profile')} className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 ring-1 ring-blue-100">
        <FiEdit3 className="inline-block -translate-y-px" /> Edit profile
      </button>
      <button type="button" onClick={refreshDashboard} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 ring-1 ring-slate-200">
        <FiRefreshCw className="inline-block -translate-y-px" /> Refresh
      </button>
      <button type="button" onClick={handleLogout} className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 ring-1 ring-rose-100">
        <FiLogOut className="inline-block -translate-y-px" /> Logout
      </button>
    </>
  );

  if (loading) {
    return <div className="min-h-screen bg-slate-100 p-6 text-slate-900">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-100 p-6 text-slate-900">
        <div className="max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl shadow-slate-200">
          <p className="text-lg font-bold">{error}</p>
          <button onClick={refreshDashboard} className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <DriverLayout
      title="Driver Dashboard Summary"
      subtitle="Use the navigation panel to move between rides, tracking, notifications, earnings, and history."
      summary={summary}
      actions={actions}
      availability={dashboard.availability}
      availabilityLoading={savingAvailability}
      onAvailabilityToggle={handleAvailabilityToggle}
      onLogout={handleLogout}
      activePath="/driver/dashboard"
    >
      <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur">
        <h3 className="text-xl font-black text-slate-900">Profile summary</h3>
        <p className="mt-1 text-sm text-slate-500">Your current driver record, availability, and quick account details.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Email</p>
            <p className="mt-2 text-lg font-black text-slate-900">{user.email || 'No email linked'}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Phone</p>
            <p className="mt-2 text-lg font-black text-slate-900">{user.phone_number || 'Not set'}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Vehicle type</p>
            <p className="mt-2 text-lg font-black text-slate-900">{dashboard.profile?.vehicle_type || 'Not set'}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Status</p>
            <p className="mt-2 text-lg font-black text-slate-900">{dashboard.availability ? 'Online' : 'Offline'}</p>
          </div>
        </div>
      </div>
    </DriverLayout>
  );
}