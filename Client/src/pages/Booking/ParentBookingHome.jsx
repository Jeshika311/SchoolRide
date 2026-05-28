import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfilePage from '../Profile/ProfilePage';
import NotificationBell from '../../components/Notification/NotificationBell';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaHome, FaSchool, FaClock, FaBus, FaPhoneAlt, FaShieldAlt, FaUser, FaLocationArrow } from 'react-icons/fa';

export default function ParentBookingHome() {
  const navigate = useNavigate();
  const [user] = useState(() => {
    return JSON.parse(localStorage.getItem('authUser') || 'null');
  });
  
  const [schoolName, setSchoolName] = useState(() => {
    const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');
    return profileData.school_name || 'St. Xavier School';
  });

  const [booking] = useState({
    fromAddress: '123 Raj Nagar, ABC Apartments',
    pickupTime: '7:30 AM',
  });

  const [assignedVan] = useState({
    vanNumber: 'PB65 AB 2451',
    driverName: 'Rajesh Kumar',
    driverPhone: '9876543210',
    vanType: 'Van',
  });

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  // Initialize monitoring map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const schoolCoords = [30.7390, 76.7820]; // Mock school (Sector 17)
    const homeCoords = [30.7046, 76.7179]; // Mock home (Sector 66 Mohali)
    const busCoords = [30.7200, 76.7550]; // Current mock bus location

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      scrollWheelZoom: false
    }).setView(busCoords, 12);

    L.tileLayer('https://{s].basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    }).addTo(map);

    // Custom icons
    const homeIcon = L.divIcon({
      className: 'parent-map-home-pin',
      html: `<div style="width: 14px; height: 14px; background: #6366f1; border: 2.5px solid #fff; border-radius: 50%;"></div>`,
      iconSize: [14, 14]
    });

    const schoolIcon = L.divIcon({
      className: 'parent-map-school-pin',
      html: `<div style="width: 14px; height: 14px; background: #10b981; border: 2.5px solid #fff; border-radius: 50%;"></div>`,
      iconSize: [14, 14]
    });

    const busIcon = L.divIcon({
      className: 'parent-map-bus-pin',
      html: `
        <div style="position: relative; width: 35px; height: 35px; background: rgba(245, 158, 11, 0.25); border: 2px solid #f59e0b; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px #f59e0b; animation: pulse 2s infinite;">
          <div style="width: 10px; height: 10px; background: #f59e0b; border-radius: 50%;"></div>
        </div>
      `,
      iconSize: [35, 35]
    });

    L.marker(homeCoords, { icon: homeIcon }).addTo(map).bindPopup("<b>Home Pickup</b>");
    L.marker(schoolCoords, { icon: schoolIcon }).addTo(map).bindPopup(`<b>School:</b> ${schoolName}`);
    L.marker(busCoords, { icon: busIcon }).addTo(map).bindPopup("<b>Child's Shuttle</b><br>Live En Route");

    // Route Polyline
    L.polyline([homeCoords, busCoords, schoolCoords], {
      color: '#6366f1',
      weight: 3,
      opacity: 0.6,
      dashArray: '5, 5'
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [schoolName]);

  const handleLogout = () => {
    localStorage.removeItem('authUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('termsAccepted');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#05070F] text-slate-100 font-sans flex flex-col md:flex-row antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-[#090D1F] border-b md:border-b-0 md:border-r border-slate-800/80 p-6 flex flex-col justify-between md:h-screen md:sticky md:top-0">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg">
              <FaBus size={22} />
            </div>
            <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
              SchoolRide
            </span>
          </div>

          <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800/80 flex items-center gap-3">
            <div className="p-2 bg-indigo-950 rounded-lg text-indigo-400 border border-indigo-900/50">
              <FaShieldAlt size={18} />
            </div>
            <div className="overflow-hidden text-left">
              <h4 className="font-semibold text-xs truncate text-slate-200">{user?.name || 'Parent'}</h4>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-400">Parent Monitoring</span>
            </div>
          </div>

          <nav className="space-y-1 text-left text-sm font-semibold text-slate-400">
            <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-indigo-600/90 text-white border border-indigo-500">
              <FaHome />
              Dashboard
            </button>
            <button onClick={() => navigate('/buses')} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-slate-800/50 hover:text-white transition-colors">
              <FaBus />
              Available Buses
            </button>
            <button onClick={() => navigate('/history')} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-slate-800/50 hover:text-white transition-colors">
              <FaClock />
              Booking History
            </button>
          </nav>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:bg-rose-950/20 hover:text-rose-400 rounded-xl text-sm font-semibold transition-all border border-transparent hover:border-rose-900/40 mt-6"
        >
          Sign Out
        </button>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 border-b border-slate-800/60 bg-[#090D1F]/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="text-left">
            <h2 className="text-xl font-bold text-white tracking-tight">Parent Command Station</h2>
            <p className="text-xs text-slate-400">Live safety monitoring of your child's school shuttle</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <button 
              onClick={() => setShowProfileDrawer(true)}
              className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-sm text-slate-200"
            >
              👤
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6 flex-grow">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left Column: Live Child Map (7 Cols) */}
            <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800/80 p-3 rounded-[2.5rem] h-[400px] lg:h-auto min-h-[400px] overflow-hidden relative shadow-2xl flex flex-col">
              <div className="absolute top-6 left-6 z-20 bg-slate-900/80 backdrop-blur-md border border-slate-800/60 px-4 py-2.5 rounded-2xl flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                <span className="text-xs font-bold text-slate-300">Active Transit Tracker</span>
              </div>
              
              <div ref={mapContainerRef} className="w-full flex-grow rounded-3xl z-10" style={{ background: '#0a0d16' }} />
            </div>

            {/* Right Column: Shuttle Details & Timelines (5 Cols) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Boarding Status Tracker */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 text-left space-y-6 shadow-xl">
                <h3 className="text-base font-extrabold text-white">Transit Boarding Progress</h3>

                <div className="relative pl-6 space-y-5">
                  <div className="absolute left-[7px] top-1.5 bottom-1.5 w-0.5 bg-indigo-900/50" />
                  
                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-[23px] w-4 h-4 rounded-full bg-indigo-500 border-4 border-[#05070F] shadow-sm" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-200">Departed Home</h4>
                      <p className="text-[10px] text-slate-500">Boarded at 7:32 AM · Scheduled 7:30 AM</p>
                    </div>
                  </div>

                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-[23px] w-4 h-4 rounded-full bg-indigo-500 border-4 border-[#05070F] shadow-sm" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-200">En Route</h4>
                      <p className="text-[10px] text-slate-500">Normal speed · No delay alerts</p>
                    </div>
                  </div>

                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-[23px] w-4 h-4 rounded-full bg-amber-500 border-4 border-[#05070F] animate-pulse" />
                    <div>
                      <h4 className="font-bold text-xs text-amber-400">Approaching Sector 17</h4>
                      <p className="text-[10px] text-slate-500">Live ETA: 8:12 AM (2.4 km remaining)</p>
                    </div>
                  </div>

                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-[23px] w-4 h-4 rounded-full bg-slate-800 border-4 border-[#05070F]" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-400">Arrived at School</h4>
                      <p className="text-[10px] text-slate-500">Scheduled 8:20 AM</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shuttle Driver Details Card */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 text-left space-y-4 shadow-xl">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <FaBus className="text-indigo-400" />
                  Assigned School Shuttle
                </h3>

                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/60 space-y-3">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 block uppercase">VAN REGISTRATION</span>
                    <span className="font-black text-sm text-slate-200 block mt-0.5">{assignedVan.vanNumber}</span>
                  </div>

                  <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 block uppercase">SHUTTLE CAPTAIN</span>
                      <span className="font-bold text-xs text-slate-200 mt-0.5 block">{assignedVan.driverName}</span>
                    </div>

                    <a 
                      href={`tel:${assignedVan.driverPhone}`}
                      className="p-2.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-400 border border-indigo-900/60 rounded-xl transition-colors"
                      title="Call Driver"
                    >
                      <FaPhoneAlt size={12} />
                    </a>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </main>

      {/* Profile Drawer Component Overlay */}
      {showProfileDrawer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end" onClick={() => setShowProfileDrawer(false)}>
          <div className="w-full max-w-md bg-[#090D1F] border-l border-slate-800 p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-6">
              <h3 className="text-lg font-bold text-white">Profile Details</h3>
              <button onClick={() => setShowProfileDrawer(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <ProfilePage />
          </div>
        </div>
      )}

    </div>
  );
}
