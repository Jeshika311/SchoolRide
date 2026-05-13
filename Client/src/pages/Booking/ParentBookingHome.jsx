import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfilePage from '../Profile/ProfilePage';
import './ParentBookingHome.css';

export default function ParentBookingHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [schoolName, setSchoolName] = useState('');
  const [booking, setBooking] = useState({
    from: 'Home',
    fromAddress: '123 Raj Nagar, ABC Apartments',
    to: 'School',
    toName: 'St. Xavier School',
    pickupTime: '7:30 AM',
  });

  const [assignedVan, setAssignedVan] = useState({
    vanNumber: 'PB65 AB 2451',
    driverName: 'Rajesh Kumar',
    vanType: 'Van',
  });

  useEffect(() => {
    const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
    setUser(authUser);

    // Get school name from profile data
    const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');
    if (profileData.school_name) {
      setSchoolName(profileData.school_name);
      // Update booking to reflect the stored school name
      setBooking(prev => ({
        ...prev,
        toName: profileData.school_name
      }));
    }
  }, []);

  // Listen for school name changes (when selected in ProfileCompletion)
  useEffect(() => {
    const handleStorageChange = () => {
      const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');
      if (profileData.school_name) {
        setSchoolName(profileData.school_name);
        // Update booking to reflect the updated school name
        setBooking(prev => ({
          ...prev,
          toName: profileData.school_name
        }));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event from same tab
    window.addEventListener('schoolNameUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('schoolNameUpdated', handleStorageChange);
    };
  }, []);

  const handleFromClick = () => {
    // Navigate to location selector
    navigate('/booking/select-location', { state: { type: 'from' } });
  };

  const handleToClick = () => {
    // Navigate to location selector
    navigate('/booking/select-location', { state: { type: 'to' } });
  };

  const handlePickupTimeClick = () => {
    // Navigate to time picker
    navigate('/booking/select-time');
  };

  const handleConfirmRide = () => {
    // Save booking and navigate to confirmation
    localStorage.setItem('currentBooking', JSON.stringify(booking));
    navigate('/booking/confirm');
  };

  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  const openProfileDrawer = () => setShowProfileDrawer(true);
  const closeProfileDrawer = () => setShowProfileDrawer(false);

  return (
    <div className="parent-booking-home">
      {/* Header Section */}
      <div className="booking-header">
        <div className="user-greeting">
          <div className="header-left">
            <div className="avatar">👤</div>
            <div className="greeting-info">
              <h1>Hello {user?.name || 'User'},</h1>
              {schoolName && <p className="school-name-greeting">📍 {schoolName}</p>}
              <p className="tagline">Book Your School Ride</p>
            </div>
          </div>
          <div className="header-right">
            <div className="header-nav">
              <div className="header-nav-item">
                <span className="header-nav-icon">✓</span>
                <span className="header-nav-label">Bookings</span>
              </div>
              <div className="header-nav-item">
                <span className="header-nav-icon">🔍</span>
                <span className="header-nav-label">Tracking</span>
              </div>
              <div className="header-nav-item" onClick={openProfileDrawer} style={{cursor: 'pointer'}}>
                <span className="header-nav-icon">👤</span>
                <span className="header-nav-label">Profile</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="booking-content">
        {/* Where Do You Go Section */}
        <div className="where-section">
          <h2>Where do You Go Today?</h2>

          {/* From Home Card */}
          <div className="location-card" onClick={handleFromClick}>
            <div className="card-icon">🏠</div>
            <div className="card-content">
              <div className="card-label">From <strong>Home</strong></div>
              <div className="card-address">{booking.fromAddress}</div>
            </div>
            <div className="card-arrow">›</div>
          </div>

          {/* To School Card */}
          <div className="location-card" onClick={handleToClick}>
            <div className="card-icon">🏫</div>
            <div className="card-content">
              <div className="card-label">To <strong>School</strong></div>
              <div className="card-address">{booking.toName}</div>
            </div>
            <div className="card-arrow">›</div>
          </div>

          {/* Pickup Time Card */}
          <div className="location-card" onClick={handlePickupTimeClick}>
            <div className="card-icon">🕐</div>
            <div className="card-content">
              <div className="card-label">Pickup Time</div>
            </div>
            <div className="card-time">{booking.pickupTime}</div>
            <div className="card-arrow">›</div>
          </div>
        </div>

        {/* Confirm Ride Button */}
        <button className="confirm-btn" onClick={handleConfirmRide}>
          Confirm Ride
        </button>

        {/* Your Van Section */}
        <div className="van-section">
          <div className="van-card">
            <div className="van-icon">🚌</div>
            <div className="van-info">
              <h3>Your Van:</h3>
              <p className="van-number">Van No. : <strong>{assignedVan.vanNumber}</strong></p>
              <p className="driver-name">Driver : {assignedVan.driverName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <div className="nav-item active">
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Home</span>
        </div>
        <div className="nav-item">
          <span className="nav-icon">✓</span>
          <span className="nav-label">Bookings</span>
        </div>
        <div className="nav-item">
          <span className="nav-icon">🔍</span>
          <span className="nav-label">Tracking</span>
        </div>
        <div className="nav-item" onClick={openProfileDrawer} style={{cursor: 'pointer'}}>
          <span className="nav-icon">👤</span>
          <span className="nav-label">Profile</span>
        </div>
      </div>

      {showProfileDrawer && (
        <div className="drawer-overlay" onClick={closeProfileDrawer}>
          <div className="profile-drawer" onClick={(e) => e.stopPropagation()}>
            <ProfilePage />
          </div>
        </div>
      )}
    </div>
  );
}
