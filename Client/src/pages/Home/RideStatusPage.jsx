import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout from '../../components/Layout/SidebarLayout';
import { fetchApi } from '../../api';
import { FaBus, FaMapMarkerAlt, FaClock, FaRoute, FaCheckCircle, FaDotCircle, FaArrowRight } from 'react-icons/fa';

const progressOrder = ['Pending', 'Payment Pending', 'Confirmed', 'Picked Up', 'Completed'];

const normalizeStatus = (booking) => {
  const raw = (booking.bookingStatus || booking.status || booking.trip_status || 'Pending').toString();
  if (['pending', 'Pending'].includes(raw)) return 'Pending';
  if (['payment pending', 'Payment Pending'].includes(raw)) return 'Payment Pending';
  if (['confirmed', 'Confirmed', 'accepted', 'Accepted'].includes(raw)) return 'Confirmed';
  if (['picked', 'Picked', 'picked up', 'Picked Up', 'in transit', 'In Transit'].includes(raw.toLowerCase())) return 'Picked Up';
  if (['completed', 'Completed', 'dropped', 'Dropped'].includes(raw)) return 'Completed';
  if (['cancelled', 'Cancelled', 'rejected', 'Rejected'].includes(raw)) return 'Cancelled';
  return raw.replace(/^[a-z]/, (match) => match.toUpperCase());
};

export default function RideStatusPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = JSON.parse(localStorage.getItem('authUser') || '{}');
  const userRole = user.role || localStorage.getItem('userRole') || 'student';

  useEffect(() => {
    fetchRideStatus();
  }, []);

  const fetchRideStatus = async () => {
    try {
      setLoading(true);
      const endpoint = userRole === 'parent' ? '/booking/parent' : '/bookings/my-bookings';
      const { status, data } = await fetchApi(endpoint);
      if (status === 200) {
        const normalized = (data.data || []).map((booking) => ({
          id: booking._id,
          status: normalizeStatus(booking),
          routeName: booking.busId?.routeName || booking.route_id?.route_name || booking.route_id?.name || 'Bus Commute',
          busNumber: booking.busId?.busNumber || booking.vehicle?.busNumber || booking.vehicle?.registration_number || 'N/A',
          seatNumber: booking.seatNumber || booking.seat_number || 'N/A',
          pickupStop: booking.pickupStop || booking.pickup_point || 'N/A',
          dropStop: booking.dropStop || booking.drop_point || 'N/A',
          busId: booking.busId?._id || booking.busId || null,
          createdAt: booking.createdAt,
          raw: booking,
        }));
        setBookings(normalized);
      } else {
        setError(data.message || 'Failed to fetch ride status.');
      }
    } catch (err) {
      setError(err.message || 'Error occurred fetching ride status.');
    } finally {
      setLoading(false);
    }
  };

  const currentBooking = useMemo(
    () => bookings.find((booking) => ['Confirmed', 'Picked Up', 'Payment Pending', 'Pending'].includes(booking.status)) || bookings[0] || null,
    [bookings]
  );

  const currentStepIndex = useMemo(() => {
    if (!currentBooking) return 0;
    const statusIndex = progressOrder.indexOf(currentBooking.status);
    return statusIndex >= 0 ? statusIndex : 0;
  }, [currentBooking]);

  return (
    <SidebarLayout>
      <div className="max-w-5xl mx-auto space-y-6 text-slate-900">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Ride Status</h1>
            <p className="text-sm text-slate-500">See the current stage of your ride from request to completion.</p>
          </div>
          <button
            onClick={() => navigate('/history')}
            className="px-4 py-2 rounded-xl border border-sky-100 bg-white text-sky-700 text-sm font-semibold shadow-sm hover:bg-sky-50"
          >
            View Booking History
          </button>
        </div>

        {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

        {loading ? (
          <div className="h-80 bg-white border border-sky-100 rounded-3xl shadow-sm animate-pulse" />
        ) : currentBooking ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-sky-100 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-100 text-sky-700 text-xs font-bold uppercase tracking-wider">
                    <FaBus size={12} /> {currentBooking.busNumber}
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900">{currentBooking.routeName}</h2>
                  <p className="text-sm text-slate-500">Seat {currentBooking.seatNumber} • {currentBooking.pickupStop} to {currentBooking.dropStop}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Current Status</div>
                  <div className="mt-1 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-100 text-sky-700 text-sm font-bold">
                    <FaDotCircle size={10} /> {currentBooking.status}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {progressOrder.map((step, index) => {
                  const active = index <= currentStepIndex;
                  return (
                    <div key={step} className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full border flex items-center justify-center ${active ? 'bg-sky-600 border-sky-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        {active ? <FaCheckCircle size={16} /> : <FaClock size={16} />}
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-bold ${active ? 'text-slate-900' : 'text-slate-500'}`}>{step}</div>
                        <div className="h-2 mt-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full rounded-full ${active ? 'bg-sky-500 w-full' : 'bg-transparent w-0'}`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {currentBooking.status === 'Confirmed' && currentBooking.busId && (
                <button
                  onClick={() => navigate(`/track/${currentBooking.busId}`)}
                  className="inline-flex items-center justify-center gap-2 min-h-[3rem] px-6 py-3 rounded-xl border border-sky-600 bg-gradient-to-r from-sky-700 to-cyan-600 text-white font-bold shadow-lg shadow-sky-700/20 hover:from-sky-600 hover:to-cyan-500 transition-all duration-200"
                >
                  <FaMapMarkerAlt size={16} />
                  Open Live Tracking
                </button>
              )}
            </div>

            <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <FaRoute className="text-sky-600" /> Ride Summary
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between"><span className="text-slate-500">Booked On</span><span className="font-semibold text-slate-900">{currentBooking.createdAt ? new Date(currentBooking.createdAt).toLocaleDateString() : 'N/A'}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-500">Seat</span><span className="font-semibold text-slate-900">{currentBooking.seatNumber}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-500">Pickup</span><span className="font-semibold text-slate-900">{currentBooking.pickupStop}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-500">Drop</span><span className="font-semibold text-slate-900">{currentBooking.dropStop}</span></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-sky-100 border-dashed rounded-3xl p-12 text-center text-slate-500 shadow-sm">
            No current ride found. Book a bus to see ride status.
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}