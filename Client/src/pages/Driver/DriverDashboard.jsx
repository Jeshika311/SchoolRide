import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiBookOpen, FiClock, FiEdit3, FiLogOut, FiMapPin, FiPhone, FiRefreshCw, FiTruck, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { fetchApi } from '../../api';
import DriverLayout from '../../components/Driver/DriverLayout';
import { useNotifications } from '../../context/NotificationContext';

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
  { key: 'todayTrips', label: 'Today\'s trips', icon: FiClock, accent: 'from-blue-500 to-cyan-400' },
  { key: 'studentCount', label: 'Student count', icon: FiBookOpen, accent: 'from-violet-500 to-fuchsia-400' },
  { key: 'unreadNotifications', label: 'Notifications', icon: FiBell, accent: 'from-emerald-500 to-green-400' },
  { key: 'activeBookings', label: 'Active rides', icon: FiTruck, accent: 'from-amber-500 to-orange-400' },
];

function StatCard({ item, value }) {
  const Icon = item.icon;

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] text-left">
      <div className="flex items-center gap-4">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${item.accent} text-white shadow-lg`}>
          <Icon className="text-xl" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500">{item.label}</p>
          <div className="mt-0.5 text-2xl font-black tracking-tight text-slate-900">{value}</div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, caption, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">{label}</p>
      <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
        {Icon ? <Icon className="text-slate-400" /> : null}
        <span className="truncate">{value}</span>
      </div>
      <p className="mt-1 text-xs text-slate-500">{caption}</p>
    </div>
  );
}

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { socket, refreshNotifications } = useNotifications();
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
        const message = loadError.message || 'Unable to load dashboard.';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const handleDashboardUpdated = () => {
      refreshDashboard().catch(() => {});
      refreshNotifications().catch(() => {});
    };

    socket.on('dashboard_updated', handleDashboardUpdated);
    return () => {
      socket.off('dashboard_updated', handleDashboardUpdated);
    };
  }, [socket]);

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
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('profileData');
    localStorage.removeItem('driverProfileData');
    localStorage.removeItem('currentBooking');

    navigate('/login', { replace: true });
  };

  const user = dashboard.user || {};
  const stats = dashboard.stats || emptyDashboard.stats;
  const assignedBus = dashboard.assignedBus || null;
  const assignedRoute = dashboard.assignedRoute || null;
  const pickupStops = dashboard.pickupStops || [];

  const summary = (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] text-left md:col-span-2 xl:col-span-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">Driver</p>
        <p className="mt-2 text-xl font-black text-slate-900">{user.name || 'Driver'}</p>
        <p className="mt-1 text-xs text-slate-500 truncate">{user.email || 'No email linked'}</p>
      </div>
      {statCards.map((item) => (
        <StatCard key={item.key} item={item} value={stats[item.key] ?? 0} />
      ))}
    </div>
  );

  const actions = (
    <>
      <button type="button" onClick={() => navigate('/driver/profile')} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:border-blue-200 hover:text-blue-700">
        <FiEdit3 className="inline-block -translate-y-px mr-1" /> Edit profile
      </button>
      <button type="button" onClick={refreshDashboard} className="rounded-2xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-slate-800">
        <FiRefreshCw className="inline-block -translate-y-px mr-1" /> Refresh
      </button>
      <button type="button" onClick={handleLogout} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100">
        <FiLogOut className="inline-block -translate-y-px mr-1" /> Logout
      </button>
    </>
  );

  if (loading) {
    return <div className="min-h-screen bg-slate-50 p-6 text-slate-500">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 p-6 text-slate-500">
        <div className="max-w-lg rounded-3xl bg-white border border-slate-200 p-8 text-center shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <p className="text-lg font-bold text-slate-800">{error}</p>
          <button onClick={refreshDashboard} className="mt-6 rounded-2xl bg-blue-600 hover:bg-blue-500 px-5 py-3 font-semibold text-white">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <DriverLayout
      title="Driver Dashboard Summary"
      subtitle="Manage rides, live tracking, notifications, and earnings from one light-themed panel."
      summary={summary}
      actions={actions}
      availability={dashboard.availability}
      availabilityLoading={savingAvailability}
      onAvailabilityToggle={handleAvailabilityToggle}
      onLogout={handleLogout}
      activePath="/driver/dashboard"
    >
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)] text-left">
        <h3 className="text-lg font-black text-slate-900">Assignment summary</h3>
        <p className="mt-1 text-xs text-slate-500">Your current bus, route, trips, and live status.</p>

        {assignedBus || assignedRoute ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 text-xs font-semibold">
            <SummaryCard label="Assigned bus" value={assignedBus?.busNumber || 'Not assigned'} caption="Linked bus from the admin panel" icon={FiTruck} />
            <SummaryCard label="Assigned route" value={assignedRoute?.route_name || assignedRoute?.start_location || 'Not assigned'} caption="Current route and stops" icon={FiMapPin} />
            <SummaryCard label="Today\'s trips" value={dashboard.todayTrips ?? 0} caption="Trips scheduled or started today" icon={FiClock} />
            <SummaryCard label="Student count" value={dashboard.studentCount ?? 0} caption="Confirmed students on the assigned bus" icon={FiBookOpen} />
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm font-semibold text-slate-600">
            No route has been assigned yet.
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 text-xs font-semibold">
          <SummaryCard label="Email" value={user.email || 'No email linked'} caption="Authenticated account email" icon={FiUser} />
          <SummaryCard label="Phone" value={user.phone_number || 'Not set'} caption="Primary contact number" icon={FiPhone} />
          <SummaryCard label="Pickup stops" value={pickupStops.length ? pickupStops.join(', ') : 'Pending'} caption="Stops configured for your route" icon={FiTruck} />
          <SummaryCard label="Status" value={dashboard.currentStatus || (dashboard.availability ? 'Online' : 'Offline')} caption="Current driver and bus status" icon={FiMapPin} />
        </div>
      </div>
    </DriverLayout>
  );
}
