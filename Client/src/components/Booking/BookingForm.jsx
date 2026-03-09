import React, { useState } from 'react';
import { fetchApi } from '../../api';
import './Booking.css';

const BookingForm = ({ onBookingCreated }) => {
    const [formData, setFormData] = useState({
        driver_id: '',
        route_id: '',
        trip_id: '',
        vehicle: '',
        child_name: '',
        pickup_point: '',
        drop_point: ''
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleInputChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const { status, data } = await fetchApi('/booking/create', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        setLoading(false);
        if (status === 201) {
            setMessage({ type: 'success', text: 'Booking successfully created!' });
            if (onBookingCreated) onBookingCreated(data.data);
            setFormData({ driver_id: '', route_id: '', trip_id: '', vehicle: '', child_name: '', pickup_point: '', drop_point: '' });
        } else {
            setMessage({ type: 'error', text: data.message || 'Failed to create booking. Please authenticate first.' });
        }
    };

    return (
        <div className="booking-card form-container">
            <h2 className="booking-title">Schedule a New Ride</h2>
            <p className="booking-subtitle">Provide details to request a secure ride for your child.</p>

            {message && (
                <div className={`alert alert-${message.type}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="booking-form">
                <div className="input-group">
                    <input type="text" name="child_name" placeholder="Child's Full Name" required value={formData.child_name} onChange={handleInputChange} />
                    <span className="focus-border"></span>
                </div>

                <div className="form-row">
                    <div className="input-group">
                        <input type="text" name="pickup_point" placeholder="Pickup Point" required value={formData.pickup_point} onChange={handleInputChange} />
                        <span className="focus-border"></span>
                    </div>
                    <div className="input-group">
                        <input type="text" name="drop_point" placeholder="Drop Point" required value={formData.drop_point} onChange={handleInputChange} />
                        <span className="focus-border"></span>
                    </div>
                </div>

                {/* Following fields are typically selected via dropdowns from fetched data, used plain text here for structural demonstration */}
                <div className="input-group">
                    <input type="text" name="driver_id" placeholder="Driver Object ID" required value={formData.driver_id} onChange={handleInputChange} />
                    <span className="focus-border"></span>
                </div>

                <div className="input-group">
                    <input type="text" name="route_id" placeholder="Route Object ID" required value={formData.route_id} onChange={handleInputChange} />
                    <span className="focus-border"></span>
                </div>

                <div className="form-row">
                    <div className="input-group">
                        <input type="text" name="trip_id" placeholder="Trip Object ID" required value={formData.trip_id} onChange={handleInputChange} />
                        <span className="focus-border"></span>
                    </div>
                    <div className="input-group">
                        <input type="text" name="vehicle" placeholder="Vehicle Object ID" required value={formData.vehicle} onChange={handleInputChange} />
                        <span className="focus-border"></span>
                    </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Processing...' : 'Request Ride'}
                </button>
            </form>
        </div>
    );
};

export default BookingForm;
