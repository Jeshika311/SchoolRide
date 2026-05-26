import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/Layout/SidebarLayout';
import { fetchApi } from '../api';
import { FaBus, FaTicketAlt, FaCreditCard, FaMapMarkedAlt, FaPlus, FaChevronRight } from 'react-icons/fa';
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
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Command Center</h1>
          <p className="text-sm text-slate-400">Overview of student transit fleets, active bookings, and payment records</p>
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
              <div key={n} className="h-28 bg-slate-950/20 border border-slate-800/80 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Bus fleet */}
            <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800/80">
              <div className="flex items-center justify-between text-blue-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Bus Fleet</span>
                <FaBus size={18} />
              </div>
              <span className="text-3xl font-extrabold text-white block mt-2">{stats.busesCount}</span>
            </div>

            {/* Bookings */}
            <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800/80">
              <div className="flex items-center justify-between text-indigo-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Booking Requests</span>
                <FaTicketAlt size={18} />
              </div>
              <span className="text-3xl font-extrabold text-white block mt-2">{stats.bookingsCount}</span>
            </div>

            {/* Active Seats */}
            <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800/80">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Confirmed Seats</span>
                <FaTicketAlt size={18} />
              </div>
              <span className="text-3xl font-extrabold text-white block mt-2">{stats.confirmedBookings}</span>
            </div>

            {/* Revenue */}
            <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800/80">
              <div className="flex items-center justify-between text-yellow-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Collected Revenue</span>
                <FaCreditCard size={18} />
              </div>
              <span className="text-3xl font-extrabold text-white block mt-2">₹{stats.totalRevenue.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Quick Management Links */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white tracking-tight">Fleet Operations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Manage buses link */}
            <div 
              onClick={() => navigate('/admin/buses')}
              className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700/60 cursor-pointer flex justify-between items-center group transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-500/10 rounded-xl text-blue-400">
                  <FaBus size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-white">Manage Bus Fleet</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Add routes, stops, and configure passenger seat counts</p>
                </div>
              </div>
              <FaChevronRight className="text-slate-500 group-hover:translate-x-1 transition-transform" size={14} />
            </div>

            {/* Manage bookings link */}
            <div 
              onClick={() => navigate('/admin/bookings')}
              className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700/60 cursor-pointer flex justify-between items-center group transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-500/10 rounded-xl text-indigo-400">
                  <FaTicketAlt size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-white">Manage Bookings</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Cancel bookings, check passenger seat assignments, release slots</p>
                </div>
              </div>
              <FaChevronRight className="text-slate-500 group-hover:translate-x-1 transition-transform" size={14} />
            </div>

            {/* View payments link */}
            <div 
              onClick={() => navigate('/admin/payments')}
              className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700/60 cursor-pointer flex justify-between items-center group transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-4 bg-yellow-500/10 rounded-xl text-yellow-400">
                  <FaCreditCard size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-white">Payment Records</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Track monthly student transit fees, audit invoices</p>
                </div>
              </div>
              <FaChevronRight className="text-slate-500 group-hover:translate-x-1 transition-transform" size={14} />
            </div>

            {/* View maps telemetry link */}
            <div 
              onClick={() => navigate('/admin/tracking')}
              className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700/60 cursor-pointer flex justify-between items-center group transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-4 bg-emerald-500/10 rounded-xl text-emerald-400">
                  <FaMapMarkedAlt size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-white">GPS Telemetry simulator</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Update live coordinates, simulate school route transit</p>
                </div>
              </div>
              <FaChevronRight className="text-slate-500 group-hover:translate-x-1 transition-transform" size={14} />
            </div>

          </div>
        </div>

      </div>
    </SidebarLayout>
  );
}
