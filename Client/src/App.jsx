import { useState, useEffect } from 'react';
import { fetchApi } from './api';
import BookingForm from './components/Booking/BookingForm';
import BookingList from './components/Booking/BookingList';
import './components/Booking/Booking.css';
import './App.css'; // Keep base styles

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleBookingCreated = () => {
    // Force BookingList to re-fetch when a new booking is submitted
    setRefreshKey(prev => prev + 1);
  };

  const qaLogin = async () => {
    // Creating a mock parent to get a JWT locally
    const payload = {
      name: "Mock Parent",
      email: `parent_${Date.now()}@test.com`,
      password: "password123",
      role: "parent",
      phone_number: "1234567890",
      preferred_language: "en"
    };

    const { status, data } = await fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (status === 201 || status === 200) {
      setIsAuthenticated(true);
      alert('QA Authentication Successful! JWT Cookie Set.');
      setRefreshKey(prev => prev + 1); // Refresh list
    } else {
      alert('Auth failed: ' + data.message);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>SchoolRide Dashboard</h1>
        <p>Premium platform for secure commutes.</p>
        {!isAuthenticated ? (
          <button onClick={qaLogin} style={{ marginTop: '10px', background: '#10B981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            QA Fast Login (Generate JWT Token)
          </button>
        ) : (
          <div style={{ marginTop: '10px', color: '#10B981', fontWeight: 'bold' }}>Authenticated ✓</div>
        )}
      </header>

      <main className="booking-module">
        <div className="booking-dashboard">
          <section>
            <BookingForm onBookingCreated={handleBookingCreated} />
          </section>
          <section>
            <BookingList key={refreshKey} />
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
