import React, { useState, useEffect } from 'react';
import SidebarLayout from '../../components/Layout/SidebarLayout';
import { fetchApi } from '../../api';
import { FaTrash, FaCheck, FaTimes, FaUser, FaBus } from 'react-icons/fa';

export default function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { status, data } = await fetchApi('/bookings');
      if (status === 200) {
        setBookings(data.data);
      } else {
        setError(data.message || 'Failed to fetch bookings.');
      }
    } catch (err) {
      setError(err.message || 'Error occurred fetching bookings.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This will release the seat immediately.')) {
      return;
    }

    try {
      const { status, data } = await fetchApi(`/bookings/${id}`, {
        method: 'DELETE'
      });
      if (status === 200) {
        alert('Booking cancelled and seat released.');
        fetchBookings();
      } else {
        alert(data.message || 'Failed to cancel booking.');
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
      <div className="max-w-7xl mx-auto space-y-6 text-slate-900">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-600">Booking control</p>
          <h1 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tight">Manage Passenger Bookings</h1>
          <p className="text-sm text-slate-500 max-w-2xl">Overview of all active reservations and seat allocations</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm shadow-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-28 bg-white border border-sky-100 animate-pulse rounded-3xl shadow-sm" />
            ))}
          </div>
        ) : bookings.length > 0 ? (
          <div className="bg-white rounded-3xl border border-sky-100 overflow-hidden shadow-sm shadow-sky-100/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-sky-50">
                  <tr className="border-b border-sky-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Commute Fleet</th>
                    <th className="px-6 py-4">Seat Assigned</th>
                    <th className="px-6 py-4">Commute Stops</th>
                    <th className="px-6 py-4">Payment / Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100 text-sm text-slate-700">
                  {bookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-sky-50 transition-colors">
                      {/* Student details */}
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">{booking.studentId?.name || 'Unknown Student'}</span>
                          <span className="text-xs text-slate-500 block">{booking.studentId?.email}</span>
                          <span className="text-xs text-slate-400 block">{booking.studentId?.phone_number}</span>
                        </div>
                      </td>

                      {/* Bus details */}
                      <td className="px-6 py-4 font-semibold">
                        <div className="space-y-0.5">
                          <span className="text-slate-900 block">{booking.busId?.busNumber || 'N/A'}</span>
                          <span className="text-xs text-slate-500 block">{booking.busId?.routeName}</span>
                        </div>
                      </td>

                      {/* Seat details */}
                      <td className="px-6 py-4 font-extrabold text-sky-700">
                        Seat #{booking.seatNumber}
                      </td>

                      {/* Stops */}
                      <td className="px-6 py-4 text-xs space-y-0.5">
                        <div>
                          <strong className="text-slate-500">Pickup:</strong> {booking.pickupStop}
                        </div>
                        <div>
                          <strong className="text-slate-500">Drop:</strong> {booking.dropStop}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${statusColors[booking.bookingStatus]}`}>
                          {booking.bookingStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        {booking.bookingStatus !== 'Cancelled' ? (
                          <button
                            onClick={() => handleCancelBooking(booking._id)}
                            className="px-3 py-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold rounded-lg transition-colors"
                            title="Cancel Booking"
                          >
                            Release Seat
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Inactive</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-sky-100 border-dashed rounded-3xl p-12 text-center text-slate-500 shadow-sm">
            No booking requests found on the platform yet.
          </div>
        )}

      </div>
    </SidebarLayout>
  );
}
