import React, { useState, useEffect } from 'react';
import SidebarLayout from '../../components/Layout/SidebarLayout';
import { fetchApi } from '../../api';
import { FaCreditCard, FaFileInvoice, FaCheckCircle, FaTimesCircle, FaHourglassHalf } from 'react-icons/fa';

export default function PaymentRecords() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { status, data } = await fetchApi('/payments');
      if (status === 200) {
        setPayments(data.data);
      } else {
        setError(data.message || 'Failed to fetch payment records.');
      }
    } catch (err) {
      setError(err.message || 'Error occurred fetching payments.');
    } finally {
      setLoading(false);
    }
  };

  const statusIcons = {
    'Paid': <FaCheckCircle className="text-emerald-400" size={14} />,
    'Pending': <FaHourglassHalf className="text-amber-400 animate-spin" size={14} />,
    'Failed': <FaTimesCircle className="text-rose-500" size={14} />,
    'Refunded': <FaHourglassHalf className="text-indigo-400" size={14} />
  };

  const statusColors = {
    'Paid': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    'Pending': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    'Failed': 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    'Refunded': 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
  };

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-600">Financial review</p>
          <h1 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tight">Payment Ledger</h1>
          <p className="text-sm text-slate-500 max-w-2xl">View and audit all student Monthly Commute fee transactions</p>
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
        ) : payments.length > 0 ? (
          <div className="bg-white rounded-3xl border border-sky-100 overflow-hidden shadow-sm shadow-sky-100/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-sky-100 bg-sky-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Transaction ID</th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Bus / Seat</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Razorpay Reference</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100 text-sm text-slate-700">
                  {payments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-sky-50 transition-colors">
                      {/* ID */}
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        #{payment._id.toString().substring(0, 12)}
                      </td>

                      {/* Student */}
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-950 block">{payment.studentId?.name || 'Unknown Student'}</span>
                          <span className="text-xs text-slate-500 block">{payment.studentId?.email}</span>
                        </div>
                      </td>

                      {/* Bus/Seat */}
                      <td className="px-6 py-4 font-semibold text-xs text-slate-700">
                        <div className="space-y-0.5">
                          <span className="block">Bus {payment.bookingId?.busId?.busNumber || 'N/A'}</span>
                          <span className="block text-sky-600 font-bold">Seat #{payment.bookingId?.seatNumber}</span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 font-extrabold text-slate-950">
                        ₹{payment.amount.toLocaleString()}
                      </td>

                      {/* Razorpay Info */}
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">
                        <div className="space-y-0.5">
                          <div>
                            <strong className="text-slate-500">Order:</strong> {payment.orderId}
                          </div>
                          {payment.paymentId && (
                            <div>
                              <strong className="text-slate-500">Pay:</strong> {payment.paymentId}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${statusColors[payment.paymentStatus]}`}>
                          {statusIcons[payment.paymentStatus]}
                          {payment.paymentStatus}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-right text-xs text-slate-400">
                        {new Date(payment.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-sky-100 border-dashed rounded-3xl p-12 text-center text-slate-500 shadow-sm">
            No payment transaction records found in database.
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
