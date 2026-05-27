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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.22),_transparent_30%),linear-gradient(180deg,_#eff6ff_0%,_#f8fafc_42%,_#ffffff_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-slate-200/70 bg-white/85 px-4 py-4 backdrop-blur-xl lg:min-h-screen lg:w-[19rem] lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
          <div className="flex min-w-0 items-center gap-3 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-xl font-black text-white shadow-lg shadow-blue-200">
              D
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-blue-600">Driver Panel</p>
              <div className="text-lg font-black leading-tight text-slate-900">SchoolRide</div>
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
                  className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 text-left font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${isActive
                    ? '!bg-blue-100 !text-blue-900 border-blue-300 shadow-[0_10px_24px_rgba(59,130,246,0.14)]'
                    : '!bg-white !text-slate-700 border-slate-200 hover:!bg-slate-50 hover:!text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`text-lg transition-colors ${isActive ? 'text-blue-700' : 'text-slate-600 group-hover:text-slate-800'}`} />
                  <span className={`${isActive ? 'text-blue-900' : 'text-slate-700 group-hover:text-slate-900'}`}>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-5 flex flex-wrap gap-2 lg:mt-6">
            <button
              type="button"
              onClick={onAvailabilityToggle}
              disabled={availabilityLoading}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-70 ${availability
                ? '!bg-emerald-100 !text-emerald-900 border-emerald-300 shadow-[0_10px_24px_rgba(16,185,129,0.14)] hover:!bg-emerald-200'
                : '!bg-slate-200 !text-slate-900 border-slate-300 shadow-[0_10px_24px_rgba(100,116,139,0.14)] hover:!bg-slate-300'
              }`}
            >
              <FiMenu className={availability ? 'text-emerald-800' : 'text-slate-700'} />
              <span className={`font-semibold tracking-wide ${availability ? 'text-emerald-900' : 'text-slate-900'}`}>
                {availabilityLoading ? 'Updating...' : availability ? 'Online' : 'Offline'}
              </span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 !bg-rose-50 px-4 py-3 text-sm font-bold !text-rose-700 transition-colors hover:!bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              <FiLogOut />
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          <header className="rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">Driver Dashboard</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{subtitle}</p>
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