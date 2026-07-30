import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaBus, FaCalendarCheck, FaChevronRight, FaClock, FaMapMarkerAlt, FaRegUserCircle, FaSearch, FaSpinner, FaUser } from 'react-icons/fa';
import { toast } from 'react-toastify';
import SidebarLayout from '../../components/Layout/SidebarLayout';
import { fetchApi } from '../../api';
import { useNotifications } from '../../context/NotificationContext';

const emptyDashboard = {
  user: {},
  roleProfile: null,
  notifications: [],
  stats: {
    totalRides: 0,
    confirmedRides: 0,
    pendingRides: 0,
    cancelledRides: 0,
    unreadNotifications: 0,
  },
  dashboard: {
    welcomeName: '',
    welcomeRole: '',
    upcomingRide: null,
    assignedBus: null,
    routeInfo: null,
    rideSummary: null,
    wallet: { balance: 0, lastActivity: null },
    liveBus: null,
    recentActivity: [],
    liveBuses: [],
    availableRoutes: [],
  },
};

function formatDateTime(value) {
  if (!value) return 'Not updated yet';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function StatPill({ label, value, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 ${tones[tone]}`}>
      <div className="text-[10px] font-bold uppercase tracking-[0.24em] opacity-70">{label}</div>
      <div className="mt-1 text-lg font-black">{value}</div>
    </div>
  );
}

function DetailCard({ icon: Icon, title, value, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-[1.75rem] border border-slate-200 bg-white px-5 py-4 text-left shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:border-blue-200"
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-50 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600">
        <Icon className="text-lg" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-slate-500">{title}</div>
        <div className="mt-1 truncate text-lg font-black text-slate-900">{value}</div>
        <div className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</div>
      </div>
      <FaChevronRight className="text-slate-300 group-hover:text-blue-500" />
    </button>
  );
}

export default function UnifiedDashboard({ mode = 'student' }) {
  const navigate = useNavigate();
  const { socket, unreadCount, refreshNotifications } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const { status, data } = await fetchApi('/user/dashboard-overview');

      if (status === 401) {
        navigate('/login', { replace: true });
        return;
      }

      if (status !== 200 || !data?.success) {
        throw new Error(data?.message || 'Unable to load dashboard.');
      }

      setDashboard(data.data || emptyDashboard);
      setError('');
    } catch (loadError) {
      const message = loadError.message || 'Unable to load dashboard.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const handleDashboardUpdated = () => {
      loadDashboard().catch(() => {});
      refreshNotifications().catch(() => {});
    };

    socket.on('dashboard_updated', handleDashboardUpdated);
    return () => {
      socket.off('dashboard_updated', handleDashboardUpdated);
    };
  }, [socket]);

  const user = dashboard.user || emptyDashboard.user;
  const home = dashboard.dashboard || emptyDashboard.dashboard;
  const rideSummary = home.rideSummary || {};
  const assignedBus = home.assignedBus || null;
  const routeInfo = home.routeInfo || null;
  const liveBus = home.liveBus || null;
  const notifications = dashboard.notifications || [];
  const recentActivity = home.recentActivity || [];

  const topActions = useMemo(() => ([
    { label: 'Bookings', icon: FaCalendarCheck, onClick: () => navigate('/history') },
    { label: 'Tracking', icon: FaSearch, onClick: () => navigate(assignedBus?._id ? `/track/${assignedBus._id}` : '/buses') },
    { label: 'Profile', icon: FaUser, onClick: () => navigate('/profile') },
  ]), [navigate, assignedBus]);

  if (loading) {
    return (
      <SidebarLayout>
        <div className="min-h-[calc(100vh-2rem)] rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <div className="animate-pulse space-y-5">
            <div className="h-10 w-56 rounded-full bg-slate-200" />
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="h-[320px] rounded-[2rem] bg-slate-100" />
              <div className="h-[320px] rounded-[2rem] bg-slate-100" />
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout>
        <div className="min-h-[calc(100vh-2rem)] grid place-items-center rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <div className="max-w-lg rounded-[2rem] border border-rose-100 bg-rose-50 p-8 text-center">
            <p className="text-lg font-black text-rose-700">{error}</p>
            <button onClick={loadDashboard} className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800">
              Retry
            </button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const rideTitle = rideSummary.fromLabel || 'From Home';
  const rideDestinationTitle = rideSummary.toLabel || 'To School';
  const bookingMessage = assignedBus ? `${assignedBus.busNumber || assignedBus.vehicle_number || 'Assigned bus'} is linked to your current ride.` : 'No route has been assigned yet.';

  return (
    <SidebarLayout>
      <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-[#f7faff] p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-6 lg:p-8">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4 text-left">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-orange-200 to-orange-300 text-slate-700 shadow-sm">
              {user.profile_photo ? (
                <img src={user.profile_photo} alt={user.name || 'User'} className="h-full w-full rounded-full object-cover" />
              ) : (
                <FaRegUserCircle className="text-3xl" />
              )}
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight text-slate-900">Hello {user.name || home.welcomeName || 'there'},</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">Book Your School Ride</p>
              <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">{user.email || 'No email linked'} • {String(user.role || mode).toUpperCase()}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 self-end lg:self-auto">
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="grid h-16 w-16 place-items-center rounded-2xl border border-slate-200 bg-white text-blue-600 shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition-transform hover:-translate-y-0.5"
              aria-label="Notifications"
            >
              <div className="relative">
                <FaBell className="text-2xl" />
                <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-[10px] font-black text-white">{unreadCount}</span>
              </div>
            </button>

            {topActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className="flex flex-col items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:text-blue-600"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-500 shadow-sm">
                    <Icon className="text-lg" />
                  </span>
                  {action.label}
                </button>
              );
            })}
          </div>
        </header>

        <main className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-4">
            <div className="text-left">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Where do You Go Today?</h2>
            </div>

            <div className="space-y-4">
              <DetailCard
                icon={FaMapMarkerAlt}
                title={rideTitle}
                value={rideSummary.fromAddress || rideSummary.pickupAddress || 'Pickup location pending'}
                subtitle="Pickup address and source location"
                onClick={() => navigate('/buses')}
              />
              <DetailCard
                icon={FaBus}
                title={rideDestinationTitle}
                value={rideSummary.toAddress || rideSummary.destinationAddress || 'School destination pending'}
                subtitle="Destination and assigned ride endpoint"
                onClick={() => navigate('/history')}
              />
              <DetailCard
                icon={FaClock}
                title="Pickup Time"
                value={rideSummary.pickupTime || 'Pending'}
                subtitle="Latest booking or assignment timestamp"
                onClick={() => navigate('/history')}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <StatPill label="Wallet" value={`₹${home.wallet?.balance || 0}`} tone="emerald" />
              <StatPill label="Notifications" value={notifications.length} tone="blue" />
              <StatPill label="Live Bus" value={liveBus ? 'Active' : 'Pending'} tone="amber" />
            </div>
          </section>

          <section className="space-y-4">
            <div className="text-left">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Your Van:</h2>
            </div>

            <div className="rounded-[2rem] border border-blue-200 bg-gradient-to-br from-blue-100 to-blue-200 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] text-left">
              <div className="flex items-start gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm">
                  <FaBus className="text-3xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-black text-slate-900">{assignedBus?.busNumber || assignedBus?.vehicle_number || 'No route has been assigned yet.'}</p>
                  <p className="mt-2 text-sm text-slate-700">{bookingMessage}</p>
                  <p className="mt-3 text-sm font-semibold text-slate-800">
                    Driver : {assignedBus?.driver?.name || routeInfo?.driver?.name || home.liveBus?.driver?.name || 'Pending assignment'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 text-left shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Assigned route</p>
                <div className="mt-2 text-lg font-black text-slate-900">{routeInfo?.route_name || routeInfo?.start_location || 'Pending'}</div>
                <p className="mt-2 text-xs text-slate-500">
                  {routeInfo?.start_location ? `${routeInfo.start_location} → ${routeInfo.end_location}` : 'Route details will appear here once assigned.'}
                </p>
              </div>
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 text-left shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Live bus</p>
                <div className="mt-2 text-lg font-black text-slate-900">{liveBus?.busNumber || 'Pending'}</div>
                <p className="mt-2 text-xs text-slate-500">
                  {liveBus ? `${liveBus.currentLocation?.lat || 0}, ${liveBus.currentLocation?.lng || 0}` : 'Live coordinates appear when the bus starts moving.'}
                </p>
              </div>
            </div>
          </section>
        </main>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] text-left">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Recent activity</p>
                <h3 className="mt-2 text-xl font-black text-slate-900">Ride timeline</h3>
              </div>
              <FaCalendarCheck className="text-slate-400" />
            </div>
            <div className="mt-4 space-y-3">
              {recentActivity.length ? recentActivity.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{item.childName || item.student?.name || item.parent?.name || 'Ride request'}</div>
                      <div className="mt-1 text-xs text-slate-500">{item.pickupStop || item.pickupPoint || 'Pickup'} → {item.dropStop || item.dropPoint || 'Destination'}</div>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-600">
                      {item.bookingStatus || item.status || 'Pending'}
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-slate-500">Updated {formatDateTime(item.updatedAt)}</div>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No ride history yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] text-left">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Notifications</p>
                <h3 className="mt-2 text-xl font-black text-slate-900">Recent alerts</h3>
              </div>
              <FaBell className="text-slate-400" />
            </div>

            <div className="mt-4 space-y-3">
              {notifications.length ? notifications.slice(0, 4).map((note) => (
                <div key={note._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-bold text-slate-900">{note.title}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">{note.message}</div>
                  <div className="mt-2 text-[11px] text-slate-400">{formatDateTime(note.createdAt)}</div>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No notifications yet.
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="flex justify-center pt-2">
          <button
            onClick={() => navigate('/buses')}
            className="min-w-[300px] rounded-[1.75rem] bg-slate-900 px-6 py-4 text-base font-black text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] transition-transform hover:-translate-y-0.5"
          >
            Confirm Ride
          </button>
        </div>
      </div>
    </SidebarLayout>
  );
}
