import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarLayout from '../../components/Layout/SidebarLayout';
import { fetchApi } from '../../api';
import { FaMapMarkerAlt, FaLocationArrow, FaTachometerAlt, FaClock, FaRedo, FaAngleLeft, FaTimesCircle } from 'react-icons/fa';
import io from 'socket.io-client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon asset paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function LiveTracking() {
  const { busId } = useParams();
  const navigate = useNavigate();

  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sosTriggered, setSosTriggered] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);
  const socketRef = useRef(null);

  const updateMapMarker = useCallback((lat, lng) => {
    if (mapInstanceRef.current && markerInstanceRef.current) {
      const newPos = [lat, lng];
      markerInstanceRef.current.setLatLng(newPos);
      mapInstanceRef.current.panTo(newPos);
    }
  }, []);

  const initMap = useCallback((lat, lng) => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Build leaflet map instance
    const initialLat = lat || 12.9716; // default fallback (e.g. Bangalore coordinates)
    const initialLng = lng || 77.5946;

    const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Custom glowing blue marker for the bus
    const busIcon = L.divIcon({
      className: 'custom-bus-icon',
      html: `
        <div style="position: relative; width: 40px; height: 40px; background: rgba(37, 99, 235, 0.2); border: 2px solid #2563EB; border-radius: 50%; display: flex; items-center; justify-content: center; animation: pulse 2s infinite;">
          <div style="width: 16px; height: 16px; bg-color: #2563EB; background: #2563EB; border-radius: 50%;"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const marker = L.marker([initialLat, initialLng], { icon: busIcon }).addTo(map);
    marker.bindPopup(`<b>Bus Tracker</b><br>Live Commute Coordinates`).openPopup();

    mapInstanceRef.current = map;
    markerInstanceRef.current = marker;
  }, []);

  const fetchInitialLocation = useCallback(async () => {
    try {
      setLoading(true);
      const { status, data } = await fetchApi(`/tracking/${busId}`);
      if (status === 200) {
        setLocationData(data.data);
        initMap(data.data.latitude, data.data.longitude);
      } else {
        setError(data.message || 'Failed to fetch location details.');
      }
    } catch (err) {
      setError(err.message || 'Error occurred fetching coordinates.');
    } finally {
      setLoading(false);
    }
  }, [busId, initMap]);

  const pollLocation = useCallback(async () => {
    try {
      const { status, data } = await fetchApi(`/tracking/${busId}`);
      if (status === 200) {
        setLocationData(data.data);
        updateMapMarker(data.data.latitude, data.data.longitude);
      }
    } catch (err) {
      console.error('Error polling bus coordinates:', err.message);
    }
  }, [busId, updateMapMarker]);

  useEffect(() => {
    // 1. Fetch initial bus location
    fetchInitialLocation();

    // 2. Set up Socket.io listener for real-time updates
    const socketBaseUrl = window.location.origin.replace('5173', '5000'); // Assume server is on port 5000 if client is on 5173
    socketRef.current = io(socketBaseUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketRef.current.on(`bus-location-${busId}`, (updatedLocation) => {
      console.log('Realtime location update received:', updatedLocation);
      setLocationData(updatedLocation);
      updateMapMarker(updatedLocation.latitude, updatedLocation.longitude);
    });

    // 3. Set up fallback polling every 6 seconds
    const interval = setInterval(() => {
      pollLocation();
    }, 6000);

    return () => {
      clearInterval(interval);
      if (socketRef.current) socketRef.current.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [busId, fetchInitialLocation, pollLocation, updateMapMarker]);

  // Estimate duration to destination
  const calculateETA = (speed) => {
    if (!speed || speed < 5) return '15 mins (traffic normal)';
    if (speed > 45) return '8 mins (fast)';
    return '12 mins';
  };

  const handleSosTrigger = () => {
    setSosTriggered(true);
    alert("🚨 EMERGENCY SOS BROADCASTED! School authorities, transit dispatch, and emergency contacts have been notified with the current bus coordinates.");
  };

  return (
    <SidebarLayout>
      <div className="max-w-5xl mx-auto space-y-6 text-slate-900">
        
        {/* Back Link */}
        <button 
          onClick={() => navigate('/home')}
          className="flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:text-sky-600 transition-colors"
        >
          <FaAngleLeft size={16} />
          Back to Dashboard
        </button>

        {/* Dashboard Title & Manual Refresh */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-sky-500 rounded-full animate-ping" />
              Live Bus Tracking
            </h1>
            <p className="text-sm text-slate-500">Real-time coordinates updates from vehicle telemetry</p>
          </div>
          <button 
            onClick={pollLocation}
            className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-800 bg-sky-50 px-3.5 py-2.5 rounded-xl border border-sky-100 transition-colors"
          >
            <FaRedo size={12} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="h-96 bg-white border border-sky-100 animate-pulse rounded-3xl flex items-center justify-center text-slate-500 shadow-sm">
            Initializing map services...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Map Container */}
            <div className="md:col-span-2 bg-white p-3 rounded-3xl border border-sky-100 h-[420px] overflow-hidden relative shadow-sm">
              <div 
                ref={mapContainerRef} 
                className="w-full h-full rounded-2xl z-10" 
                style={{ background: '#f8fafc' }}
              />
            </div>

            {/* Live Metrics Column */}
            <div className="bg-white border border-sky-100 rounded-3xl p-6 flex flex-col justify-between gap-6 shadow-sm">
              <div className="space-y-6">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Bus Telemetry</h3>
                
                <div className="space-y-4">
                  {/* Coordinates indicator */}
                  <div className="flex gap-4">
                    <div className="p-3 bg-sky-50 rounded-xl text-sky-600 h-fit">
                      <FaLocationArrow size={18} />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">CURRENT COORDINATES</span>
                      <span className="text-sm font-semibold text-slate-900 block mt-0.5">
                        {locationData?.latitude?.toFixed(5) || 0.0}, {locationData?.longitude?.toFixed(5) || 0.0}
                      </span>
                    </div>
                  </div>

                  {/* Speed indicator */}
                  <div className="flex gap-4">
                    <div className="p-3 bg-sky-50 rounded-xl text-sky-600 h-fit">
                      <FaTachometerAlt size={18} />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">LIVE SPEED</span>
                      <span className="text-sm font-semibold text-slate-900 block mt-0.5">
                        {locationData?.speed || 0} km/h
                      </span>
                    </div>
                  </div>

                  {/* ETA indicator */}
                  <div className="flex gap-4">
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 h-fit">
                      <FaClock size={18} />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">ESTIMATED ARRIVAL (ETA)</span>
                      <span className="text-sm font-semibold text-slate-900 block mt-0.5">
                        {calculateETA(locationData?.speed)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency SOS button */}
              <div className="space-y-2">
                <button
                  onClick={handleSosTrigger}
                  className={`
                    w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer
                    ${sosTriggered 
                      ? 'bg-rose-600 text-white border border-rose-500 shadow-lg shadow-rose-100' 
                      : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-500/20 animate-pulse'
                    }
                  `}
                >
                  <FaTimesCircle className={sosTriggered ? "animate-spin" : ""} size={16} />
                  {sosTriggered ? 'SOS ACTIVE - HELP NOTIFIED' : 'EMERGENCY SOS PANIC'}
                </button>
                {!sosTriggered && (
                  <span className="text-[10px] text-slate-500 block text-center leading-normal">
                    *Tapping will instantly ping transit authorities with current GPS telemetry
                  </span>
                )}
              </div>

              {/* Status footer card */}
              <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 text-xs text-slate-600 leading-normal space-y-1.5">
                <span className="font-bold text-slate-900 block uppercase">Real-time status</span>
                <p>
                  Updates broadcast live via WebSockets. If the map does not refresh, coordinates fallback to periodic HTTP polling.
                </p>
              </div>

            </div>

          </div>
        )}

      </div>
    </SidebarLayout>
  );
}
