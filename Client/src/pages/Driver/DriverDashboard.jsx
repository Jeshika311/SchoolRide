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
    <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-5 shadow-xl backdrop-blur">
      <div className="flex items-center gap-4 text-left">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${item.accent} text-white shadow-[0_0_10px_rgba(99,102,241,0.25)]`}>
          <Icon className="text-xl" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400">{item.label}</p>
          <div className="text-2xl font-black tracking-tight text-slate-100 mt-0.5">{value}</div>
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
      <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/40 p-5 shadow-xl text-left">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Driver</p>
        <p className="mt-2 text-xl font-black text-slate-100">{user.name || 'Driver'}</p>
        <p className="mt-1 text-xs text-slate-400 truncate">{user.email || 'No email linked'}</p>
      </div>
      {statCards.map((item) => (
        <StatCard key={item.key} item={item} value={stats[item.key] ?? 0} />
      ))}
    </div>
  );

  const actions = (
    <>
      <button type="button" onClick={() => navigate('/driver/profile')} className="rounded-2xl bg-indigo-950/40 px-4 py-3 text-xs font-bold text-indigo-400 border border-indigo-900/60 transition-colors">
        <FiEdit3 className="inline-block -translate-y-px mr-1" /> Edit profile
      </button>
      <button type="button" onClick={refreshDashboard} className="rounded-2xl bg-slate-900 px-4 py-3 text-xs font-bold text-slate-300 border border-slate-800 hover:text-white transition-colors">
        <FiRefreshCw className="inline-block -translate-y-px mr-1" /> Refresh
      </button>
      <button type="button" onClick={handleLogout} className="rounded-2xl bg-rose-950/30 px-4 py-3 text-xs font-bold text-rose-400 border border-rose-900/50 hover:bg-rose-900/20 transition-colors">
        <FiLogOut className="inline-block -translate-y-px mr-1" /> Logout
      </button>
    </>
  );

  if (loading) {
    return <div className="min-h-screen bg-[#070A13] p-6 text-slate-400">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#070A13] p-6 text-slate-400">
        <div className="max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center shadow-2xl">
          <p className="text-lg font-bold text-slate-200">{error}</p>
          <button onClick={refreshDashboard} className="mt-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 font-semibold text-white">Retry</button>
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
      <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/40 p-6 shadow-xl backdrop-blur text-left">
        <h3 className="text-lg font-black text-white">Profile summary</h3>
        <p className="mt-1 text-xs text-slate-400">Your current driver record, availability, and quick account details.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 text-xs font-semibold">
          <div className="rounded-2xl bg-slate-950/40 border border-slate-800/60 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Email</p>
            <p className="mt-2 text-sm text-slate-200 block truncate">{user.email || 'No email linked'}</p>
          </div>
          <div className="rounded-2xl bg-slate-950/40 border border-slate-800/60 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Phone</p>
            <p className="mt-2 text-sm text-slate-200 block">{user.phone_number || 'Not set'}</p>
          </div>
          <div className="rounded-2xl bg-slate-950/40 border border-slate-800/60 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Vehicle type</p>
            <p className="mt-2 text-sm text-slate-200 block">{dashboard.profile?.vehicle_type || 'Not set'}</p>
          </div>
          <div className="rounded-2xl bg-slate-950/40 border border-slate-800/60 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Status</p>
            <p className="mt-2 text-sm text-slate-200 block">{dashboard.availability ? 'Online' : 'Offline'}</p>
          </div>
        </div>
      </div>
    </DriverLayout>
  );
}