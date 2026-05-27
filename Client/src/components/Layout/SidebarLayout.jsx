import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  FaBus, 
  FaHistory, 
  FaMapMarkerAlt, 
  FaSignOutAlt, 
  FaThLarge, 
  FaUserGraduate, 
  FaUserShield,
  FaReceipt,
  FaSlidersH,
  FaBars,
  FaTimes
} from 'react-icons/fa';

export default function SidebarLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem('authUser') || '{}');
  const role = user.role || 'student';

  const handleLogout = () => {
    localStorage.removeItem('authUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('termsAccepted');
    navigate('/login', { replace: true });
  };

  const studentLinks = [
    { name: 'Dashboard', path: '/home', icon: FaThLarge },
    { name: 'Available Buses', path: '/buses', icon: FaBus },
    { name: 'Ride Status', path: '/ride-status', icon: FaMapMarkerAlt },
    { name: 'Booking History', path: '/history', icon: FaHistory },
  ];

  const adminLinks = [
    { name: 'Admin Dashboard', path: '/home', icon: FaThLarge },
    { name: 'Manage Buses', path: '/admin/buses', icon: FaSlidersH },
    { name: 'Manage Bookings', path: '/admin/bookings', icon: FaBus },
    { name: 'Payment Records', path: '/admin/payments', icon: FaReceipt },
    { name: 'Tracking Board', path: '/admin/tracking', icon: FaMapMarkerAlt },
  ];

  const activeLinks = role === 'admin' ? adminLinks : studentLinks;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#ffffff_56%,_#eef7ff_100%)] text-slate-900 flex flex-col md:flex-row antialiased">
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white/90 backdrop-blur-md border-b border-sky-100 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-sky-600 rounded-xl text-white shadow-lg shadow-sky-500/20">
            <FaBus className="animate-pulse" size={20} />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
            SchoolRide
          </span>
        </div>
        <button 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-500 hover:text-sky-700 transition-colors"
        >
          {mobileOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white/95 md:bg-white/90 backdrop-blur-xl border-r border-sky-100 p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen md:flex-shrink-0 shadow-[0_10px_40px_rgba(15,23,42,0.06)]
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Logo */}
          <div className="hidden md:flex items-center gap-3 mb-8">
            <div className="p-2 bg-sky-600 rounded-xl text-white shadow-lg shadow-sky-500/20">
              <FaBus size={22} />
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
              SchoolRide
            </span>
          </div>

          {/* Profile Quick Card */}
          <div className="flex items-center gap-3 p-3 bg-sky-50 rounded-xl border border-sky-100 mb-8">
            <div className="p-2.5 bg-white rounded-lg text-sky-600 border border-sky-100">
              {role === 'admin' ? <FaUserShield size={20} /> : <FaUserGraduate size={20} />}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-semibold text-sm truncate text-slate-900">{user.name || 'User'}</h4>
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-600">{role}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {activeLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group
                    ${isActive 
                      ? 'bg-sky-100 text-sky-800 shadow-sm border border-sky-200' 
                      : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                    }
                  `}
                >
                  <Icon className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-sky-700' : 'text-slate-500 group-hover:text-sky-500'}`} size={18} />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout Section */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-sm font-semibold transition-all duration-200 border border-transparent hover:border-rose-100"
        >
          <FaSignOutAlt size={18} />
          Sign Out
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen md:h-screen md:overflow-y-auto bg-transparent flex flex-col">
        {/* Top Header inside main content */}
        <header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-sky-100 bg-white/80 backdrop-blur-sm shadow-[0_1px_0_rgba(15,23,42,0.03)]">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {location.pathname === '/home' 
                ? `${role === 'admin' ? 'Admin Panel' : 'Student Hub'}` 
                : location.pathname.split('/').pop().replace('-', ' ').replace(/^\w/, c => c.toUpperCase())
              }
            </h2>
            <p className="text-xs text-slate-500">Welcome to your smart school transit dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
              System Live
            </span>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto text-slate-900 text-left">
          {children}
        </div>
      </main>
    </div>
  );
}
