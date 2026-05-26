import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SidebarLayout from '../components/Layout/SidebarLayout';
import { fetchApi } from '../api';
import { FaBus, FaHistory, FaMapMarkerAlt, FaCreditCard, FaTicketAlt, FaChevronRight } from 'react-icons/fa';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [activeBooking, setActiveBooking] = useState(null);
  const [coRiders, setCoRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = JSON.parse(localStorage.getItem('authUser') || '{}');

  const fetchCoRiders = useCallback(async (busId) => {
    try {
      const { status, data } = await fetchApi(`/buses/${busId}/co-riders`);
      if (status === 200) {
        setCoRiders(data.data);
      }
    } catch (err) {
      console.error('Error loading co-riders:', err.message);
    }
  }, []);

  const fetchActiveBooking = useCallback(async () => {
    try {
      setLoading(true);
      const { status, data } = await fetchApi('/bookings/my-bookings');
      if (status === 200) {
        // Active booking is the one that is Confirmed or Pending/Payment Pending
        const active = data.data.find(b => b.bookingStatus !== 'Cancelled');
        setActiveBooking(active || null);
        if (active && active.bookingStatus === 'Confirmed') {
          fetchCoRiders(active.busId?._id || active.busId);
        }
      } else {
        setError(data.message || 'Failed to fetch bookings.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }, [fetchCoRiders]);

  useEffect(() => {
    fetchActiveBooking();
  }, [fetchActiveBooking]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action will release your seat.')) {
      return;
    }
    try {
      const { status, data } = await fetchApi(`/bookings/${bookingId}`, {
        method: 'DELETE'
      });
      if (status === 200) {
        alert('Booking cancelled successfully.');
        fetchActiveBooking();
      } else {
        alert(data.message || 'Cancellation failed.');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const statusColors = {
    'Confirmed': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    'Payment Pending': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    'Pending': 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    'Cancelled': 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
  };

  return (
    <SidebarLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Welcome Hero */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-blue-500/10 border border-blue-500/20">
          <div className="relative z-10 space-y-2">
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
              Hello, {user.name || 'Student'}!
            </h1>
            <p className="text-blue-100 text-sm md:text-base max-w-xl font-medium">
              Your academic journey starts here. Book, track, and manage your school commute seamlessly.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none flex items-center justify-center">
            <FaBus size={150} className="text-white transform rotate-12" />
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm font-semibold">
            {error}
          </div>
        )}

        {/* Info Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-slate-950/40 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 flex items-center gap-4 hover:border-slate-700/60 transition-colors">
            <div className="p-4 bg-blue-500/10 rounded-xl text-blue-400">
              <FaTicketAlt size={22} />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Commute Seat</span>
              <span className="text-lg font-bold text-white block mt-0.5">
                {activeBooking ? `Seat #${activeBooking.seatNumber}` : 'Not Booked'}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/40 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 flex items-center gap-4 hover:border-slate-700/60 transition-colors">
            <div className="p-4 bg-emerald-500/10 rounded-xl text-emerald-400">
              <FaCreditCard size={22} />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Payment Status</span>
              <span className="text-lg font-bold text-white block mt-0.5">
                {activeBooking ? activeBooking.bookingStatus : 'N/A'}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/40 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 flex items-center gap-4 hover:border-slate-700/60 transition-colors">
            <div className="p-4 bg-indigo-500/10 rounded-xl text-indigo-400">
              <FaMapMarkerAlt size={22} />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Ride Live Map</span>
              <span className="text-lg font-bold text-white block mt-0.5">
                {activeBooking && activeBooking.bookingStatus === 'Confirmed' ? 'Active' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Core Booking Card Section */}
        <div>
          <h3 className="text-lg font-extrabold text-white tracking-tight mb-4 flex items-center gap-2">
            Active Commute Booking
          </h3>

          {loading ? (
            <div className="h-48 bg-slate-950/20 animate-pulse border border-slate-800/60 rounded-2xl flex items-center justify-center text-slate-400">
              Loading booking details...
            </div>
          ) : activeBooking ? (
            <div className="bg-slate-950/40 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-slate-700/80 transition-all duration-300">
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
                    {activeBooking.busId?.busNumber || 'Bus Detail'}
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${statusColors[activeBooking.bookingStatus]}`}>
                    {activeBooking.bookingStatus}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-white">{activeBooking.busId?.routeName || 'Route Name'}</h4>
                  <p className="text-slate-400 text-sm">
                    Stops: <strong className="text-slate-200">{activeBooking.pickupStop}</strong> to <strong className="text-slate-200">{activeBooking.dropStop}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-6 text-sm text-slate-300">
                  <div>
                    <span className="text-xs text-slate-500 block">SEAT ASSIGNED</span>
                    <span className="font-extrabold text-base text-blue-400">Seat {activeBooking.seatNumber}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">FARED VALUE</span>
                    <span className="font-extrabold text-base text-slate-200">₹1,500.00 / month</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                {activeBooking.bookingStatus === 'Payment Pending' && (
                  <button 
                    onClick={() => navigate(`/payment/${activeBooking._id}`)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200"
                  >
                    <FaCreditCard size={16} />
                    Complete Payment
                  </button>
                )}

                {activeBooking.bookingStatus === 'Confirmed' && (
                  <button 
                    onClick={() => navigate(`/track/${activeBooking.busId?._id || activeBooking.busId}`)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200"
                  >
                    <FaMapMarkerAlt size={16} className="animate-bounce" />
                    Track Live Bus
                  </button>
                )}

                <button 
                  onClick={() => handleCancel(activeBooking._id)}
                  className="px-6 py-3 border border-slate-800 hover:bg-rose-500/10 hover:text-rose-400 text-slate-300 font-semibold rounded-xl transition-all duration-200 text-center"
                >
                  Cancel Booking
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-slate-950/20 border border-slate-800/80 border-dashed rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-4">
              <div className="p-4 bg-slate-900 rounded-2xl text-slate-600">
                <FaBus size={40} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-lg text-white">No Comm commute booked yet</h4>
                <p className="text-slate-400 text-sm max-w-sm">
                  You don't have any active transportation booking. Book your bus seat to guarantee your ride to school!
                </p>
              </div>
              <Link 
                to="/buses"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 group mt-2"
              >
                Book a Bus Seat
                <FaChevronRight className="transition-transform group-hover:translate-x-1" size={12} />
              </Link>
            </div>
          )}
        </div>

        {/* Co-Riders Section */}
        {activeBooking && activeBooking.bookingStatus === 'Confirmed' && coRiders.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
              Fellow Co-Riders on Bus
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {coRiders.map((rider, i) => (
                <div key={i} className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3 hover:border-slate-700/60 transition-colors">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                    {rider.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <span className="font-bold text-sm text-slate-200 block truncate">{rider.name}</span>
                    <span className="text-xs text-blue-400 font-bold uppercase block mt-0.5">Seat #{rider.seatNumber}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
      </div>
    </SidebarLayout>
  );
}
