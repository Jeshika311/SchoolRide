import { FiBell, FiBookOpen, FiDollarSign, FiLogOut, FiMapPin, FiMenu, FiTruck, FiUser, FiHome } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', icon: FiHome, path: '/driver/dashboard' },
  { label: 'Ride Management', icon: FiTruck, path: '/driver/rides' },
  { label: 'Live Tracking', icon: FiMapPin, path: '/driver/tracking' },
  { label: 'Notifications', icon: FiBell, path: '/driver/notifications' },
  { label: 'Booking History', icon: FiBookOpen, path: '/driver/history' },
  { label: 'Earnings & Payments', icon: FiDollarSign, path: '/driver/earnings' },
  { label: 'Profile', icon: FiUser, path: '/driver/profile' },
];

export default function DriverLayout({ title, subtitle, children, summary, actions, availability, onAvailabilityToggle, availabilityLoading, onLogout, activePath = '/driver/dashboard' }) {
  const navigate = useNavigate();
  const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
  const initials = (authUser?.name || 'D')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-slate-200 bg-white px-4 py-4 shadow-sm lg:min-h-screen lg:w-[19rem] lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
          <div className="flex min-w-0 items-center gap-3 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-xl font-black text-white shadow-lg shadow-blue-500/20">
              {authUser?.profile_photo ? (
                <img src={authUser.profile_photo} alt={authUser?.name || 'Driver'} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-blue-600">Driver Panel</p>
              <div className="text-lg font-black leading-tight text-slate-900">{authUser?.name || 'Driver'}</div>
              <div className="truncate text-xs text-slate-500">{authUser?.email || 'No email linked'}</div>
            </div>
          </div>

          <nav className="mt-5 grid gap-2 lg:mt-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePath === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 text-left font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isActive
                    ? 'border-blue-500 bg-blue-600 text-white shadow-[0_10px_24px_rgba(37,99,235,0.18)]'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`text-lg transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-5 flex flex-wrap gap-2 lg:mt-6">
            <button
              type="button"
              onClick={onAvailabilityToggle}
              disabled={availabilityLoading}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70 ${availability
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FiMenu className={availability ? 'text-emerald-600' : 'text-slate-400'} />
              <span className="font-semibold tracking-wide">
                {availabilityLoading ? 'Updating...' : availability ? 'Online' : 'Offline'}
              </span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 focus-visible:outline-none"
            >
              <FiLogOut />
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          <header className="rounded-[2rem] border border-slate-200 bg-white p-5 text-left shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-600">Driver Console</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
                <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500 sm:text-sm">{subtitle}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">{actions}</div>
            </div>
          </header>

          {summary && <section className="mt-4">{summary}</section>}

          <section className="mt-4">{children}</section>
        </main>
      </div>
    </div>
  );
}
