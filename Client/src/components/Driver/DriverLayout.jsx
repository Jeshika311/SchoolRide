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
    <div className="min-h-screen bg-[#070A13] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.18),rgba(255,255,255,0))] text-slate-100 antialiased">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-slate-800/60 bg-[#090D1F]/90 px-4 py-4 backdrop-blur-xl lg:min-h-screen lg:w-[19rem] lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
          <div className="flex min-w-0 items-center gap-3 rounded-[1.75rem] border border-slate-800/80 bg-slate-900/50 p-4 shadow-lg">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 text-xl font-black text-white shadow-lg shadow-indigo-500/20">
              D
            </div>
            <div className="min-w-0 text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-indigo-400">Driver Panel</p>
              <div className="text-lg font-black leading-tight text-white">SchoolRide</div>
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
                  className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 text-left font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${isActive
                    ? 'bg-indigo-600/90 text-white border-indigo-500 shadow-[0_10px_24px_rgba(99,102,241,0.2)]'
                    : 'bg-slate-900/40 text-slate-400 border-slate-800/80 hover:bg-slate-800/40 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <Icon className={`text-lg transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                  <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-5 flex flex-wrap gap-2 lg:mt-6">
            <button
              type="button"
              onClick={onAvailabilityToggle}
              disabled={availabilityLoading}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-70 ${availability
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_10px_24px_rgba(16,185,129,0.1)] hover:bg-emerald-500/25'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/40'
              }`}
            >
              <FiMenu className={availability ? 'text-emerald-400' : 'text-slate-400'} />
              <span className={`font-semibold tracking-wide ${availability ? 'text-emerald-400' : 'text-slate-400'}`}>
                {availabilityLoading ? 'Updating...' : availability ? 'Online' : 'Offline'}
              </span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-900/40 bg-rose-950/20 px-4 py-3 text-xs font-bold text-rose-400 transition-colors hover:bg-rose-900/25 focus-visible:outline-none"
            >
              <FiLogOut />
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          <header className="rounded-[2rem] border border-slate-800/60 bg-[#090D1F]/80 p-5 shadow-2xl backdrop-blur-xl sm:p-6 text-left">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400">Driver Console</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-4xl">{title}</h2>
                <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-400 sm:text-sm">{subtitle}</p>
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