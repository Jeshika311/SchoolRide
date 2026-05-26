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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/30">
            <FaBus className="animate-pulse" size={20} />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
            SchoolRide
          </span>
        </div>
        <button 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          {mobileOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-950/90 md:bg-slate-950/40 backdrop-blur-xl border-r border-slate-800/80 p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen md:flex-shrink-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Logo */}
          <div className="hidden md:flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/30">
              <FaBus size={22} />
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              SchoolRide
            </span>
          </div>

          {/* Profile Quick Card */}
          <div className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800/50 mb-8">
            <div className="p-2.5 bg-slate-800 rounded-lg text-blue-400">
              {role === 'admin' ? <FaUserShield size={20} /> : <FaUserGraduate size={20} />}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-semibold text-sm truncate text-slate-200">{user.name || 'User'}</h4>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-500">{role}</span>
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
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                    }
                  `}
                >
                  <Icon className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} size={18} />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout Section */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl text-sm font-semibold transition-all duration-200"
        >
          <FaSignOutAlt size={18} />
          Sign Out
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen md:h-screen md:overflow-y-auto bg-slate-900 flex flex-col">
        {/* Top Header inside main content */}
        <header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-slate-800/80 bg-slate-950/20 backdrop-blur-sm">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {location.pathname === '/home' 
                ? `${role === 'admin' ? 'Admin Panel' : 'Student Hub'}` 
                : location.pathname.split('/').pop().replace('-', ' ').replace(/^\w/, c => c.toUpperCase())
              }
            </h2>
            <p className="text-xs text-slate-400">Welcome to your smart school transit dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700/50">
              System Live
            </span>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
