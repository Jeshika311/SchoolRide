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
  FaTimes,
  FaCoins
} from 'react-icons/fa';

export default function SidebarLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem('authUser') || '{}');
  const role = user.role || 'student';
  const initials = (user?.name || 'U')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
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
    { name: 'Manage Routes', path: '/admin/routes', icon: FaMapMarkerAlt },
    { name: 'Manage Bookings', path: '/admin/bookings', icon: FaBus },
    { name: 'Payment Records', path: '/admin/payments', icon: FaReceipt },
    { name: 'Tracking Board', path: '/admin/tracking', icon: FaMapMarkerAlt },
  ];

  const activeLinks = role === 'admin' ? adminLinks : studentLinks;

  // Adapt link names to match screenshot for student
  const displayLinks = role === 'admin' ? activeLinks : [
    { name: 'Dashboard', path: '/home', icon: FaThLarge },
    { name: 'Book Ride', path: '/buses', icon: FaBus },
    { name: 'My Rides', path: '/history', icon: FaHistory },
    { name: 'Wallet', path: '/home', icon: FaCoins },
    { name: 'Safety', path: '/ride-status', icon: FaMapMarkerAlt }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row antialiased">
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/20">
            <FaBus size={18} />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900">
            SchoolRide
          </span>
        </div>
        <button 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-500 hover:text-slate-800 transition-colors"
        >
          {mobileOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen md:flex-shrink-0 shadow-sm
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Logo */}
          <div className="hidden md:flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/20">
              <FaBus size={20} />
            </div>
            <span className="font-black text-2xl tracking-tight text-slate-900">
              SchoolRide
            </span>
          </div>

          {/* Profile Quick Card - Logged in user details */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl mb-8">
            <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-blue-500 bg-gradient-to-br from-blue-500 to-cyan-400 text-white flex items-center justify-center font-black shadow-sm">
              {user?.profile_photo ? (
                <img
                  src={user.profile_photo}
                  alt={user?.name || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs">{initials}</span>
              )}
            </div>
            <div className="overflow-hidden text-left min-w-0">
              <h4 className="font-bold text-sm truncate text-slate-900">{user?.name || 'Signed in user'}</h4>
              <p className="text-[11px] text-slate-500 truncate">{user?.email || 'No email linked'}</p>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-blue-600 block mt-0.5">
                {String(role).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {displayLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path && (link.name !== 'Wallet' || location.pathname === '/wallet');
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group
                    ${isActive 
                      ? 'bg-blue-600 !text-white border-none shadow-md shadow-blue-500/20' 
                      : '!text-slate-600 hover:!text-slate-900 border border-transparent'
                    }
                  `}
                >
                  <Icon className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? '!text-white' : '!text-slate-500 group-hover:!text-slate-800'}`} size={16} />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout Section */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 !text-slate-600 hover:!text-slate-900 rounded-xl text-sm font-bold transition-all duration-200"
        >
          <FaSignOutAlt size={18} />
          Sign Out
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen md:h-screen md:overflow-y-auto bg-transparent flex flex-col">
        {/* Content Wrapper */}
        <div className="flex-1 overflow-y-auto text-slate-900 text-left relative">
          {children}
        </div>
      </main>
    </div>
  );
}
