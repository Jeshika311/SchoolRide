import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout from '../../components/Layout/SidebarLayout';
import { fetchApi } from '../../api';
import { FaBus, FaSearch, FaMapMarkerAlt, FaUsers, FaArrowRight, FaFilter } from 'react-icons/fa';

export default function BusListing() {
  const navigate = useNavigate();
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [routeName, setRouteName] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [error, setError] = useState(null);

  const fetchBuses = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page,
        limit: 6,
        ...(activeSearch ? { search: activeSearch } : {}),
        ...(routeName ? { routeName } : {})
      });
      const { status, data } = await fetchApi(`/buses?${queryParams.toString()}`);
      if (status === 200) {
        setBuses(data.data);
        setPagination({
          total: data.pagination.total,
          pages: data.pagination.pages
        });
      } else {
        setError(data.message || 'Failed to fetch buses.');
      }
    } catch (err) {
      setError(err.message || 'Error occurred fetching buses.');
    } finally {
      setLoading(false);
    }
  }, [page, activeSearch, routeName]);

  useEffect(() => {
    fetchBuses();
  }, [fetchBuses]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setActiveSearch(search);
  };

  const handleClearFilters = () => {
    setSearch('');
    setActiveSearch('');
    setRouteName('');
    setPage(1);
  };

  return (
    <SidebarLayout>
      <div className="max-w-6xl mx-auto space-y-6 text-slate-900">
        
        {/* Header and Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Available Bus Commutes</h1>
            <p className="text-sm text-slate-500">Search and filter routes to find your school ride</p>
          </div>
          
          <button 
            onClick={handleClearFilters}
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 w-fit self-end md:self-auto transition-colors"
          >
            Clear All Filters
          </button>
        </div>

        {/* Filter Toolbar */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <FaSearch size={14} />
            </span>
            <input
              type="text"
              placeholder="Search bus no., stops..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Route filter */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <FaFilter size={14} />
            </span>
            <input
              type="text"
              placeholder="Filter by route name..."
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Submit filter button */}
          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2.5 rounded-xl shadow-sm hover:shadow transition-all duration-200"
          >
            Apply Filters
          </button>
        </form>

        {/* Error message */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Bus Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 bg-white border border-slate-200 animate-pulse rounded-2xl shadow-sm" />
            ))}
          </div>
        ) : buses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buses.map((bus) => {
              const occupiedSeats = Array.isArray(bus.occupiedSeats) ? bus.occupiedSeats : [];
              const availableCount = bus.totalSeats - occupiedSeats.length;
              return (
                <div 
                  key={bus._id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between hover:border-blue-300 hover:shadow-md hover:scale-[1.01] transition-all duration-300 shadow-sm"
                >
                  <div className="space-y-4">
                    {/* Bus Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
                          <FaBus size={16} />
                        </div>
                        <span className="font-extrabold text-slate-900">{bus.busNumber}</span>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        availableCount > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {availableCount > 0 ? `${availableCount} seats left` : 'Sold out'}
                      </span>
                    </div>

                    {/* Route Details */}
                    <div>
                      <h4 className="font-bold text-lg text-slate-900">{bus.routeName}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <FaUsers size={12} />
                        <span>Total seats: {bus.totalSeats}</span>
                      </div>
                    </div>

                    {/* Stop tags */}
                    <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                      <div>
                        <span className="text-slate-500 block mb-1">PICKUP STOPS</span>
                        <div className="flex flex-wrap gap-1">
                          {bus.pickupStops.map((stop, i) => (
                            <span key={i} className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                              {stop}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-slate-500 block mb-1">DROP STOPS</span>
                        <div className="flex flex-wrap gap-1">
                          {bus.dropStops.map((stop, i) => (
                            <span key={i} className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                              {stop}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Book Button */}
                  <button
                    onClick={() => navigate(`/seat-selection/${bus._id}`)}
                    disabled={availableCount <= 0}
                    className={`
                      w-full mt-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200
                      ${availableCount > 0 
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/15' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      }
                    `}
                  >
                    Select Seat & stops
                    <FaArrowRight size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-12 text-center text-slate-500 shadow-sm">
            No buses matching the filter criteria were found. Try modifying your search query.
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-colors shadow-sm"
            >
              Previous
            </button>
            <span className="flex items-center px-4 text-sm text-slate-500 font-medium">
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(p + 1, pagination.pages))}
              disabled={page === pagination.pages}
              className="px-4 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-colors shadow-sm"
            >
              Next
            </button>
          </div>
        )}

      </div>
    </SidebarLayout>
  );
}
