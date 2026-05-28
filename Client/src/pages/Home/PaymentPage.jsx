import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarLayout from '../../components/Layout/SidebarLayout';
import { fetchApi } from '../../api';
import { FaCreditCard, FaCheckCircle, FaTimesCircle, FaBus, FaFileInvoice, FaAngleLeft, FaSpinner } from 'react-icons/fa';

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Checkout states
  const [orderData, setOrderData] = useState(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Success / Failure States
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, success, failed
  const [verifiedData, setVerifiedData] = useState(null);

  const fetchBookingDetails = useCallback(async () => {
    try {
      setLoading(true);
      const { status, data } = await fetchApi(`/bookings/${bookingId}`);
      if (status === 200) {
        setBooking(data.data);
        if (data.data.bookingStatus === 'Confirmed') {
          setPaymentStatus('success');
          setVerifiedData({
            paymentId: data.data.paymentId,
            seatNumber: data.data.seatNumber,
            status: 'Confirmed'
          });
        }
      } else {
        setError(data.message || 'Failed to fetch booking details.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred fetching booking.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBookingDetails();
  }, [fetchBookingDetails]);

  const handleCheckoutInitiate = async () => {
    try {
      setCheckoutLoading(true);
      setError(null);

      // Create Order on Backend
      const { status, data } = await fetchApi('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ bookingId })
      });

      if (status !== 200) {
        setError(data.message || 'Failed to initiate order.');
        setCheckoutLoading(false);
        return;
      }

      setOrderData(data.data);

      // Check if it is a mock order or real Razorpay checkout
      if (data.data.isMock) {
        // Open our custom premium mock sandbox payment checkout modal
        setCheckoutModalOpen(true);
        setCheckoutLoading(false);
      } else {
        // Run Real Razorpay script checkout
        openRazorpayCheckout(data.data);
      }
    } catch (err) {
      setError(err.message || 'Error occurred starting checkout.');
      setCheckoutLoading(false);
    }
  };

  // Real Razorpay SDK Checkout
  const openRazorpayCheckout = (order) => {
    const options = {
      key: order.razorpayKeyId,
      amount: order.amount,
      currency: order.currency,
      name: 'SchoolRide Booking',
      description: `Bus seat booking payment for ${booking.busId?.busNumber}`,
      order_id: order.orderId,
      handler: async function (response) {
        verifyTransaction({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature
        });
      },
      prefill: {
        name: booking.studentId?.name || '',
        email: booking.studentId?.email || '',
        contact: booking.studentId?.phone_number || ''
      },
      theme: {
        color: '#2563EB'
      },
      modal: {
        ondismiss: function () {
          setCheckoutLoading(false);
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  // Backend verification callback
  const verifyTransaction = async (verificationPayload) => {
    try {
      setCheckoutLoading(true);
      const { status, data } = await fetchApi('/payments/verify', {
        method: 'POST',
        body: JSON.stringify(verificationPayload)
      });

      if (status === 200) {
        setPaymentStatus('success');
        setVerifiedData(data.data);
      } else {
        setPaymentStatus('failed');
        setError(data.message || 'Payment verification failed.');
      }
    } catch (err) {
      setPaymentStatus('failed');
      setError(err.message || 'An error occurred during payment verification.');
    } finally {
      setCheckoutLoading(false);
      setCheckoutModalOpen(false);
    }
  };

  // Mock Payment verification callback
  const handleMockPaymentVerify = (success = true) => {
    if (!success) {
      setPaymentStatus('failed');
      setCheckoutModalOpen(false);
      return;
    }

    const payload = {
      razorpay_order_id: orderData.orderId,
      razorpay_payment_id: 'pay_mock_' + Math.random().toString(36).substring(2, 10),
      razorpay_signature: 'sig_mock_verified'
    };
    verifyTransaction(payload);
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="h-96 flex items-center justify-center text-slate-400">
          Loading invoice details...
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="max-w-3xl mx-auto space-y-6 text-slate-900">
        
        {/* Back Link */}
        <button 
          onClick={() => navigate('/home')}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <FaAngleLeft size={16} />
          Back to Dashboard
        </button>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* --- PENDING PAYMENT SCREEN --- */}
        {paymentStatus === 'pending' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-8 shadow-sm">
            
            {/* Invoice Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-6">
              <div className="space-y-1">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">PAYMENT INVOICE</span>
                <h2 className="text-xl font-bold text-slate-900">Booking Ref: #{booking?._id.toString().substring(0, 12)}</h2>
                <p className="text-xs text-slate-500 font-medium">Created on {new Date(booking?.createdAt).toLocaleDateString()}</p>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 uppercase tracking-wider">
                Unpaid
              </span>
            </div>

            {/* Commute Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Ride Details</h3>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="text-slate-500 block mb-0.5 font-semibold text-xs">BUS NUMBER</span>
                  <span className="font-semibold text-slate-800">{booking?.busId?.busNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5 font-semibold text-xs">ROUTE ASSIGNED</span>
                  <span className="font-semibold text-slate-800">{booking?.busId?.routeName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5 font-semibold text-xs">PICKUP STOP</span>
                  <span className="font-semibold text-slate-800">{booking?.pickupStop}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5 font-semibold text-xs">DROP STOP</span>
                  <span className="font-semibold text-slate-800">{booking?.dropStop}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5 font-semibold text-xs">SEAT NUMBER</span>
                  <span className="font-extrabold text-blue-600">Seat {booking?.seatNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5 font-semibold text-xs">STUDENT NAME</span>
                  <span className="font-semibold text-slate-800">{booking?.studentId?.name}</span>
                </div>
              </div>
            </div>

            {/* Fare Summary */}
            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Fare Summary</h3>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between text-sm text-slate-600 font-medium">
                  <span>Standard Monthly Commute Fee</span>
                  <span>₹1,500.00</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600 font-medium">
                  <span>Platform convenience fee</span>
                  <span className="text-emerald-600 font-bold">FREE</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-3">
                  <span>Total Amount Due</span>
                  <span>₹1,500.00</span>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handleCheckoutInitiate}
              disabled={checkoutLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {checkoutLoading ? (
                <>
                  <FaSpinner className="animate-spin" size={16} />
                  Initiating Razorpay Checkout...
                </>
              ) : (
                <>
                  <FaCreditCard size={16} />
                  Pay Commute Fee (₹1,500)
                </>
              )}
            </button>

          </div>
        )}

        {/* --- SUCCESS PAYMENT SCREEN --- */}
        {paymentStatus === 'success' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 text-center space-y-6 shadow-sm">
            <div className="flex justify-center text-emerald-600">
              <FaCheckCircle size={70} className="animate-bounce" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900">Commute Booked Successfully!</h2>
              <p className="text-slate-550 text-sm max-w-md mx-auto">
                Congratulations! Your seat booking is verified. You can now board the bus using your seat coordinates.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-250 rounded-2xl p-6 text-left max-w-md mx-auto text-sm space-y-3">
              <div className="flex justify-between text-slate-500">
                <span>Transaction Ref</span>
                <span className="font-mono text-slate-800 font-bold">{verifiedData?.paymentId}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Seat Assigned</span>
                <span className="font-extrabold text-blue-600">Seat {verifiedData?.seatNumber || booking?.seatNumber}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Bus Number</span>
                <span className="font-semibold text-slate-800">{booking?.busId?.busNumber}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Route</span>
                <span className="font-semibold text-slate-800">{booking?.busId?.routeName}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Stops Info</span>
                <span className="font-semibold text-slate-800">{booking?.pickupStop} - {booking?.dropStop}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto pt-4">
              <button 
                onClick={() => navigate('/home')}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-blue-500/20"
              >
                Go to Dashboard
              </button>
              <button 
                onClick={() => window.print()}
                className="w-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-3 rounded-xl transition-colors"
              >
                Print Invoice
              </button>
            </div>
          </div>
        )}

        {/* --- FAILURE PAYMENT SCREEN --- */}
        {paymentStatus === 'failed' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 text-center space-y-6 shadow-sm">
            <div className="flex justify-center text-rose-600">
              <FaTimesCircle size={70} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900">Payment Failed</h2>
              <p className="text-slate-550 text-sm max-w-md mx-auto">
                Unfortunately, signature verification failed or payment was rejected. Please check your account details and try again.
              </p>
            </div>

            <button 
              onClick={() => setPaymentStatus('pending')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-colors"
            >
              Retry Payment
            </button>
          </div>
        )}

      </div>

      {/* --- MOCK SIMULATED CHECKOUT MODAL --- */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
                <FaCreditCard size={18} />
              </div>
              <div className="text-left">
                <h3 className="font-extrabold text-slate-900 text-sm tracking-wide">Razorpay Mock Sandbox</h3>
                <span className="text-xs text-slate-400 font-bold">Simulated test environment</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-2 text-slate-600 text-left">
                <div className="flex justify-between">
                  <span>Merchant:</span>
                  <span className="font-bold text-slate-800">SchoolRide Booking Ltd.</span>
                </div>
                <div className="flex justify-between">
                  <span>Order Reference:</span>
                  <span className="font-mono text-slate-800 font-bold">{orderData?.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount to Pay:</span>
                  <span className="font-bold text-slate-900">₹1,500.00</span>
                </div>
              </div>

              <div className="space-y-2 text-left">
                <p className="text-xs text-slate-500 leading-normal">
                  This mock dashboard simulates a credit card payment check. Set status success or failure below.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleMockPaymentVerify(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 rounded-xl transition-all duration-200"
              >
                Simulate Success
              </button>
              <button 
                onClick={() => handleMockPaymentVerify(false)}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-3 rounded-xl transition-all duration-200"
              >
                Simulate Failure
              </button>
            </div>
            
            <button 
              onClick={() => {
                setCheckoutModalOpen(false);
                setCheckoutLoading(false);
              }}
              className="w-full text-center text-xs text-slate-450 hover:text-slate-650 py-1 transition-colors"
            >
              Cancel Payment
            </button>
          </div>
        </div>
      )}

    </SidebarLayout>
  );
}
