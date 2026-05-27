import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarLayout from '../components/Layout/SidebarLayout';
import { fetchApi } from '../api';
import { FaBus, FaMapMarkerAlt, FaCheck, FaArrowRight, FaAngleLeft } from 'react-icons/fa';

export default function SeatSelection() {
  const { busId } = useParams();
  const navigate = useNavigate();

  const [bus, setBus] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [pickupStop, setPickupStop] = useState('');
  const [dropStop, setDropStop] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchBusAndSeats = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch bus detail
      const busRes = await fetchApi(`/buses/${busId}`);
      if (busRes.status !== 200) {
        setError(busRes.data.message || 'Failed to fetch bus.');
        return;
      }
      setBus(busRes.data.data);

      // Fetch seat status
      const seatsRes = await fetchApi(`/buses/${busId}/seats`);
      if (seatsRes.status === 200) {
        setSeats(seatsRes.data.data.seats);
      } else {
        setError(seatsRes.data.message || 'Failed to fetch seat statuses.');
      }
    } catch (err) {
      setError(err.message || 'Error occurred loading seats.');
    } finally {
      setLoading(false);
    }
  }, [busId]);

  useEffect(() => {
    fetchBusAndSeats();
  }, [fetchBusAndSeats]);

  const handleSeatClick = (seat) => {
    if (seat.isOccupied) return;
    setSelectedSeat(seat.seatNumber === selectedSeat ? null : seat.seatNumber);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!pickupStop) {
      setError('Please select a pickup stop.');
      return;
    }
    if (!dropStop) {
      setError('Please select a drop stop.');
      return;
    }
    if (!selectedSeat) {
      setError('Please choose a seat.');
      return;
    }

    try {
      setSubmitting(true);
      const { status, data } = await fetchApi('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          busId,
          pickupStop,
          dropStop,
          seatNumber: selectedSeat
        })
      });

      if (status === 201) {
        // Redirect to payment page
        navigate(`/payment/${data.data._id}`);
      } else {
        setError(data.message || 'Failed to create booking request.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during booking.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="h-96 flex items-center justify-center text-slate-400">
          Loading bus seat layout...
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Back Link */}
        <button 
          onClick={() => navigate('/buses')}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <FaAngleLeft size={16} />
          Back to Buses
        </button>

        {/* Header Info */}
        <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800/80">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider block">Seat Reservation for</span>
              <h1 className="text-xl font-extrabold text-white mt-1">Bus {bus?.busNumber}</h1>
              <p className="text-sm text-slate-400">{bus?.routeName}</p>
            </div>
            <div className="text-sm text-slate-300">
              <span className="text-xs text-slate-500 block">BASE MONTHLY COMMUTE FARE</span>
              <span className="text-lg font-black text-slate-100">₹1,500.00 / seat</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Seating Layout Column */}
          <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800/80 flex flex-col items-center">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-6">Bus Interior Seat Layout</h3>
            
            {/* Visual Indicators Legend */}
            <div className="flex gap-6 mb-8 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 bg-emerald-500 rounded-md" />
                <span className="text-slate-400">Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 bg-rose-500 rounded-md" />
                <span className="text-slate-400">Occupied</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 bg-blue-600 rounded-md" />
                <span className="text-slate-400">Selected</span>
              </div>
            </div>

            {/* Simulated Driver Position */}
            <div className="w-full max-w-[280px] bg-slate-900 border border-slate-800/80 p-3 rounded-xl text-center mb-6 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">DRIVE STEERING</span>
              <span className="w-8 h-8 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin" />
            </div>

            {/* Seats Grid */}
            <div className="grid grid-cols-4 gap-4 w-full max-w-[280px]">
              {seats.map((seat) => {
                const isSelected = seat.seatNumber === selectedSeat;
                let bgClass = 'bg-emerald-500/10 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-400 cursor-pointer';
                if (seat.isOccupied) {
                  bgClass = 'bg-rose-500/10 border-rose-500/20 text-rose-500/60 cursor-not-allowed';
                } else if (isSelected) {
                  bgClass = 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/35 cursor-pointer';
                }

                return (
                  <button
                    key={seat.seatNumber}
                    onClick={() => handleSeatClick(seat)}
                    disabled={seat.isOccupied}
                    className={`
                      h-12 w-12 rounded-xl border flex items-center justify-center font-bold text-sm transition-all duration-200
                      ${bgClass}
                    `}
                  >
                    {seat.seatNumber}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form & Stops Info Column */}
          <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
            <form onSubmit={handleBookingSubmit} className="space-y-6">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Select Commute Stops</h3>
              
              {/* Pickup stop dropdown */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-2">PICKUP STOPS</label>
                <select
                  value={pickupStop}
                  onChange={(e) => setPickupStop(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                  required
                >
                  <option value="">Select Pickup Stop</option>
                  {bus?.pickupStops.map((stop, i) => (
                    <option key={i} value={stop}>{stop}</option>
                  ))}
                </select>
              </div>

              {/* Drop stop dropdown */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-2">DROP STOPS</label>
                <select
                  value={dropStop}
                  onChange={(e) => setDropStop(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                  required
                >
                  <option value="">Select Drop Stop</option>
                  {bus?.dropStops.map((stop, i) => (
                    <option key={i} value={stop}>{stop}</option>
                  ))}
                </select>
              </div>

              {/* Seat indicator summary */}
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/50 flex justify-between items-center text-sm">
                <span className="text-slate-400 font-medium">Selected Seat</span>
                <span className="font-extrabold text-blue-400 text-lg">
                  {selectedSeat ? `Seat #${selectedSeat}` : 'None Chosen'}
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {submitting ? 'Confirming details...' : 'Confirm booking & Proceed'}
                <FaArrowRight size={12} />
              </button>
            </form>
          </div>

        </div>

      </div>
    </SidebarLayout>
  );
}
