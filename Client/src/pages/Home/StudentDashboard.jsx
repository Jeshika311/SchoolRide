import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SidebarLayout from '../../components/Layout/SidebarLayout';
import { fetchApi } from '../../api';
import { FaBus, FaHistory, FaMapMarkerAlt, FaCreditCard, FaTicketAlt, FaChevronRight } from 'react-icons/fa';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [activeBooking, setActiveBooking] = useState(null);
  const [coRiders, setCoRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = JSON.parse(localStorage.getItem('authUser') || '{}');
  const activeBusId = activeBooking?.busId?._id || activeBooking?.busId;
  const canTrackLiveBus = Boolean(activeBooking && activeBooking.bookingStatus === 'Confirmed' && activeBusId);

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
    'Confirmed': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    'Payment Pending': 'bg-amber-50 text-amber-700 border border-amber-200',
    'Pending': 'bg-sky-50 text-sky-700 border border-sky-200',
    'Cancelled': 'bg-rose-50 text-rose-700 border border-rose-200'
  };

  return (
    <SidebarLayout>
      <div className="max-w-6xl mx-auto space-y-8 text-slate-900">
        
        {/* Welcome Hero */}
        <div className="relative overflow-hidden bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 rounded-3xl p-6 md:p-8 shadow-xl shadow-sky-500/10 border border-sky-200">
          <div className="relative z-10 space-y-2">
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
              Hello, {user.name || 'Student'}!
            </h1>
            <p className="text-blue-50 text-sm md:text-base max-w-xl font-medium">
              Your academic journey starts here. Book, track, and manage your school commute seamlessly.
            </p>
            <div className="flex flex-wrap gap-3 pt-4">
              <button
                onClick={() => navigate('/buses')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-sky-700 font-extrabold shadow-lg shadow-blue-950/10 hover:bg-sky-50 transition-colors"
              >
                <FaBus size={16} />
                Book a Bus
              </button>
              <button
                onClick={() => (canTrackLiveBus ? navigate(`/track/${activeBusId}`) : navigate('/ride-status'))}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/30 bg-white/15 text-white font-extrabold hover:bg-white/25 transition-colors"
              >
                <FaMapMarkerAlt size={16} />
                {canTrackLiveBus ? 'Track Live Bus' : 'View Ride Status'}
              </button>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none flex items-center justify-center">
            <FaBus size={150} className="text-white transform rotate-12" />
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm font-semibold">
            {error}
          </div>
        )}

        {/* Info Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-sky-100 flex items-center gap-4 shadow-sm hover:border-sky-200 transition-colors">
            <div className="p-4 bg-sky-50 rounded-xl text-sky-600">
              <FaTicketAlt size={22} />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Commute Seat</span>
              <span className="text-lg font-bold text-slate-900 block mt-0.5">
                {activeBooking ? `Seat #${activeBooking.seatNumber}` : 'Not Booked'}
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-sky-100 flex items-center gap-4 shadow-sm hover:border-sky-200 transition-colors">
            <div className="p-4 bg-emerald-50 rounded-xl text-emerald-600">
              <FaCreditCard size={22} />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Payment Status</span>
              <span className="text-lg font-bold text-slate-900 block mt-0.5">
                {activeBooking ? activeBooking.bookingStatus : 'N/A'}
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-sky-100 flex items-center gap-4 shadow-sm hover:border-sky-200 transition-colors">
            <div className="p-4 bg-sky-50 rounded-xl text-sky-600">
              <FaMapMarkerAlt size={22} />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Ride Live Map</span>
              <span className="text-lg font-bold text-slate-900 block mt-0.5">
                {activeBooking && activeBooking.bookingStatus === 'Confirmed' ? 'Active' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Core Booking Card Section */}
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight mb-4 flex items-center gap-2">
            Active Commute Booking
          </h3>

          {loading ? (
            <div className="h-48 bg-white animate-pulse border border-sky-100 rounded-2xl flex items-center justify-center text-slate-500 shadow-sm">
              Loading booking details...
            </div>
          ) : activeBooking ? (
            <div className="bg-white border border-sky-100 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-sky-200 shadow-sm transition-all duration-300">
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                    {activeBooking.busId?.busNumber || 'Bus Detail'}
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${statusColors[activeBooking.bookingStatus]}`}>
                    {activeBooking.bookingStatus}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-slate-900">{activeBooking.busId?.routeName || 'Route Name'}</h4>
                  <p className="text-slate-500 text-sm">
                    Stops: <strong className="text-slate-700">{activeBooking.pickupStop}</strong> to <strong className="text-slate-700">{activeBooking.dropStop}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-6 text-sm text-slate-600">
                  <div>
                    <span className="text-xs text-slate-500 block">SEAT ASSIGNED</span>
                    <span className="font-extrabold text-base text-sky-700">Seat {activeBooking.seatNumber}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">FARED VALUE</span>
                    <span className="font-extrabold text-base text-slate-700">₹1,500.00 / month</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                {activeBooking.bookingStatus === 'Payment Pending' && (
                  <button 
                    onClick={() => navigate(`/payment/${activeBooking._id}`)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-700 to-cyan-600 hover:from-sky-600 hover:to-cyan-500 text-white font-semibold rounded-xl border border-sky-600 shadow-lg shadow-sky-700/20 transition-all duration-200"
                  >
                    <FaCreditCard size={16} />
                    Complete Payment
                  </button>
                )}

                {activeBooking.bookingStatus === 'Confirmed' && (
                  <button 
                    onClick={() => navigate(`/track/${activeBusId}`)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-sky-50 text-sky-700 font-semibold rounded-xl shadow-sm border border-sky-200 transition-all duration-200"
                  >
                    <FaMapMarkerAlt size={16} className="animate-bounce" />
                    Track Live Bus
                  </button>
                )}

                <button 
                  onClick={() => handleCancel(activeBooking._id)}
                  className="px-6 py-3 border border-sky-200 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-semibold rounded-xl transition-all duration-200 text-center"
                >
                  Cancel Booking
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-sky-100 border-dashed rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-4 shadow-sm">
              <div className="p-4 bg-sky-50 rounded-2xl text-sky-500">
                <FaBus size={40} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-lg text-slate-900">No commute booked yet</h4>
                <p className="text-slate-500 text-sm max-w-sm">
                  You don't have any active transportation booking. Book your bus seat to guarantee your ride to school!
                </p>
              </div>
              <Link 
                to="/buses"
                className="flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all duration-200 group mt-2"
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
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Fellow Co-Riders on Bus
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {coRiders.map((rider, i) => (
                <div key={i} className="bg-white border border-sky-100 rounded-2xl p-4 flex items-center gap-3 hover:border-sky-200 shadow-sm transition-colors">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                    {rider.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <span className="font-bold text-sm text-slate-900 block truncate">{rider.name}</span>
                    <span className="text-xs text-sky-600 font-bold uppercase block mt-0.5">Seat #{rider.seatNumber}</span>
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
