import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfilePage from '../Profile/ProfilePage';
import NotificationBell from '../../components/Notification/NotificationBell';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaHome, FaSchool, FaClock, FaBus, FaPhoneAlt, FaShieldAlt, FaUser, FaLocationArrow, FaSignOutAlt } from 'react-icons/fa';
import { fetchApi } from '../../api';
import './ParentBookingHome.css';

export default function ParentBookingHome() {
  const navigate = useNavigate();
  const [user] = useState(() => {
    return JSON.parse(localStorage.getItem('authUser') || 'null');
  });

  const storedProfileData = JSON.parse(localStorage.getItem('profileData') || '{}');
  const [schoolName, setSchoolName] = useState(() => {
    return storedProfileData.school_name || 'St. Xavier School';
  });

  const [booking, setBooking] = useState(() => {
    return {
      from: 'Source',
      fromAddress: storedProfileData.pickup_address || '123 Raj Nagar, ABC Apartments',
      to: 'Destination',
      toName: storedProfileData.drop_address || storedProfileData.school_name || 'St. Xavier School',
      pickupTime: '7:30 AM',
    };
  });

  const [assignedVan, setAssignedVan] = useState({
    vanNumber: 'PB65 AB 2451',
    driverName: 'Rajesh Kumar',
    driverPhone: '9876543210',
    vanType: 'Van',
  });

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  const normalizeText = (value = '') => value.toString().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  const findMatchingRoute = (routes = [], busRouteName = '', pickupStop = '', dropStop = '', pickupAddress = '', dropAddress = '') => {
    const normalizedBusRoute = normalizeText(busRouteName);
    const normalizedPickup = normalizeText(pickupStop || pickupAddress);
    const normalizedDrop = normalizeText(dropStop || dropAddress);

    return routes.find((route) => {
      const routeStart = normalizeText(route.start_location);
      const routeEnd = normalizeText(route.end_location);
      const routeStops = normalizeText(Array.isArray(route.stops) ? route.stops.join(' ') : '');

      const directMatch = normalizedBusRoute && routeStart && routeEnd
        && normalizedBusRoute.includes(routeStart)
        && normalizedBusRoute.includes(routeEnd);

      const pickupDropMatch = normalizedPickup && normalizedDrop
        && routeStart.includes(normalizedPickup)
        && routeEnd.includes(normalizedDrop);

      const stopMatch = routeStops
        && normalizedPickup
        && normalizedDrop
        && routeStops.includes(normalizedPickup)
        && routeStops.includes(normalizedDrop);

      return directMatch || pickupDropMatch || stopMatch;
    });
  };

  useEffect(() => {
    const loadRideDetails = async () => {
      try {
        const latestProfileData = JSON.parse(localStorage.getItem('profileData') || '{}');
        const [bookingsRes, routesRes] = await Promise.all([
          fetchApi('/bookings/my-bookings'),
          fetchApi('/routes')
        ]);

        const bookings = bookingsRes.status === 200 ? (bookingsRes.data.data || []) : [];
        const currentBooking = bookings.find((item) => item.bookingStatus !== 'Cancelled') || bookings[0] || null;
        const routes = routesRes.status === 200 ? (routesRes.data.data || []) : [];

        if (!currentBooking) {
          return;
        }

        const bookingBus = currentBooking.busId || {};
        const matchedRoute = findMatchingRoute(
          routes,
          bookingBus.routeName || '',
          currentBooking.pickupStop || '',
          currentBooking.dropStop || '',
          latestProfileData.pickup_address || '',
          latestProfileData.drop_address || ''
        );

        const resolvedFromAddress = currentBooking.pickupStop || latestProfileData.pickup_address || bookingBus.routeName || 'Source';
        const resolvedToAddress = currentBooking.dropStop || latestProfileData.drop_address || schoolName || latestProfileData.school_name || 'Destination';
        const resolvedPickupTime = currentBooking.bookingStatus === 'Confirmed' ? 'Confirmed booking' : 'Pending confirmation';
        const resolvedDriverName = matchedRoute?.driver?.name || matchedRoute?.driver?.full_name || 'Assigned Driver';

        setBooking((previous) => ({
          ...previous,
          from: 'Source',
          fromAddress: resolvedFromAddress,
          to: 'Destination',
          toName: resolvedToAddress,
          pickupTime: resolvedPickupTime,
        }));

        setAssignedVan({
          vanNumber: bookingBus.busNumber || 'Pending booking',
          driverName: resolvedDriverName,
          driverPhone: matchedRoute?.driver?.phone || matchedRoute?.driver?.contact_number || '9876543210',
          vanType: bookingBus.routeName || 'Van',
        });

        localStorage.setItem('currentBooking', JSON.stringify({
          ...currentBooking,
          sourceAddress: resolvedFromAddress,
          destinationAddress: resolvedToAddress,
          driverName: resolvedDriverName,
          vanNumber: bookingBus.busNumber || '',
        }));
      } catch (error) {
        console.error('Unable to load ride details:', error);
      }
    };

    loadRideDetails();
  }, [schoolName]);

  // Listen for school name changes (when selected in ProfileCompletion)
  useEffect(() => {
    const handleStorageChange = () => {
      const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');
      if (profileData.school_name) {
        setSchoolName(profileData.school_name);
        // Update booking to reflect the updated school name
        setBooking(prev => ({
          ...prev,
          toName: profileData.school_name
        }));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event from same tab
    window.addEventListener('schoolNameUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('schoolNameUpdated', handleStorageChange);
    };
  }, []);

  const handleFromClick = () => {
    navigate('/buses');
  };

  const handleToClick = () => {
    navigate('/buses');
  };

  const handlePickupTimeClick = () => {
    navigate('/history');
  };

  const handleConfirmRide = () => {
    localStorage.setItem('currentBooking', JSON.stringify(booking));
    navigate('/history');
  };

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

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    }).addTo(map);

    // Custom icons
    const homeIcon = L.divIcon({
      className: 'parent-map-home-pin',
      html: `<div style="width: 14px; height: 14px; background: #2563eb; border: 2.5px solid #fff; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.15);"></div>`,
      iconSize: [14, 14]
    });

    const schoolIcon = L.divIcon({
      className: 'parent-map-school-pin',
      html: `<div style="width: 14px; height: 14px; background: #10b981; border: 2.5px solid #fff; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.15);"></div>`,
      iconSize: [14, 14]
    });

    const busIcon = L.divIcon({
      className: 'parent-map-bus-pin',
      html: `
        <div style="position: relative; width: 35px; height: 35px; background: rgba(59, 130, 246, 0.15); border: 2px solid #2563eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(37, 99, 235, 0.4); animation: pulse 2s infinite;">
          <div style="width: 10px; height: 10px; background: #2563eb; border-radius: 50%;"></div>
        </div>
      `,
      iconSize: [35, 35]
    });

    L.marker(homeCoords, { icon: homeIcon }).addTo(map).bindPopup("<b>Home Pickup</b>");
    L.marker(schoolCoords, { icon: schoolIcon }).addTo(map).bindPopup(`<b>School:</b> ${schoolName}`);
    L.marker(busCoords, { icon: busIcon }).addTo(map).bindPopup("<b>Child's Shuttle</b><br>Live En Route");

    // Route Polyline
    L.polyline([homeCoords, busCoords, schoolCoords], {
      color: '#2563eb',
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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col md:flex-row antialiased selection:bg-blue-500 selection:text-white">
      
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200/80 p-6 flex flex-col justify-between md:h-screen md:sticky md:top-0 shadow-sm">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/20">
              <FaBus size={22} />
            </div>
            <span className="font-black text-2xl tracking-tight text-slate-900">
              SchoolRide
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
              <FaShieldAlt size={18} />
            </div>
            <div className="overflow-hidden text-left">
              <h4 className="font-bold text-xs truncate text-slate-800">{user?.name || 'Parent'}</h4>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-blue-600 block mt-0.5">Parent Monitoring</span>
            </div>
          </div>

          <nav className="space-y-1 text-left text-sm font-bold">
            <button className="flex items-center gap-3.5 w-full px-4 py-3 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <FaHome size={16} />
              Dashboard
            </button>
            <button onClick={() => navigate('/buses')} className="flex items-center gap-3.5 w-full px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
              <FaBus size={16} />
              Available Buses
            </button>
            <button onClick={() => navigate('/history')} className="flex items-center gap-3.5 w-full px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
              <FaClock size={16} />
              Booking History
            </button>
          </nav>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3.5 w-full px-4 py-3 text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-sm font-bold transition-all mt-6"
        >
          <FaSignOutAlt size={18} />
          Sign Out
        </button>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="text-left">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Parent Command Station</h2>
            <p className="text-xs text-slate-500">Live safety monitoring of your child's school shuttle</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <button 
              onClick={() => setShowProfileDrawer(true)}
              className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-sm text-slate-700 hover:bg-slate-100 transition-colors"
            >
              👤
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6 flex-grow">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left Column: Live Child Map (7 Cols) */}
            <div className="lg:col-span-8 bg-white border border-slate-200 p-3 rounded-[2.5rem] h-[400px] lg:h-auto min-h-[400px] overflow-hidden relative shadow-sm flex flex-col">
              <div className="absolute top-6 left-6 z-20 bg-white/90 backdrop-blur-md border border-slate-200 px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-sm">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                <span className="text-xs font-bold text-slate-700">Active Transit Tracker</span>
              </div>
              
              <div ref={mapContainerRef} className="w-full flex-grow rounded-3xl z-10 border border-slate-100" style={{ background: '#f8fafc' }} />
            </div>

            {/* Right Column: Shuttle Details & Timelines (5 Cols) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Boarding Status Tracker */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 text-left space-y-6 shadow-sm">
                <h3 className="text-base font-extrabold text-slate-900">Transit Boarding Progress</h3>

                <div className="relative pl-6 space-y-5">
                  <div className="absolute left-[7px] top-1.5 bottom-1.5 w-0.5 bg-slate-200" />
                  
                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-[23px] w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-sm" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">Departed Home</h4>
                      <p className="text-[10px] text-slate-500">Boarded at 7:32 AM · Scheduled 7:30 AM</p>
                    </div>
                  </div>

                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-[23px] w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-sm" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">En Route</h4>
                      <p className="text-[10px] text-slate-500">Normal speed · No delay alerts</p>
                    </div>
                  </div>

                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-[23px] w-4 h-4 rounded-full bg-amber-500 border-4 border-white animate-pulse" />
                    <div>
                      <h4 className="font-bold text-xs text-amber-600">Approaching Sector 17</h4>
                      <p className="text-[10px] text-slate-500">Live ETA: 8:12 AM (2.4 km remaining)</p>
                    </div>
                  </div>

                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-[23px] w-4 h-4 rounded-full bg-slate-200 border-4 border-white" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-400">Arrived at School</h4>
                      <p className="text-[10px] text-slate-500">Scheduled 8:20 AM</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shuttle Driver Details Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 text-left space-y-4 shadow-sm">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FaBus className="text-blue-600" />
                  Assigned School Shuttle
                </h3>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">VAN REGISTRATION</span>
                    <span className="font-black text-sm text-slate-800 block mt-0.5">{assignedVan.vanNumber}</span>
                  </div>

                  <div className="border-t border-slate-200/60 pt-3 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">SHUTTLE CAPTAIN</span>
                      <span className="font-bold text-xs text-slate-800 mt-0.5 block">{assignedVan.driverName}</span>
                    </div>

                    <a 
                      href={`tel:${assignedVan.driverPhone}`}
                      className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 rounded-xl transition-colors"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end" onClick={() => setShowProfileDrawer(false)}>
          <div className="w-full max-w-md bg-white border-l border-slate-200 p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-6">
              <h3 className="text-lg font-bold text-slate-900">Profile Details</h3>
              <button onClick={() => setShowProfileDrawer(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <ProfilePage />
          </div>
        </div>
      )}
    </div>
  );
}
