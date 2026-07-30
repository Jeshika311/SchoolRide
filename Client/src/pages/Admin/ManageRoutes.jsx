import { useEffect, useState } from 'react';
import SidebarLayout from '../../components/Layout/SidebarLayout';
import { fetchApi } from '../../api';
import { FaRoute, FaPlus, FaTrash, FaEdit, FaTimes, FaSave } from 'react-icons/fa';

const emptyForm = {
  route_name: '',
  start_location: '',
  end_location: '',
  stopsString: '',
  coordinatesJson: '[]',
  estimated_time_minutes: 0,
  distance_km: 0,
  driver: '',
  assignedBus: '',
};

export default function ManageRoutes() {
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    Promise.all([fetchRoutes(), fetchAssignmentOptions()]);
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const { status, data } = await fetchApi('/routes');
      if (status === 200) {
        setRoutes(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch routes.');
      }
    } catch (err) {
      setError(err.message || 'Error loading routes.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentOptions = async () => {
    try {
      setLoadingOptions(true);
      const { status, data } = await fetchApi('/user/assignment-options');
      if (status === 200 && data?.success) {
        setDrivers(data.data?.drivers || []);
        setBuses(data.data?.buses || []);
      }
    } catch (err) {
      setError(err.message || 'Error loading assignment options.');
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleInputChange = (event) => {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  };

  const handleCreateClick = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      stopsString: 'Main Gate, Sector 22, School Campus',
      coordinatesJson: JSON.stringify([
        { latitude: 30.7046, longitude: 76.7179, label: 'Pickup' },
        { latitude: 30.7201, longitude: 76.7501, label: 'Stop' },
        { latitude: 30.7390, longitude: 76.7820, label: 'Drop' }
      ], null, 2)
    });
    setModalOpen(true);
  };

  const handleEditClick = (route) => {
    setEditingId(route._id);
    setForm({
      route_name: route.route_name || '',
      start_location: route.start_location || '',
      end_location: route.end_location || '',
      stopsString: Array.isArray(route.stops) ? route.stops.join(', ') : '',
      coordinatesJson: JSON.stringify(route.coordinates || [], null, 2),
      estimated_time_minutes: route.estimated_time_minutes || route.duration_minutes || 0,
      distance_km: route.distance_km || 0,
      driver: route.driver?._id || '',
      assignedBus: route.assignedBus?._id || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this route?')) {
      return;
    }

    try {
      const { status, data } = await fetchApi(`/routes/${id}`, { method: 'DELETE' });
      if (status === 200) {
        setError(null);
        fetchRoutes();
      } else {
        setError(data.message || 'Failed to delete route.');
      }
    } catch (err) {
      setError(err.message || 'Error deleting route.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    let coordinates = [];
    try {
      coordinates = JSON.parse(form.coordinatesJson || '[]');
    } catch {
      setError('Coordinates must be valid JSON.');
      return;
    }

    const payload = {
      route_name: form.route_name.trim(),
      start_location: form.start_location.trim(),
      end_location: form.end_location.trim(),
      stops: form.stopsString.split(',').map((value) => value.trim()).filter(Boolean),
      coordinates,
      estimated_time_minutes: Number(form.estimated_time_minutes || 0),
      distance_km: Number(form.distance_km || 0),
      driver: form.driver || undefined,
      assignedBus: form.assignedBus || undefined,
    };

    try {
      const endpoint = editingId ? `/routes/${editingId}` : '/routes';
      const method = editingId ? 'PUT' : 'POST';
      const { status, data } = await fetchApi(endpoint, {
        method,
        body: JSON.stringify(payload)
      });

      if (status === 200 || status === 201) {
        setModalOpen(false);
        fetchRoutes();
      } else {
        setError(data.message || 'Route save failed.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred.');
    }
  };

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-600">Route management</p>
            <h1 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tight">Manage Routes</h1>
            <p className="text-sm text-slate-500 max-w-2xl">Create and update routes, stops, coordinates, and driver assignments.</p>
          </div>
          <button
            onClick={handleCreateClick}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold rounded-2xl shadow-lg shadow-sky-200 transition-colors"
          >
            <FaPlus size={14} />
            Create Route
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm shadow-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-32 bg-white border border-sky-100 animate-pulse rounded-3xl shadow-sm" />
            ))}
          </div>
        ) : routes.length > 0 ? (
          <div className="bg-white rounded-3xl border border-sky-100 overflow-hidden shadow-sm shadow-sky-100/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-sky-100 bg-sky-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Route</th>
                    <th className="px-6 py-4">Driver</th>
                    <th className="px-6 py-4">Bus</th>
                    <th className="px-6 py-4">Distance</th>
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100 text-sm text-slate-700">
                  {routes.map((route) => (
                    <tr key={route._id} className="hover:bg-sky-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-slate-950">{route.route_name || `${route.start_location} → ${route.end_location}`}</div>
                        <div className="text-xs text-slate-500 mt-1">{route.start_location} → {route.end_location}</div>
                      </td>
                      <td className="px-6 py-4">{route.driver?.name || 'Unassigned'}</td>
                      <td className="px-6 py-4">{route.assignedBus?.busNumber || 'Unassigned'}</td>
                      <td className="px-6 py-4">{route.distance_km || 0} km</td>
                      <td className="px-6 py-4">{route.estimated_time_minutes || route.duration_minutes || 0} min</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEditClick(route)} className="p-2 bg-slate-100 text-slate-500 hover:text-slate-900 rounded-xl border border-slate-200 transition-colors" title="Edit">
                            <FaEdit size={14} />
                          </button>
                          <button onClick={() => handleDelete(route._id)} className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-xl border border-rose-100 transition-colors" title="Delete">
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
            No routes configured yet.
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-sky-100 rounded-3xl p-6 max-w-2xl w-full space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-sky-100 pb-4">
              <h3 className="font-extrabold text-slate-950 text-lg tracking-wide">
                {editingId ? 'Edit Route' : 'Add New Route'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:text-slate-950 text-slate-400 transition-colors">
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Route Name</label>
                <input name="route_name" value={form.route_name} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-sky-400" placeholder="Morning Route A" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Source</label>
                  <input name="start_location" value={form.start_location} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-sky-400" placeholder="Sector 66, Mohali" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Destination</label>
                  <input name="end_location" value={form.end_location} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-sky-400" placeholder="St. Xavier School" required />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Stops (comma separated)</label>
                <textarea name="stopsString" value={form.stopsString} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-sky-400 h-16 resize-none" placeholder="Stop A, Stop B, Stop C" required />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Coordinates JSON</label>
                <textarea name="coordinatesJson" value={form.coordinatesJson} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-sky-400 h-32 font-mono resize-none" placeholder='[{"latitude":30.7,"longitude":76.7,"label":"Pickup"}]' />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Estimated Time (minutes)</label>
                  <input type="number" name="estimated_time_minutes" value={form.estimated_time_minutes} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-sky-400" min="0" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Distance (km)</label>
                  <input type="number" name="distance_km" value={form.distance_km} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-sky-400" min="0" step="0.1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Driver</label>
                  <select name="driver" value={form.driver} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-sky-400" disabled={loadingOptions}>
                    <option value="">Select driver</option>
                    {drivers.map((driver) => (
                      <option key={driver._id} value={driver._id}>{driver.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Bus</label>
                  <select name="assignedBus" value={form.assignedBus} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-sky-400" disabled={loadingOptions}>
                    <option value="">Select bus</option>
                    {buses.map((bus) => (
                      <option key={bus._id} value={bus._id}>{bus.busNumber}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full mt-6 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 shadow-lg shadow-sky-200">
                <FaSave size={12} />
                Save Route
              </button>
            </form>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
