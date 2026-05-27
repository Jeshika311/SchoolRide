import React, { useState, useEffect } from 'react';
import SidebarLayout from '../../components/Layout/SidebarLayout';
import { fetchApi } from '../../api';
import { FaBus, FaTicketAlt, FaCreditCard, FaMapMarkedAlt, FaChevronRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    busesCount: 0,
    bookingsCount: 0,
    confirmedBookings: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      const busesRes = await fetchApi('/buses');
      const bookingsRes = await fetchApi('/bookings');
      const paymentsRes = await fetchApi('/payments');

      const busesCount = busesRes.status === 200 ? busesRes.data.data.length : 0;
      const bookings = bookingsRes.status === 200 ? bookingsRes.data.data : [];
      const payments = paymentsRes.status === 200 ? paymentsRes.data.data : [];

      const bookingsCount = bookings.length;
      const confirmedBookings = bookings.filter(b => b.bookingStatus === 'Confirmed').length;
      
      const totalRevenue = payments
        .filter(p => p.paymentStatus === 'Paid')
        .reduce((sum, p) => sum + p.amount, 0);

      setStats({
        busesCount,
        bookingsCount,
        confirmedBookings,
        totalRevenue
      });
    } catch {
      setError('Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Section */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-600">Admin panel</p>
          <h1 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tight">Admin Command Center</h1>
          <p className="text-sm text-slate-500 max-w-2xl">Overview of student transit fleets, active bookings, and payment records</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div className="h-28 bg-white border border-sky-100 animate-pulse rounded-3xl shadow-sm" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Bus fleet */}
              <div className="bg-white p-6 rounded-3xl border border-sky-100 shadow-sm shadow-sky-100/50 ring-1 ring-sky-50/60">
                <div className="flex items-center justify-between text-sky-600">
                  <span className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Active Bus Fleet</span>
                <FaBus size={18} />
              </div>
                <span className="text-3xl font-black text-slate-950 block mt-2">{stats.busesCount}</span>
            </div>

            {/* Bookings */}
              <div className="bg-white p-6 rounded-3xl border border-sky-100 shadow-sm shadow-sky-100/50 ring-1 ring-sky-50/60">
                <div className="flex items-center justify-between text-blue-600">
                  <span className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Total Booking Requests</span>
                <FaTicketAlt size={18} />
              </div>
                <span className="text-3xl font-black text-slate-950 block mt-2">{stats.bookingsCount}</span>
            </div>

            {/* Active Seats */}
              <div className="bg-white p-6 rounded-3xl border border-sky-100 shadow-sm shadow-sky-100/50 ring-1 ring-sky-50/60">
                <div className="flex items-center justify-between text-emerald-600">
                  <span className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Confirmed Seats</span>
                <FaTicketAlt size={18} />
              </div>
                <span className="text-3xl font-black text-slate-950 block mt-2">{stats.confirmedBookings}</span>
            </div>

            {/* Revenue */}
              <div className="bg-white p-6 rounded-3xl border border-sky-100 shadow-sm shadow-sky-100/50 ring-1 ring-sky-50/60">
                <div className="flex items-center justify-between text-amber-500">
                  <span className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Collected Revenue</span>
                <FaCreditCard size={18} />
              </div>
                <span className="text-3xl font-black text-slate-950 block mt-2">₹{stats.totalRevenue.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Quick Management Links */}
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Fleet Operations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Manage buses link */}
            <div 
              onClick={() => navigate('/admin/buses')}
                className="bg-white border border-sky-100 rounded-3xl p-6 hover:border-sky-200 hover:shadow-md hover:shadow-sky-100/60 cursor-pointer flex justify-between items-center group transition-all"
            >
              <div className="flex items-center gap-4">
                  <div className="p-4 bg-sky-50 rounded-2xl text-sky-600 border border-sky-100">
                  <FaBus size={20} />
                </div>
                <div>
                    <h4 className="font-extrabold text-slate-950">Manage Bus Fleet</h4>
                    <p className="text-sm text-slate-500 mt-0.5">Add routes, stops, and configure passenger seat counts</p>
                </div>
              </div>
                <FaChevronRight className="text-slate-400 group-hover:translate-x-1 group-hover:text-sky-600 transition-transform" size={14} />
            </div>

            {/* Manage bookings link */}
            <div 
              onClick={() => navigate('/admin/bookings')}
              className="bg-white border border-sky-100 rounded-3xl p-6 hover:border-sky-200 hover:shadow-md hover:shadow-sky-100/60 cursor-pointer flex justify-between items-center group transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 border border-blue-100">
                  <FaTicketAlt size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-950">Manage Bookings</h4>
                  <p className="text-sm text-slate-500 mt-0.5">Cancel bookings, check passenger seat assignments, release slots</p>
                </div>
              </div>
              <FaChevronRight className="text-slate-400 group-hover:translate-x-1 group-hover:text-sky-600 transition-transform" size={14} />
            </div>

            {/* View payments link */}
            <div 
              onClick={() => navigate('/admin/payments')}
              className="bg-white border border-sky-100 rounded-3xl p-6 hover:border-sky-200 hover:shadow-md hover:shadow-sky-100/60 cursor-pointer flex justify-between items-center group transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-4 bg-amber-50 rounded-2xl text-amber-500 border border-amber-100">
                  <FaCreditCard size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-950">Payment Records</h4>
                  <p className="text-sm text-slate-500 mt-0.5">Track monthly student transit fees, audit invoices</p>
                </div>
              </div>
              <FaChevronRight className="text-slate-400 group-hover:translate-x-1 group-hover:text-sky-600 transition-transform" size={14} />
            </div>

            {/* View maps telemetry link */}
            <div 
              onClick={() => navigate('/admin/tracking')}
              className="bg-white border border-sky-100 rounded-3xl p-6 hover:border-sky-200 hover:shadow-md hover:shadow-sky-100/60 cursor-pointer flex justify-between items-center group transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
                  <FaMapMarkedAlt size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-950">GPS Telemetry simulator</h4>
                  <p className="text-sm text-slate-500 mt-0.5">Update live coordinates, simulate school route transit</p>
                </div>
              </div>
              <FaChevronRight className="text-slate-400 group-hover:translate-x-1 group-hover:text-sky-600 transition-transform" size={14} />
            </div>

          </div>
        </div>

      </div>
    </SidebarLayout>
  );
}
