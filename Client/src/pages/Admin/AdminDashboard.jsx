import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBus, FaCalendarAlt, FaChartLine, FaCoins, FaMapMarkedAlt, FaUserFriends, FaUserTie, FaRegClock } from 'react-icons/fa';
import { toast } from 'react-toastify';
import SidebarLayout from '../../components/Layout/SidebarLayout';
import { fetchApi } from '../../api';
import { useNotifications } from '../../context/NotificationContext';

const emptyDashboard = {
  user: {},
  stats: {
    totalDrivers: 0,
    totalParents: 0,
    totalBuses: 0,
    totalRoutes: 0,
    activeBuses: 0,
    activeDrivers: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    todaysBookings: 0,
    revenue: 0,
  },
  recentBookings: [],
  recentBuses: [],
  recentRoutes: [],
};

const statMeta = [
  { key: 'totalDrivers', label: 'Drivers', icon: FaUserTie, tone: 'bg-blue-50 text-blue-600 border-blue-100' },
  { key: 'totalParents', label: 'Parents', icon: FaUserFriends, tone: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { key: 'totalBuses', label: 'Buses', icon: FaBus, tone: 'bg-violet-50 text-violet-600 border-violet-100' },
  { key: 'totalRoutes', label: 'Routes', icon: FaMapMarkedAlt, tone: 'bg-amber-50 text-amber-600 border-amber-100' },
  { key: 'activeBuses', label: 'Active buses', icon: FaBus, tone: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
  { key: 'activeDrivers', label: 'Active drivers', icon: FaUserTie, tone: 'bg-slate-50 text-slate-600 border-slate-200' },
  { key: 'totalBookings', label: 'Total bookings', icon: FaCalendarAlt, tone: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  { key: 'pendingBookings', label: 'Pending bookings', icon: FaRegClock, tone: 'bg-orange-50 text-orange-600 border-orange-100' },
  { key: 'completedBookings', label: 'Completed bookings', icon: FaChartLine, tone: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { key: 'todaysBookings', label: "Today's bookings", icon: FaCalendarAlt, tone: 'bg-rose-50 text-rose-600 border-rose-100' },
  { key: 'revenue', label: 'Revenue', icon: FaCoins, tone: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
];

const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value || 0);

function StatTile({ item, value }) {
  const Icon = item.icon;
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] text-left">
      <div className="flex items-center gap-4">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl border ${item.tone}`}>
          <Icon className="text-lg" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
          <div className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            {item.key === 'revenue' ? `₹${formatCurrency(value)}` : value}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { socket, refreshNotifications } = useNotifications();
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
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
        throw new Error(data?.message || 'Failed to load admin dashboard.');
      }

      setDashboard(data.data || emptyDashboard);
      setError('');
    } catch (loadError) {
      const message = loadError.message || 'Failed to load admin dashboard.';
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

  const stats = dashboard.stats || emptyDashboard.stats;
  const recentBookings = dashboard.recentBookings || [];
  const recentBuses = dashboard.recentBuses || [];
  const recentRoutes = dashboard.recentRoutes || [];

  const managementActions = useMemo(() => ([
    { title: 'Manage buses', description: 'Review fleet, seats, and tracking.', path: '/admin/buses' },
    { title: 'Manage routes', description: 'Create, update, and assign routes.', path: '/admin/routes' },
    { title: 'Manage bookings', description: 'Approve, cancel, and audit ride requests.', path: '/admin/bookings' },
    { title: 'Payment records', description: 'Review collected revenue and settlements.', path: '/admin/payments' },
    { title: 'Tracking board', description: 'Inspect live GPS updates and route movement.', path: '/admin/tracking' },
  ]), []);

  return (
    <SidebarLayout>
      <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-slate-50 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-6 lg:p-8 text-left">
        <section className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-blue-600">Admin command center</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Operational overview for SchoolRide
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Monitor drivers, parents, buses, routes, bookings, and live revenue from one panel.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={loadDashboard} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800">
                Refresh metrics
              </button>
              <button onClick={() => navigate('/admin/bookings')} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-700">
                Open bookings
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Total revenue</p>
              <div className="mt-2 text-3xl font-black text-slate-900">₹{formatCurrency(stats.revenue)}</div>
              <p className="mt-1 text-xs text-slate-500">Paid payments captured from the active fleet.</p>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Live activity</p>
              <div className="mt-2 text-3xl font-black text-slate-900">{stats.activeBuses} / {stats.totalBuses}</div>
              <p className="mt-1 text-xs text-slate-500">Active buses and drivers currently online.</p>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 11 }).map((_, index) => (
              <div key={index} className="h-28 rounded-[1.75rem] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)] animate-pulse" />
            ))}
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statMeta.map((item) => (
              <StatTile key={item.key} item={item} value={stats[item.key] ?? 0} />
            ))}
          </section>
        )}

        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Management</p>
                <h2 className="mt-2 text-xl font-black text-slate-900">Control panel</h2>
              </div>
              <FaChartLine className="text-slate-400" />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {managementActions.map((action) => (
                <button
                  key={action.path}
                  type="button"
                  onClick={() => navigate(action.path)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition-all hover:border-blue-200 hover:bg-blue-50"
                >
                  <div className="text-sm font-black text-slate-900">{action.title}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">{action.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Snapshot</p>
                <h2 className="mt-2 text-xl font-black text-slate-900">Latest platform state</h2>
              </div>
              <FaBus className="text-slate-400" />
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Recent buses</div>
                <div className="mt-3 space-y-2">
                  {recentBuses.length ? recentBuses.slice(0, 3).map((bus) => (
                    <div key={bus._id || bus.busNumber} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm">
                      <div>
                        <div className="font-bold text-slate-900">{bus.busNumber || 'Bus'}</div>
                        <div className="text-xs text-slate-500">{bus.routeName || 'Route pending'}</div>
                      </div>
                      <div className="text-xs font-bold text-slate-500">{bus.totalSeats || 0} seats</div>
                    </div>
                  )) : (
                    <div className="rounded-2xl bg-white px-4 py-5 text-center text-sm text-slate-500">No buses yet.</div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Recent routes</div>
                <div className="mt-3 space-y-2">
                  {recentRoutes.length ? recentRoutes.slice(0, 3).map((route) => (
                    <div key={route._id} className="rounded-2xl bg-white px-4 py-3 text-sm">
                      <div className="font-bold text-slate-900">{route.start_location} → {route.end_location}</div>
                      <div className="mt-1 text-xs text-slate-500">{route.driver?.name || 'Driver pending'} • {route.distance_km || 0} km</div>
                    </div>
                  )) : (
                    <div className="rounded-2xl bg-white px-4 py-5 text-center text-sm text-slate-500">No routes yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Bookings</p>
              <h2 className="mt-2 text-xl font-black text-slate-900">Latest requests</h2>
            </div>
            <FaCalendarAlt className="text-slate-400" />
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {recentBookings.length ? recentBookings.map((booking) => (
              <div key={booking.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-slate-900">{booking.childName || booking.student?.name || 'Booking'}</div>
                    <div className="mt-1 text-xs text-slate-500">{booking.pickupStop || booking.pickupPoint || 'Pickup'} → {booking.dropStop || booking.dropPoint || 'Drop'}</div>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-600">
                    {booking.bookingStatus || booking.status || 'Pending'}
                  </span>
                </div>
                <div className="mt-3 text-xs text-slate-500">Updated {new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(booking.updatedAt))}</div>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500 lg:col-span-2 xl:col-span-3">
                No bookings available yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </SidebarLayout>
  );
}
