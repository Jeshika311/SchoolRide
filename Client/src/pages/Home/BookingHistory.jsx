import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout from '../../components/Layout/SidebarLayout';
import { fetchApi } from '../../api';
import { FaBus, FaCalendarAlt, FaCreditCard, FaTicketAlt, FaAngleRight } from 'react-icons/fa';

export default function BookingHistory() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = JSON.parse(localStorage.getItem('authUser') || '{}');
  const userRole = user.role || localStorage.getItem('userRole') || 'student';

  const normalizeBooking = (booking) => ({
    id: booking._id,
    status: (booking.bookingStatus || booking.status || booking.trip_status || 'Pending').replace(/^[a-z]/, (match) => match.toUpperCase()),
    createdAt: booking.createdAt,
    routeName: booking.busId?.routeName || booking.route_id?.route_name || booking.route_id?.name || 'Bus Commute',
    busNumber: booking.busId?.busNumber || booking.vehicle?.busNumber || booking.vehicle?.registration_number || 'N/A',
    seatNumber: booking.seatNumber || booking.seat_number || 'N/A',
    pickupStop: booking.pickupStop || booking.pickup_point || 'N/A',
    dropStop: booking.dropStop || booking.drop_point || 'N/A',
    busId: booking.busId?._id || booking.busId || null,
    raw: booking,
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const endpoint = userRole === 'parent' ? '/booking/parent' : '/bookings/my-bookings';
      const { status, data } = await fetchApi(endpoint);
      if (status === 200) {
        const normalized = (data.data || []).map(normalizeBooking);
        setBookings(normalized);
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
    'Confirmed': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    'Payment Pending': 'bg-amber-50 text-amber-700 border border-amber-200',
    'Pending': 'bg-blue-50 text-blue-700 border border-blue-200',
    'Cancelled': 'bg-rose-50 text-rose-700 border border-rose-200',
    'Accepted': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    'Rejected': 'bg-rose-50 text-rose-700 border border-rose-200',
    'Completed': 'bg-slate-100 text-slate-655 border border-slate-200'
  };

  const liveStatuses = new Set(['Confirmed', 'Accepted']);
  const upcomingStatuses = new Set(['Pending', 'Payment Pending']);
  const previousStatuses = new Set(['Cancelled', 'Rejected', 'Completed']);

  const liveBookings = bookings.filter((booking) => liveStatuses.has(booking.status));
  const upcomingBookings = bookings.filter((booking) => upcomingStatuses.has(booking.status));
  const previousBookings = bookings.filter((booking) => previousStatuses.has(booking.status));

  const sectionCardClass = 'bg-white border border-slate-200 rounded-3xl p-6 shadow-sm';

  const renderBookingCard = (booking, trailingAction) => (
    <div key={booking.id} className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors text-left">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${statusColors[booking.status] || statusColors.Pending}`}>
            {booking.status}
          </span>
          <span className="text-xs text-slate-500 flex items-center gap-1 font-semibold">
            <FaCalendarAlt size={10} />
            {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'}
          </span>
        </div>

        <div>
          <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-base">
            <FaBus size={14} className="text-blue-600" />
            {booking.routeName}
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Bus: <strong className="text-slate-700 font-semibold">{booking.busNumber}</strong> | 
            Seat: <strong className="text-blue-600 font-extrabold">Seat {booking.seatNumber}</strong> | 
            Stops: <strong className="text-slate-700 font-semibold">{booking.pickupStop}</strong> to <strong className="text-slate-700 font-semibold">{booking.dropStop}</strong>
          </p>
        </div>
      </div>

      <div className="w-full sm:w-auto">{trailingAction}</div>
    </div>
  );

  return (
    <SidebarLayout>
      <div className="max-w-5xl mx-auto space-y-6 text-slate-900">
        <div className="text-left">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Your Commute Bookings</h1>
          <p className="text-sm text-slate-500">View live, upcoming, and previous bookings in one place</p>
        </div>

        {/* Counter cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-left">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-extrabold">Live Bookings</div>
            <div className="text-3xl font-black text-blue-600 mt-1">{liveBookings.length}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-left">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-extrabold">Upcoming Bookings</div>
            <div className="text-3xl font-black text-blue-600 mt-1">{upcomingBookings.length}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-left">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-extrabold">Previous Bookings</div>
            <div className="text-3xl font-black text-blue-600 mt-1">{previousBookings.length}</div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm text-left">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-28 bg-white border border-slate-200 animate-pulse rounded-3xl shadow-sm" />
            ))}
          </div>
        ) : bookings.length > 0 ? (
          <div className="space-y-6">
            
            {/* Live Bookings */}
            <section className={sectionCardClass}>
              <div className="text-left mb-4">
                <h2 className="text-lg font-extrabold text-slate-900">Live Bookings</h2>
                <p className="text-xs text-slate-500 mt-0.5">Current rides that are confirmed or already active.</p>
              </div>
              <div className="space-y-4">
                {liveBookings.length > 0 ? liveBookings.map((booking) => renderBookingCard(
                  booking,
                  <button
                    onClick={() => booking.busId && navigate(`/track/${booking.busId}`)}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
                  >
                    View Ride Status
                    <FaAngleRight size={12} />
                  </button>
                )) : <div className="text-xs text-slate-400 text-left py-2 font-semibold">No live rides right now.</div>}
              </div>
            </section>

            {/* Upcoming Bookings */}
            <section className={sectionCardClass}>
              <div className="text-left mb-4">
                <h2 className="text-lg font-extrabold text-slate-900">Upcoming Bookings</h2>
                <p className="text-xs text-slate-500 mt-0.5">Bookings waiting for payment or confirmation.</p>
              </div>
              <div className="space-y-4">
                {upcomingBookings.length > 0 ? upcomingBookings.map((booking) => renderBookingCard(
                  booking,
                  booking.status === 'Payment Pending' ? (
                    <button
                      onClick={() => navigate(`/payment/${booking.id}`)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-500/20 transition-all"
                    >
                      <FaCreditCard size={12} />
                      Complete Payment
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 italic block py-2 font-semibold">Awaiting confirmation</span>
                  )
                )) : <div className="text-xs text-slate-400 text-left py-2 font-semibold">No upcoming bookings.</div>}
              </div>
            </section>

            {/* Previous Bookings */}
            <section className={sectionCardClass}>
              <div className="text-left mb-4">
                <h2 className="text-lg font-extrabold text-slate-900">Previous Bookings</h2>
                <p className="text-xs text-slate-500 mt-0.5">Completed, cancelled, or closed bookings.</p>
              </div>
              <div className="space-y-4">
                {previousBookings.length > 0 ? previousBookings.map((booking) => renderBookingCard(
                  booking,
                  <span className="text-xs text-slate-400 italic block py-2 font-semibold">Archived booking</span>
                )) : <div className="text-xs text-slate-400 text-left py-2 font-semibold">No previous bookings yet.</div>}
              </div>
            </section>

          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 shadow-sm">
            You don't have any booking records yet.
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
