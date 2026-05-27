import React, { useState, useEffect, useRef } from 'react';
import SidebarLayout from '../components/Layout/SidebarLayout';
import { fetchApi } from '../api';
import { FaBus, FaCompass, FaTachometerAlt, FaMapMarkerAlt, FaLocationArrow, FaPaperPlane } from 'react-icons/fa';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon asset paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function AdminTracking() {
  const [buses, setBuses] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [telemetry, setTelemetry] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    speed: 35
  });

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);

  useEffect(() => {
    fetchBuses();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (selectedBusId) {
      const bus = buses.find(b => b._id === selectedBusId);
      if (bus) {
        const lat = bus.currentLocation?.lat || 12.9716;
        const lng = bus.currentLocation?.lng || 77.5946;
        setTelemetry({
          latitude: lat,
          longitude: lng,
          speed: 35
        });
        
        if (mapInstanceRef.current) {
          updateMapMarker(lat, lng);
        } else {
          initMap(lat, lng);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBusId]);

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const { status, data } = await fetchApi('/buses?limit=100');
      if (status === 200) {
        setBuses(data.data);
        if (data.data.length > 0) {
          setSelectedBusId(data.data[0]._id);
        }
      } else {
        setError(data.message || 'Failed to fetch buses.');
      }
    } catch (err) {
      setError(err.message || 'Error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const initMap = (lat, lng) => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current).setView([lat, lng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Custom orange marker for driver telemetry
    const customIcon = L.divIcon({
      className: 'custom-driver-icon',
      html: `
        <div style="position: relative; width: 40px; height: 40px; background: rgba(249, 115, 22, 0.2); border: 2px solid #f97316; border-radius: 50%; display: flex; items-center; justify-content: center; animation: pulse 2s infinite;">
          <div style="width: 16px; height: 16px; background: #f97316; border-radius: 50%;"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
    marker.bindPopup(`<b>Bus Driver Position</b>`).openPopup();

    // Map click sets latitude/longitude
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setTelemetry(t => ({
        ...t,
        latitude: parseFloat(lat.toFixed(6)),
        longitude: parseFloat(lng.toFixed(6))
      }));
      marker.setLatLng(e.latlng);
    });

    mapInstanceRef.current = map;
    markerInstanceRef.current = marker;
  };

  const updateMapMarker = (lat, lng) => {
    if (markerInstanceRef.current && mapInstanceRef.current) {
      const newPos = [lat, lng];
      markerInstanceRef.current.setLatLng(newPos);
      mapInstanceRef.current.panTo(newPos);
    }
  };

  const handleTelemetrySubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);

    const payload = {
      busId: selectedBusId,
      latitude: parseFloat(telemetry.latitude),
      longitude: parseFloat(telemetry.longitude),
      speed: parseInt(telemetry.speed)
    };

    try {
      const { status, data } = await fetchApi('/tracking/update-location', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (status === 200) {
        alert('Bus telemetry broadcast successfully!');
        updateMapMarker(payload.latitude, payload.longitude);
        
        // Update local state bus list to prevent reset
        setBuses(prev => prev.map(b => {
          if (b._id === selectedBusId) {
            return {
              ...b,
              currentLocation: { lat: payload.latitude, lng: payload.longitude }
            };
          }
          return b;
        }));
      } else {
        setError(data.message || 'Telemetry update failed.');
      }
    } catch (err) {
      setError(err.message || 'Error occurred.');
    } finally {
      setUpdating(false);
    }
  };

  // Telemetry Simulation Actions
  const simulateNudge = (direction) => {
    const step = 0.002; // Roughly ~200 meters step
    let lat = parseFloat(telemetry.latitude);
    let lng = parseFloat(telemetry.longitude);

    if (direction === 'north') lat += step;
    if (direction === 'south') lat -= step;
    if (direction === 'east') lng += step;
    if (direction === 'west') lng -= step;

    setTelemetry(t => ({
      ...t,
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lng.toFixed(6))
    }));

    if (markerInstanceRef.current) {
      markerInstanceRef.current.setLatLng([lat, lng]);
    }
  };

  return (
    <SidebarLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Driver GPS Simulator</h1>
          <p className="text-sm text-slate-400">Simulate vehicle movements on maps and broadcast live Socket.io updates</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="h-96 bg-slate-950/20 border border-slate-800 animate-pulse rounded-3xl" />
        ) : buses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Map Simulator */}
            <div className="md:col-span-2 bg-slate-950/40 p-3 rounded-3xl border border-slate-800/80 h-[440px] relative">
              <div 
                ref={mapContainerRef} 
                className="w-full h-full rounded-2xl z-10" 
                style={{ background: '#0f172a' }}
              />
              <div className="absolute top-6 right-6 z-20 bg-slate-950/80 backdrop-blur-md px-3.5 py-2 border border-slate-800 rounded-xl text-[10px] text-slate-400 font-medium">
                Click map to select coords
              </div>
            </div>

            {/* Simulation controls */}
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-3xl p-6 space-y-6">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Simulation controls</h3>

              <div className="space-y-4">
                {/* Select Bus */}
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">Select Fleet Vehicle</label>
                  <select
                    value={selectedBusId}
                    onChange={(e) => setSelectedBusId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {buses.map(b => (
                      <option key={b._id} value={b._id}>{b.busNumber} ({b.routeName})</option>
                    ))}
                  </select>
                </div>

                <form onSubmit={handleTelemetrySubmit} className="space-y-4 pt-2 border-t border-slate-800/40">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Latitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={telemetry.latitude}
                        onChange={(e) => setTelemetry({ ...telemetry, latitude: parseFloat(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Longitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={telemetry.longitude}
                        onChange={(e) => setTelemetry({ ...telemetry, longitude: parseFloat(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Speed (km/h)</label>
                    <input
                      type="number"
                      value={telemetry.speed}
                      onChange={(e) => setTelemetry({ ...telemetry, speed: parseInt(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none"
                      min="0"
                      max="120"
                      required
                    />
                  </div>

                  {/* Move direction nudges */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 block">Nudge Location Direction</span>
                    <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                      <button type="button" onClick={() => simulateNudge('north')} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 py-1 rounded text-slate-300 font-semibold">▲ North</button>
                      <button type="button" onClick={() => simulateNudge('south')} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 py-1 rounded text-slate-300 font-semibold">▼ South</button>
                      <button type="button" onClick={() => simulateNudge('east')} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 py-1 rounded text-slate-300 font-semibold">▶ East</button>
                      <button type="button" onClick={() => simulateNudge('west')} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 py-1 rounded text-slate-300 font-semibold">◀ West</button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={updating}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FaPaperPlane size={10} />
                    {updating ? 'Broadcasting...' : 'Update Telemetry Coordinates'}
                  </button>
                </form>

              </div>
            </div>

          </div>
        ) : (
          <div className="bg-slate-950/20 border border-slate-800/80 border-dashed rounded-3xl p-12 text-center text-slate-400">
            Create a bus before utilizing driver tracking simulation panel.
          </div>
        )}

      </div>
    </SidebarLayout>
  );
}
