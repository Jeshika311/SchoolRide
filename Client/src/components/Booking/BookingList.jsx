import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../api';
import './Booking.css';

const BookingList = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        // Hardcoded to parent endpoint for demo purposes, 
        // ideally checked via context or prop if role === driver
        const { status, data } = await fetchApi('/booking/parent', {
            method: 'GET'
        });

        setLoading(false);
        if (status === 200 && data.success) {
            setBookings(data.data || []);
        } else {
            setError(data.message || 'Error loading bookings');
            setBookings([]);
        }
    };

    const getStatusBadge = (status) => {
        const classes = {
            pending: 'badge-warning',
            accepted: 'badge-primary',
            rejected: 'badge-danger',
            completed: 'badge-success',
        };
        return <span className={`badge ${classes[status] || 'badge-default'}`}>{status.toUpperCase()}</span>;
    };

    if (loading) return <div className="loader"></div>;
    if (error) return <p className="alert alert-error">{error}</p>;

    return (
        <div className="booking-list-container">
            <h2 className="booking-title">Activity & History</h2>
            {bookings.length === 0 ? (
                <p className="empty-state">No ride requests found yet.</p>
            ) : (
                <div className="card-grid">
                    {bookings.map((b) => (
                        <div className="booking-card item-card" key={b._id}>
                            <div className="card-header">
                                <div>
                                    <h4>{b.child_name}'s Ride</h4>
                                    <small className="card-date">{new Date(b.createdAt).toLocaleDateString()}</small>
                                </div>
                                {getStatusBadge(b.status)}
                            </div>
                            <div className="card-body">
                                <div className="route-timeline">
                                    <div className="point start">
                                        <span className="dot"></span>
                                        <span>{b.pickup_point}</span>
                                    </div>
                                    <div className="line"></div>
                                    <div className="point end">
                                        <span className="dot end-dot"></span>
                                        <span>{b.drop_point}</span>
                                    </div>
                                </div>
                                <div className="driver-info">
                                    <strong>Driver:</strong> {b.driver_id ? b.driver_id.name : 'Unassigned'}
                                </div>
                                <div className="trip-status">
                                    <strong>Trip Status:</strong> <span className={`status-${b.trip_status}`}>{b.trip_status}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BookingList;
