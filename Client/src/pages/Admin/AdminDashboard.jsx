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
        <div className="space-y-2 text-left animate-fadeIn">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-indigo-400">Admin panel</p>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Admin Command Center</h1>
          <p className="text-sm text-slate-400 max-w-2xl">Overview of student transit fleets, active bookings, and payment records</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm text-left">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-28 bg-slate-900/20 border border-slate-850 animate-pulse rounded-3xl shadow-sm" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
            {/* Bus fleet */}
            <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800/80 shadow-xl text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-indigo-500/5 blur-xl pointer-events-none" />
              <div className="flex items-center justify-between text-indigo-450">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Active Bus Fleet</span>
                <FaBus size={16} className="text-indigo-400" />
              </div>
              <span className="text-3xl font-black text-white block mt-2">{stats.busesCount}</span>
            </div>

            {/* Bookings */}
            <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800/80 shadow-xl text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-blue-500/5 blur-xl pointer-events-none" />
              <div className="flex items-center justify-between text-blue-450">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Total Requests</span>
                <FaTicketAlt size={16} className="text-blue-400" />
              </div>
              <span className="text-3xl font-black text-white block mt-2">{stats.bookingsCount}</span>
            </div>

            {/* Active Seats */}
            <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800/80 shadow-xl text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-emerald-500/5 blur-xl pointer-events-none" />
              <div className="flex items-center justify-between text-emerald-450">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Confirmed Seats</span>
                <FaTicketAlt size={16} className="text-emerald-400" />
              </div>
              <span className="text-3xl font-black text-white block mt-2">{stats.confirmedBookings}</span>
            </div>

            {/* Revenue */}
            <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800/80 shadow-xl text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-amber-500/5 blur-xl pointer-events-none" />
              <div className="flex items-center justify-between text-amber-450">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Collected Revenue</span>
                <FaCreditCard size={16} className="text-amber-400" />
              </div>
              <span className="text-3xl font-black text-white block mt-2">₹{stats.totalRevenue.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Quick Management Links */}
        <div className="space-y-4 text-left">
          <h3 className="text-base font-extrabold text-white tracking-tight">Fleet Operations</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Manage buses link */}
            <div 
              onClick={() => navigate('/admin/buses')}
              className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 hover:border-indigo-500/60 hover:shadow-2xl hover:shadow-indigo-500/5 cursor-pointer flex justify-between items-center group transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-950 rounded-2xl text-indigo-400 border border-indigo-900/60">
                  <FaBus size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-sm">Manage Bus Fleet</h4>
                  <p className="text-xs text-slate-400 mt-1">Add routes, stops, and configure passenger seat counts</p>
                </div>
              </div>
              <FaChevronRight className="text-slate-500 group-hover:translate-x-1 group-hover:text-indigo-400 transition-transform" size={12} />
            </div>

            {/* Manage bookings link */}
            <div 
              onClick={() => navigate('/admin/bookings')}
              className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 hover:border-indigo-500/60 hover:shadow-2xl hover:shadow-indigo-500/5 cursor-pointer flex justify-between items-center group transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-950 rounded-2xl text-blue-400 border border-blue-900/60">
                  <FaTicketAlt size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-sm">Manage Bookings</h4>
                  <p className="text-xs text-slate-400 mt-1">Cancel bookings, check passenger seat assignments, release slots</p>
                </div>
              </div>
              <FaChevronRight className="text-slate-500 group-hover:translate-x-1 group-hover:text-indigo-400 transition-transform" size={12} />
            </div>

            {/* View payments link */}
            <div 
              onClick={() => navigate('/admin/payments')}
              className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 hover:border-indigo-500/60 hover:shadow-2xl hover:shadow-indigo-500/5 cursor-pointer flex justify-between items-center group transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-4 bg-amber-950 rounded-2xl text-amber-450 border border-amber-900/60">
                  <FaCreditCard size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-sm">Payment Records</h4>
                  <p className="text-xs text-slate-400 mt-1">Track monthly student transit fees, audit invoices</p>
                </div>
              </div>
              <FaChevronRight className="text-slate-500 group-hover:translate-x-1 group-hover:text-indigo-400 transition-transform" size={12} />
            </div>

            {/* View maps telemetry link */}
            <div 
              onClick={() => navigate('/admin/tracking')}
              className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 hover:border-indigo-500/60 hover:shadow-2xl hover:shadow-indigo-500/5 cursor-pointer flex justify-between items-center group transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-4 bg-emerald-950 rounded-2xl text-emerald-450 border border-emerald-900/60">
                  <FaMapMarkedAlt size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-sm">GPS Telemetry Simulator</h4>
                  <p className="text-xs text-slate-400 mt-1">Update live coordinates, simulate school route transit</p>
                </div>
              </div>
              <FaChevronRight className="text-slate-500 group-hover:translate-x-1 group-hover:text-indigo-400 transition-transform" size={12} />
            </div>

          </div>
        </div>

      </div>
    </SidebarLayout>
  );
}
