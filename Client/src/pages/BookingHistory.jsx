import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout from '../components/Layout/SidebarLayout';
import { fetchApi } from '../api';
import { FaBus, FaCalendarAlt, FaCreditCard, FaTicketAlt, FaAngleRight } from 'react-icons/fa';

export default function BookingHistory() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { status, data } = await fetchApi('/bookings/my-bookings');
      if (status === 200) {
        setBookings(data.data);
      } else {
        setError(data.message || 'Failed to retrieve bookings.');
      }
    } catch (err) {
      setError(err.message || 'Error occurred fetching bookings.');
    } finally {
      setLoading(false);
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Your Commute Bookings</h1>
          <p className="text-sm text-slate-400">View and manage all your school transportation histories</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-28 bg-slate-950/20 border border-slate-800 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div 
                key={booking._id}
                className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700/60 transition-colors"
              >
                <div className="space-y-3">
                  {/* Status & Date */}
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${statusColors[booking.bookingStatus]}`}>
                      {booking.bookingStatus}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <FaCalendarAlt size={10} />
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Bus and Route Info */}
                  <div>
                    <h3 className="font-extrabold text-white flex items-center gap-2">
                      <FaBus size={14} className="text-blue-400" />
                      {booking.busId?.routeName || 'Bus Commute'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Bus: <strong className="text-slate-200">{booking.busId?.busNumber || 'N/A'}</strong> | 
                      Seat: <strong className="text-blue-400">Seat {booking.seatNumber}</strong> | 
                      Stops: <strong className="text-slate-200">{booking.pickupStop}</strong> to <strong className="text-slate-200">{booking.dropStop}</strong>
                    </p>
                  </div>
                </div>

                {/* Right Action Button */}
                <div className="w-full sm:w-auto">
                  {booking.bookingStatus === 'Payment Pending' && (
                    <button
                      onClick={() => navigate(`/payment/${booking._id}`)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow transition-all duration-200"
                    >
                      <FaCreditCard size={12} />
                      Complete Payment
                    </button>
                  )}
                  {booking.bookingStatus === 'Confirmed' && (
                    <button
                      onClick={() => navigate(`/payment/${booking._id}`)}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-300 border border-slate-800 hover:bg-slate-900 rounded-lg transition-colors"
                    >
                      View Invoice
                      <FaAngleRight size={12} />
                    </button>
                  )}
                  {booking.bookingStatus === 'Cancelled' && (
                    <span className="text-xs text-slate-500 italic block py-2">
                      Seat Released
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-950/20 border border-slate-800/80 border-dashed rounded-2xl p-12 text-center text-slate-400">
            You don't have any booking records yet.
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
