import React, { useState, useEffect } from 'react';
import SidebarLayout from '../../components/Layout/SidebarLayout';
import { fetchApi } from '../../api';
import { FaBus, FaPlus, FaTrash, FaEdit, FaTimes, FaSave } from 'react-icons/fa';

export default function ManageBuses() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState(null);
  const [assignmentOptions, setAssignmentOptions] = useState({ drivers: [], routes: [] });

  // Form states
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    busNumber: '',
    totalSeats: 15,
    routeName: '',
    pickupStopsString: '',
    dropStopsString: '',
    driver: '',
    route: '',
    status: 'active',
    latitude: 12.9716,
    longitude: 77.5946
  });

  useEffect(() => {
    Promise.all([fetchBuses(), fetchAssignmentOptions()]);
  }, []);

  const fetchAssignmentOptions = async () => {
    try {
      setLoadingOptions(true);
      const { status, data } = await fetchApi('/user/assignment-options');
      if (status === 200 && data?.success) {
        setAssignmentOptions({
          drivers: data.data?.drivers || [],
          routes: data.data?.routes || []
        });
      }
    } catch (err) {
      setError(err.message || 'Error loading assignment options.');
    } finally {
      setLoadingOptions(false);
    }
  };

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const { status, data } = await fetchApi('/buses?limit=100');
      if (status === 200) {
        setBuses(data.data);
      } else {
        setError(data.message || 'Failed to fetch buses.');
      }
    } catch (err) {
      setError(err.message || 'Error loading buses.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditClick = (bus) => {
    setEditingId(bus._id);
    setForm({
      busNumber: bus.busNumber,
      totalSeats: bus.totalSeats,
      routeName: bus.routeName,
      pickupStopsString: bus.pickupStops.join(', '),
      dropStopsString: bus.dropStops.join(', '),
      driver: bus.driver?._id || '',
      route: bus.route?._id || '',
      status: bus.status || 'active',
      latitude: bus.currentLocation?.lat || 12.9716,
      longitude: bus.currentLocation?.lng || 77.5946
    });
    setModalOpen(true);
  };

  const handleCreateClick = () => {
    setEditingId(null);
    setForm({
      busNumber: '',
      totalSeats: 15,
      routeName: '',
      pickupStopsString: 'Main Gate, Cross Roads, City Center',
      dropStopsString: 'School Yard, Science Block, Library',
      driver: '',
      route: '',
      status: 'active',
      latitude: 12.9716,
      longitude: 77.5946
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bus? All route and seat configuration will be lost.')) {
      return;
    }

    try {
      const { status, data } = await fetchApi(`/buses/${id}`, {
        method: 'DELETE'
      });
      if (status === 200) {
        alert('Bus deleted successfully.');
        fetchBuses();
      } else {
        alert(data.message || 'Failed to delete bus.');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Format stops from comma-separated strings
    const pickupStops = form.pickupStopsString.split(',').map(s => s.trim()).filter(Boolean);
    const dropStops = form.dropStopsString.split(',').map(s => s.trim()).filter(Boolean);

    const payload = {
      busNumber: form.busNumber.trim(),
      totalSeats: parseInt(form.totalSeats),
      routeName: form.routeName.trim(),
      pickupStops,
      dropStops,
      driver: form.driver || undefined,
      route: form.route || undefined,
      status: form.status,
      currentLocation: {
        lat: parseFloat(form.latitude),
        lng: parseFloat(form.longitude)
      }
    };

    try {
      const endpoint = editingId ? `/buses/${editingId}` : '/buses';
      const method = editingId ? 'PUT' : 'POST';

      const { status, data } = await fetchApi(endpoint, {
        method,
        body: JSON.stringify(payload)
      });

      if (status === 200 || status === 201) {
        alert(editingId ? 'Bus updated successfully.' : 'Bus created successfully.');
        setModalOpen(false);
        fetchBuses();
      } else {
        setError(data.message || 'Operation failed.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred.');
    }
  };

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-600">Fleet management</p>
            <h1 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tight">Manage Transit Fleet</h1>
            <p className="text-sm text-slate-500 max-w-2xl">Configure buses, seat quantities, assignments, and school stops</p>
          </div>
          <button 
            onClick={handleCreateClick}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold rounded-2xl shadow-lg shadow-sky-200 transition-colors"
          >
            <FaPlus size={14} />
            Create Bus Commute
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm shadow-sm">
            {error}
          </div>
        )}

        {/* Bus List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-32 bg-white border border-sky-100 animate-pulse rounded-3xl shadow-sm" />
            ))}
          </div>
        ) : buses.length > 0 ? (
          <div className="bg-white rounded-3xl border border-sky-100 overflow-hidden shadow-sm shadow-sky-100/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-sky-100 bg-sky-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Bus Details</th>
                    <th className="px-6 py-4">Route Name</th>
                    <th className="px-6 py-4">Driver</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Seats Allocated</th>
                    <th className="px-6 py-4">Stops Config</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100 text-sm text-slate-700">
                  {buses.map((bus) => (
                    <tr key={bus._id} className="hover:bg-sky-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-sky-50 rounded-xl text-sky-600 border border-sky-100">
                            <FaBus size={14} />
                          </div>
                          <span className="font-extrabold text-slate-950">{bus.busNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{bus.routeName}</td>
                      <td className="px-6 py-4 text-slate-700">
                        {bus.driver?.name || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${bus.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {bus.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-500">
                          {bus.occupiedSeats?.length || 0} / {bus.totalSeats} seats
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs space-y-1">
                        <div>
                          <strong className="text-slate-500">Pickups:</strong> {bus.pickupStops.join(', ') || 'None'}
                        </div>
                        <div>
                          <strong className="text-slate-500">Drops:</strong> {bus.dropStops.join(', ') || 'None'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(bus)}
                            className="p-2 bg-slate-100 text-slate-500 hover:text-slate-900 rounded-xl border border-slate-200 transition-colors"
                            title="Edit"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(bus._id)}
                            className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-xl border border-rose-100 transition-colors"
                            title="Delete"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-sky-100 border-dashed rounded-3xl p-12 text-center text-slate-500 shadow-sm">
            No bus fleets configured. Click "Create Bus Commute" to add a bus.
          </div>
        )}

      </div>

      {/* --- CREATE / EDIT MODAL --- */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-sky-100 rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            
            <div className="flex items-center justify-between border-b border-sky-100 pb-4">
              <h3 className="font-extrabold text-slate-950 text-lg tracking-wide">
                {editingId ? 'Edit Commute details' : 'Add New Commute'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1 hover:text-slate-950 text-slate-400 transition-colors"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Bus Number</label>
                  <input
                    type="text"
                    name="busNumber"
                    value={form.busNumber}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-sky-400"
                    placeholder="e.g. MH-12-QB-4589"
                    required
                  />
                </div>
                <div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Driver Assignment</label>
                  <select
                    name="driver"
                    value={form.driver}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-sky-400"
                    disabled={loadingOptions}
                  >
                    <option value="">Select a completed active driver</option>
                    {assignmentOptions.drivers.map((driver) => (
                      <option key={driver._id} value={driver._id}>
                        {driver.name} {driver.profile?.vehicle_number ? `• ${driver.profile.vehicle_number}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Route Assignment</label>
                  <select
                    name="route"
                    value={form.route}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-sky-400"
                    disabled={loadingOptions}
                  >
                    <option value="">Select route</option>
                    {assignmentOptions.routes.map((route) => (
                      <option key={route._id} value={route._id}>
                        {route.route_name || `${route.start_location} → ${route.end_location}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-sky-400"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Total Seat Count</label>
                  <input
                    type="number"
                    name="totalSeats"
                    value={form.totalSeats}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-sky-400"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Route Name</label>
                <input
                  type="text"
                  name="routeName"
                  value={form.routeName}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-sky-400"
                  placeholder="e.g. North Sector to Greenwood Academy"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Pickup Stops (comma separated)</label>
                <textarea
                  name="pickupStopsString"
                  value={form.pickupStopsString}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-sky-400 h-16 resize-none"
                  placeholder="Stop A, Stop B, Stop C"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Drop Stops (comma separated)</label>
                <textarea
                  name="dropStopsString"
                  value={form.dropStopsString}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-sky-400 h-16 resize-none"
                  placeholder="School Yard, Main Dorm, Science Lab"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Telemetry Latitude</label>
                  <input
                    type="number"
                    name="latitude"
                    value={form.latitude}
                    onChange={handleInputChange}
                    step="0.000001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-sky-400"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Telemetry Longitude</label>
                  <input
                    type="number"
                    name="longitude"
                    value={form.longitude}
                    onChange={handleInputChange}
                    step="0.000001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-sky-400"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-6 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 shadow-lg shadow-sky-200"
              >
                <FaSave size={12} />
                Save Configuration
              </button>
            </form>
          </div>
        </div>
      )}

    </SidebarLayout>
  );
}
