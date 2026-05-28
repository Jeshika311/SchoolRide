import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfilePage from '../Profile/ProfilePage';
import NotificationBell from '../../components/Notification/NotificationBell';
import { fetchApi } from '../../api';
import './ParentBookingHome.css';

export default function ParentBookingHome() {
  const navigate = useNavigate();
  const [user] = useState(() => {
    return JSON.parse(localStorage.getItem('authUser') || 'null');
  });
  const storedProfileData = JSON.parse(localStorage.getItem('profileData') || '{}');
  const [schoolName, setSchoolName] = useState(() => {
    return storedProfileData.school_name || '';
  });
  const [booking, setBooking] = useState(() => {
    return {
      from: 'Source',
      fromAddress: storedProfileData.pickup_address || 'Add your pickup address in profile',
      to: 'Destination',
      toName: storedProfileData.drop_address || storedProfileData.school_name || 'School destination',
      pickupTime: 'Assigned after booking',
    };
  });

  const [assignedVan, setAssignedVan] = useState({
    vanNumber: 'Pending booking',
    driverName: 'Assigned after booking',
    vanType: 'Van',
  });

  const normalizeText = (value = '') => value.toString().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  const findMatchingRoute = (routes = [], busRouteName = '', pickupStop = '', dropStop = '', pickupAddress = '', dropAddress = '') => {
    const normalizedBusRoute = normalizeText(busRouteName);
    const normalizedPickup = normalizeText(pickupStop || pickupAddress);
    const normalizedDrop = normalizeText(dropStop || dropAddress);

    return routes.find((route) => {
      const routeStart = normalizeText(route.start_location);
      const routeEnd = normalizeText(route.end_location);
      const routeStops = normalizeText(Array.isArray(route.stops) ? route.stops.join(' ') : '');

      const directMatch = normalizedBusRoute && routeStart && routeEnd
        && normalizedBusRoute.includes(routeStart)
        && normalizedBusRoute.includes(routeEnd);

      const pickupDropMatch = normalizedPickup && normalizedDrop
        && routeStart.includes(normalizedPickup)
        && routeEnd.includes(normalizedDrop);

      const stopMatch = routeStops
        && normalizedPickup
        && normalizedDrop
        && routeStops.includes(normalizedPickup)
        && routeStops.includes(normalizedDrop);

      return directMatch || pickupDropMatch || stopMatch;
    });
  };

  useEffect(() => {
    const loadRideDetails = async () => {
      try {
        const latestProfileData = JSON.parse(localStorage.getItem('profileData') || '{}');
        const [bookingsRes, routesRes] = await Promise.all([
          fetchApi('/bookings/my-bookings'),
          fetchApi('/routes')
        ]);

        const bookings = bookingsRes.status === 200 ? (bookingsRes.data.data || []) : [];
        const currentBooking = bookings.find((item) => item.bookingStatus !== 'Cancelled') || bookings[0] || null;
        const routes = routesRes.status === 200 ? (routesRes.data.data || []) : [];

        if (!currentBooking) {
          return;
        }

        const bookingBus = currentBooking.busId || {};
        const matchedRoute = findMatchingRoute(
          routes,
          bookingBus.routeName || '',
          currentBooking.pickupStop || '',
          currentBooking.dropStop || '',
          latestProfileData.pickup_address || '',
          latestProfileData.drop_address || ''
        );

        const resolvedFromAddress = currentBooking.pickupStop || latestProfileData.pickup_address || bookingBus.routeName || 'Source';
        const resolvedToAddress = currentBooking.dropStop || latestProfileData.drop_address || schoolName || latestProfileData.school_name || 'Destination';
        const resolvedPickupTime = currentBooking.bookingStatus === 'Confirmed' ? 'Confirmed booking' : 'Pending confirmation';
        const resolvedDriverName = matchedRoute?.driver?.name || matchedRoute?.driver?.full_name || 'Assigned Driver';

        setBooking((previous) => ({
          ...previous,
          from: 'Source',
          fromAddress: resolvedFromAddress,
          to: 'Destination',
          toName: resolvedToAddress,
          pickupTime: resolvedPickupTime,
        }));

        setAssignedVan({
          vanNumber: bookingBus.busNumber || 'Pending booking',
          driverName: resolvedDriverName,
          vanType: bookingBus.routeName || 'Van',
        });

        localStorage.setItem('currentBooking', JSON.stringify({
          ...currentBooking,
          sourceAddress: resolvedFromAddress,
          destinationAddress: resolvedToAddress,
          driverName: resolvedDriverName,
          vanNumber: bookingBus.busNumber || '',
        }));
      } catch (error) {
        console.error('Unable to load ride details:', error);
      }
    };

    loadRideDetails();
  }, [schoolName]);

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
    // Open the bus list so the user can choose a route and continue booking.
    navigate('/buses');
  };

  const handleToClick = () => {
    // Open the bus list so the user can choose a route and continue booking.
    navigate('/buses');
  };

  const handlePickupTimeClick = () => {
    // Open the booking history screen until a dedicated time picker exists.
    navigate('/history');
  };

  const handleConfirmRide = () => {
    // Save booking and navigate to confirmation
    localStorage.setItem('currentBooking', JSON.stringify(booking));
    navigate('/history');
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
          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <NotificationBell />
            <div className="header-nav">
              <button type="button" className="header-nav-item" onClick={() => navigate('/history')} style={{ border: 'none', background: 'transparent' }}>
                <span className="header-nav-icon">✓</span>
                <span className="header-nav-label">Bookings</span>
              </button>
              <button
                type="button"
                className="header-nav-item"
                onClick={() => navigate('/ride-status')}
                style={{ border: 'none', background: 'transparent' }}
              >
                <span className="header-nav-icon">🔍</span>
                <span className="header-nav-label">Tracking</span>
              </button>
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
              <div className="card-label">From <strong>Pickup Address</strong></div>
              <div className="card-address">{booking.fromAddress}</div>
            </div>
            <div className="card-arrow">›</div>
          </div>

          {/* To School Card */}
          <div className="location-card" onClick={handleToClick}>
            <div className="card-icon">🏫</div>
            <div className="card-content">
              <div className="card-label">To <strong>Destination</strong></div>
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
