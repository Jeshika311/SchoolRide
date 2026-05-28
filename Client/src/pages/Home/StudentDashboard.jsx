import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout from '../../components/Layout/SidebarLayout';
import { fetchApi } from '../../api';
import { 
  FaBus, 
  FaSearch, 
  FaMapMarkerAlt, 
  FaRegBell,
  FaArrowRight,
  FaChevronRight,
  FaPhoneAlt,
  FaArrowLeft
} from 'react-icons/fa';
import ProfilePage from '../Profile/ProfilePage';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon asset paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Tricity Coordinates Map
const stopCoords = {
  "Pickup Point (Home)": [30.7046, 76.7179],
  "School Destination": [30.7390, 76.7820]
};

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [pickupText, setPickupText] = useState("Sector 66, Mohali");
  const [destinationText, setDestinationText] = useState("Sector 17, Chandigarh");
  const [loading, setLoading] = useState(false);
  const [selectedShuttle, setSelectedShuttle] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLineRef = useRef(null);

  // van seating representation matching the occupied/available pattern in screenshot
  // 1 = occupied (gold), 0 = available (grey)
  const vanSeats = [
    1, 1, 0, 1, 0,
    1, 0, 1, 1, 0,
    1, 1, 0, 0, 1
  ];

  // Leaflet Map Initialization with custom warm sepia filter
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const homeCoords = stopCoords["Pickup Point (Home)"];
    const schoolCoords = stopCoords["School Destination"];
    const middleCoords = [30.7200, 76.7500];

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView(middleCoords, 13);

    // Light tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    }).addTo(map);

    // Custom Blue Point A Marker
    const markerAIcon = L.divIcon({
      className: 'custom-blue-marker-a',
      html: `
        <div style="width: 32px; height: 32px; background: #ffffff; border: 3px solid #2563EB; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #2563EB; font-size: 14px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
          A
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    // Custom Green School Marker
    const schoolIcon = L.divIcon({
      className: 'custom-green-marker-school',
      html: `
        <div style="width: 32px; height: 32px; background: #10B981; border: 3px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="#ffffff">
            <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
            <path d="M19 12.09v3.41c0 .55-.45 1-1 1h-1v-2.09c0-.55-.45-1-1-1H9c-.55 0-1 .45-1 1V16.5H7c-.55 0-1-.45-1-1v-3.41L12 15l7-2.91z"/>
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    // Custom shuttle/car icon
    const carIconHtml = `
      <div style="width: 30px; height: 18px; background: #3b82f6; border: 2px solid #fff; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); position: relative;">
        <div style="position: absolute; left: 4px; top: -2px; width: 4px; height: 2px; background: #fff;"></div>
        <div style="position: absolute; right: 4px; top: -2px; width: 4px; height: 2px; background: #fff;"></div>
      </div>
    `;

    const carIcon1 = L.divIcon({ className: 'map-bus-icon-node', html: carIconHtml, iconSize: [30, 18] });
    const carIcon2 = L.divIcon({ className: 'map-bus-icon-node', html: carIconHtml, iconSize: [30, 18] });
    const carIcon3 = L.divIcon({ className: 'map-bus-icon-node', html: carIconHtml, iconSize: [30, 18] });

    L.marker(homeCoords, { icon: markerAIcon }).addTo(map);
    L.marker(schoolCoords, { icon: schoolIcon }).addTo(map);

    // Render mock nearby shuttle markers
    L.marker([30.7250, 76.7600], { icon: carIcon1 }).addTo(map);
    L.marker([30.7080, 76.7300], { icon: carIcon2 }).addTo(map);
    L.marker([30.7310, 76.7450], { icon: carIcon3 }).addTo(map);

    // Thick blue active route polyline path
    const routePolyline = L.polyline([homeCoords, schoolCoords], {
      color: '#2563EB',
      weight: 6,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    routeLineRef.current = routePolyline;
    mapInstanceRef.current = map;

    // Center bounds
    const bounds = L.latLngBounds([homeCoords, schoolCoords]);
    map.fitBounds(bounds, { padding: [80, 80] });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleConfirmRide = () => {
    // Navigate directly to buses to list rides
    navigate('/buses');
  };

  return (
    <SidebarLayout>
      <div className="absolute inset-0 w-full h-full flex flex-col md:flex-row overflow-hidden">
        
        {/* Full-Screen Map Container */}
        <div className="absolute inset-0 z-0 w-full h-full">
          <div 
            ref={mapContainerRef} 
            className="w-full h-full" 
            style={{ 
              background: '#FAF9F6'
            }} 
          />
        </div>

        {/* 1. FLOATING HEADER / TITLE CARD (Top Left) */}
        <div className="absolute top-6 left-6 z-20 pointer-events-none text-left">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight drop-shadow-sm">
            Smart Ride Booking.
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Live interaction of points for real-time pooling.
          </p>
        </div>

        {/* 2. FLOATING CONTROLS & PROFILE (Top Right) */}
        <div className="absolute top-6 right-[400px] z-20 hidden xl:flex items-center gap-3">
          <button 
            onClick={() => setShowProfileModal(true)}
            className="h-10 w-10 !bg-white hover:!bg-slate-50 border border-slate-200 !text-slate-700 rounded-xl flex items-center justify-center shadow-sm transition-colors"
            title="Profile & Settings"
          >
            👤
          </button>
          <button 
            onClick={() => navigate('/notifications')}
            className="h-10 w-10 !bg-white hover:!bg-slate-50 border border-slate-200 !text-slate-700 rounded-xl flex items-center justify-center shadow-sm relative transition-colors"
          >
            <FaRegBell size={16} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-600 rounded-full" />
          </button>
        </div>

        {/* 3. FLOATING SPEEDOMETER GAUGE (Bottom Center) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-white border border-slate-200 px-5 py-3 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="text-left">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-blue-600 block">Active Location Tracking</span>
            <span className="text-[11px] font-bold text-slate-500 mt-0.5 block">Speed</span>
          </div>

          {/* Circular progress meter */}
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" stroke="#E2E8F0" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="16" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeDasharray="100" strokeDashoffset="38" />
            </svg>
            <span className="absolute text-xs font-black text-slate-900">38</span>
          </div>
        </div>

        {/* 4. FLOATING BOOKING PANEL (Right Side - w-96) */}
        <div className="absolute top-6 bottom-6 right-6 z-20 w-full max-w-[360px] bg-white/95 backdrop-blur-md border border-slate-200 rounded-[2rem] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto hidden md:flex text-left">
          
          <div className="space-y-6">
            {/* Pickup & Drop Inputs */}
            <div className="space-y-3">
              {/* Pickup stop input */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <FaSearch size={12} />
                </span>
                <input 
                  type="text" 
                  value={pickupText}
                  onChange={(e) => setPickupText(e.target.value)}
                  placeholder="Pickup Point"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-9 pr-4 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Destination stop input */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <FaSearch size={12} />
                </span>
                <input 
                  type="text" 
                  value={destinationText}
                  onChange={(e) => setDestinationText(e.target.value)}
                  placeholder="School Destination"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-9 pr-4 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Fare & ETA Card */}
            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl text-left space-y-1">
              <span className="text-[9px] font-extrabold text-blue-605 uppercase tracking-wider block">Fare & ETA</span>
              <h3 className="text-lg font-black text-blue-600">₹135 - Pool</h3>
              <p className="text-[10px] font-bold text-slate-500">2 Seats · 2.48 min</p>
            </div>

            {/* Pooling Status Card (Visual seating visualizer of the van) */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Pooling Status</h4>
              
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col items-center">
                
                {/* Visual van seats grid representation */}
                <div className="w-full max-w-[200px] border-2 border-slate-200 bg-white/40 rounded-xl p-3 grid grid-cols-5 gap-2 relative">
                  {/* Dashboard front indicator */}
                  <div className="col-span-5 h-2 bg-slate-200 rounded-sm mb-1 opacity-60" />
                  
                  {vanSeats.map((occupied, idx) => (
                    <div 
                      key={idx} 
                      className={`h-4.5 w-full rounded-sm transition-colors border ${
                        occupied 
                          ? 'bg-blue-600 border-blue-700 shadow-sm shadow-blue-500/10' 
                          : 'bg-slate-200 border-slate-300'
                      }`}
                    />
                  ))}
                </div>

                {/* Seating legend */}
                <div className="flex gap-4 mt-3 text-[10px] font-bold text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-blue-600 rounded-sm border border-blue-700" />
                    <span>Occupied</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-slate-200 rounded-sm border border-slate-300" />
                    <span>Available</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirm button */}
            <button
              onClick={handleConfirmRide}
              className="w-full py-3.5 !bg-blue-600 hover:!bg-blue-500 !text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              Confirm Pool Ride
            </button>
          </div>

          {/* Nearby Shuttle Network list */}
          <div className="space-y-3 border-t border-slate-200 pt-4 mt-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Nearby Shuttle Network</h4>
            
            <div className="space-y-2">
              {/* Driver 1 */}
              <div 
                onClick={() => setSelectedShuttle({
                  name: 'SR-POOL-11',
                  driver: 'Rajesh Kumar',
                  phone: '9876543210',
                  registration: 'PB65 AB 2451',
                  type: 'Standard 24-Seater',
                  route: 'Sector 66 Mohali to Sector 17 Chandigarh (via Sector 62)',
                  eta: '5 mins',
                  occupancy: '15/24 Seats occupied',
                  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'
                })}
                className="bg-slate-50 hover:bg-slate-100 hover:border-blue-300 border border-slate-200 p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all duration-200"
              >
                <div className="h-8 w-8 rounded-full overflow-hidden border border-blue-500 animate-pulse">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" className="w-full h-full object-cover" alt="driver" />
                </div>
                <div className="overflow-hidden flex-grow text-left">
                  <h5 className="font-extrabold text-xs text-slate-900 text-blue-600">SR-POOL-11</h5>
                  <p className="text-[9px] text-slate-500 leading-tight">PB65 AB 2451 · Rajesh Kumar</p>
                </div>
                <span className="text-[8px] font-extrabold text-blue-600 uppercase">ETA 5 MINS</span>
              </div>

              <div 
                onClick={() => setSelectedShuttle({
                  name: 'SR-P-02',
                  driver: 'Gurpreet Singh',
                  phone: '9876500123',
                  registration: 'PB65 XY 9988',
                  type: 'Compact 12-Seater',
                  route: 'Sector 67 Mohali to Sector 17 Chandigarh (via Phase 7)',
                  eta: '9 mins',
                  occupancy: '8/12 Seats occupied',
                  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100'
                })}
                className="bg-slate-50 hover:bg-slate-100 hover:border-blue-300 border border-slate-200 p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all duration-200"
              >
                <div className="h-8 w-8 rounded-full overflow-hidden border border-blue-500">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" className="w-full h-full object-cover" alt="driver" />
                </div>
                <div className="overflow-hidden flex-grow text-left">
                  <h5 className="font-extrabold text-xs text-slate-900 text-blue-600">SR-P-02</h5>
                  <p className="text-[9px] text-slate-500 leading-tight">PB65 XY 9988 · Gurpreet Singh</p>
                </div>
                <span className="text-[8px] font-extrabold text-blue-600 uppercase">ETA 9 MINS</span>
              </div>
            </div>
          </div>

        {selectedShuttle && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedShuttle(null)}>
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 max-w-sm w-full space-y-6 shadow-2xl relative text-left" onClick={(e) => e.stopPropagation()}>
              
              {/* Close Button */}
              <button 
                onClick={() => setSelectedShuttle(null)} 
                className="absolute top-4 right-4 !bg-transparent text-slate-400 hover:!text-slate-650 p-2 rounded-full hover:!bg-slate-50 transition-colors"
              >
                ✕
              </button>

              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-blue-500 shadow-sm">
                  <img src={selectedShuttle.avatar} className="w-full h-full object-cover" alt="driver" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">{selectedShuttle.name}</span>
                  <h3 className="font-black text-slate-900 text-lg mt-1">{selectedShuttle.driver}</h3>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Shuttle Captain</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs space-y-3 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">VAN REGISTRATION</span>
                    <span className="font-extrabold text-slate-800 font-mono">{selectedShuttle.registration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">SHUTTLE MODEL</span>
                    <span className="font-bold text-slate-800">{selectedShuttle.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">SEATING STATUS</span>
                    <span className="font-extrabold text-blue-600">{selectedShuttle.occupancy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">ETA TO PICKUP</span>
                    <span className="font-extrabold text-emerald-600 uppercase">{selectedShuttle.eta}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">COMMUTE ROUTE</span>
                  <p className="text-slate-700 leading-normal font-semibold">{selectedShuttle.route}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <a 
                  href={`tel:${selectedShuttle.phone}`}
                  className="min-h-[3rem] w-full !bg-blue-600 hover:!bg-blue-500 !text-white text-sm font-black rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <FaPhoneAlt size={12} />
                  Call Driver
                </a>
                <button 
                  onClick={() => {
                    setSelectedShuttle(null);
                    navigate('/buses');
                  }}
                  className="min-h-[3rem] w-full border border-slate-200 !bg-white hover:!bg-slate-50 !text-slate-700 text-sm font-extrabold rounded-xl transition-all"
                >
                  Book Commute
                </button>
              </div>
            </div>
          </div>
        )}

        {showProfileModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowProfileModal(false)}>
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 max-w-md w-full shadow-2xl relative text-left flex flex-col max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              
              {/* Header with Back Button */}
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-4">
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="h-10 w-10 !bg-white hover:!bg-slate-50 border border-slate-200 !text-slate-700 rounded-xl flex items-center justify-center shadow-sm transition-all"
                  title="Back to Dashboard"
                >
                  <FaArrowLeft size={14} />
                </button>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Profile Details</h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Manage your account & settings</span>
                </div>
              </div>

              {/* Scrollable content containing ProfilePage */}
              <div className="overflow-y-auto flex-1 pr-1 scrollbar-thin">
                <ProfilePage isPopup={true} onClose={() => setShowProfileModal(false)} />
              </div>
            </div>
          </div>
        )}
        </div>

      </div>
    </SidebarLayout>
  );
}
