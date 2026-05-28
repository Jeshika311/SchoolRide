import './App.css';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { NotificationProvider } from './context/NotificationContext';
import NotificationsPage from './pages/Notifications/NotificationsPage';
import TermsAcceptModal from './components/Terms/TermsAcceptModal';
import Onboarding from './pages/Onboarding/Onboarding';
import RegisterPage from './pages/Register/RegisterPage';
import ProfileCompletion from './pages/Register/ProfileCompletion';
import LoginPage from './pages/Login/LoginPage';
import ForgotPassword from './pages/Login/ForgotPassword';
import VerifyOtp from './pages/Login/VerifyOtp';
import ResetPassword from './pages/Login/ResetPassword';
import ParentBookingHome from './pages/Booking/ParentBookingHome';
import ProfilePage from './pages/Profile/ProfilePage';
import DriverProfile from './pages/Profile/DriverProfile';
import DriverDashboard from './pages/Driver/DriverDashboard';
import DriverRides from './pages/Driver/DriverRides';
import DriverTracking from './pages/Driver/DriverTracking';
import DriverNotifications from './pages/Driver/DriverNotifications';
import DriverEarnings from './pages/Driver/DriverEarnings';
import DriverHistory from './pages/Driver/DriverHistory';
import CustomerSupportPage from './pages/Support/CustomerSupportPage';
import FAQsPage from './pages/Support/FAQsPage';
import PrivacyTermsPage from './pages/Support/PrivacyTermsPage';
import PrivacyPolicyPage from './pages/Support/PrivacyPolicyPage';
import TermsConditionsPage from './pages/Support/TermsConditionsPage';
import AccountInfoPage from './pages/Profile/AccountInfoPage';
import ChangePasswordPage from './pages/Profile/ChangePasswordPage';
import VerifyOTPPage from './pages/Profile/VerifyOTPPage';

// SchoolRide Pages
import StudentDashboard from './pages/Home/StudentDashboard';
import BusListing from './pages/Home/BusListing';
import SeatSelection from './pages/Home/SeatSelection';
import PaymentPage from './pages/Home/PaymentPage';
import BookingHistory from './pages/Home/BookingHistory';
import RideStatusPage from './pages/Home/RideStatusPage';
import LiveTracking from './pages/Home/LiveTracking';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ManageBuses from './pages/Admin/ManageBuses';
import ManageBookings from './pages/Admin/ManageBookings';
import PaymentRecords from './pages/Admin/PaymentRecords';
import AdminTracking from './pages/Admin/AdminTracking';

function HomeRoute() {
  const user = JSON.parse(localStorage.getItem('authUser') || '{}');
  const role = user.role || localStorage.getItem('userRole') || 'user';

  if (role === 'parent') {
    return <ParentBookingHome />;
  }

  if (role === 'driver') {
    return <DriverDashboard />;
  }
  if (role === 'student') {
    return <StudentDashboard />;
  }
  if (role === 'admin') {
    return <AdminDashboard />;
  }

  // Default welcome page
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '520px', width: '100%', padding: '32px', borderRadius: '24px', background: '#fff', boxShadow: '0 20px 60px rgba(15, 23, 42, 0.12)' }}>
        <h1 style={{ margin: '0 0 12px', fontSize: '32px' }}>Welcome back</h1>
        <p style={{ margin: 0, fontSize: '16px', lineHeight: 1.6 }}>You are signed in as {user.name || 'a user'} ({role}).</p>
      </div>
    </div>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [onboardingComplete, setOnboardingComplete] = useState(
    localStorage.getItem('onboardingComplete') === 'true' || false
  );
  const hasAuthenticatedUser = Boolean(localStorage.getItem('authUser'));
  const userRole = localStorage.getItem('userRole') || JSON.parse(localStorage.getItem('authUser') || '{}').role || 'user';
  const [termsAccepted, setTermsAccepted] = useState(localStorage.getItem('termsAccepted') === 'true');

  const handleOnboardingFinish = (role) => {
    const selectedRole = role === 'driver' ? 'driver' : 'student';
    localStorage.setItem('userRole', selectedRole);
    localStorage.setItem('onboardingComplete', 'true');
    setOnboardingComplete(true);
    navigate('/register', { replace: true });
  };

  const handleTermsAccept = () => {
    localStorage.setItem('termsAccepted', 'true');
    setTermsAccepted(true);
  };

  const publicLegalRoutes = ['/terms', '/privacy', '/privacy-terms', '/privacy-policy', '/terms-conditions'];
  const isPublicLegalRoute = publicLegalRoutes.includes(location.pathname.toLowerCase());
  const showTermsModal = onboardingComplete && hasAuthenticatedUser && !termsAccepted && !isPublicLegalRoute;

  return (
    <>
      <Routes>
        <Route path="/" element={<Onboarding onFinish={handleOnboardingFinish} />} />
        <Route path="/register" element={onboardingComplete ? <RegisterPage /> : <Navigate to="/" replace />} />
        <Route path="/profile-completion" element={onboardingComplete ? <ProfileCompletion /> : <Navigate to="/" replace />} />
        <Route path="/login" element={onboardingComplete ? <LoginPage /> : <Navigate to="/" replace />} />
        <Route path="/home" element={onboardingComplete ? <HomeRoute /> : <Navigate to="/" replace />} />
        <Route path="/driver/dashboard" element={onboardingComplete ? <DriverDashboard /> : <Navigate to="/" replace />} />
        <Route path="/driver-dashboard" element={<Navigate to="/driver/dashboard" replace />} />
        <Route path="/driver/rides" element={onboardingComplete ? <DriverRides /> : <Navigate to="/" replace />} />
        <Route path="/driver/tracking" element={onboardingComplete ? <DriverTracking /> : <Navigate to="/" replace />} />
        <Route path="/driver/notifications" element={onboardingComplete ? <DriverNotifications /> : <Navigate to="/" replace />} />
        <Route path="/driver/earnings" element={onboardingComplete ? <DriverEarnings /> : <Navigate to="/" replace />} />
        <Route path="/driver/history" element={onboardingComplete ? <DriverHistory /> : <Navigate to="/" replace />} />
        <Route
          path="/profile"
          element={onboardingComplete ? (userRole === 'driver' ? <DriverProfile /> : <ProfilePage />) : <Navigate to="/" replace />}
        />
        <Route path="/driver/profile" element={onboardingComplete ? <DriverProfile /> : <Navigate to="/" replace />} />
        <Route path="/driver-profile" element={<Navigate to="/driver/profile" replace />} />
        <Route path="/account-info" element={onboardingComplete ? (userRole === 'driver' ? <DriverProfile /> : <AccountInfoPage />) : <Navigate to="/" replace />} />
        <Route path="/change-password" element={onboardingComplete ? <ChangePasswordPage /> : <Navigate to="/" replace />} />
        <Route path="/verify-otp" element={onboardingComplete ? <VerifyOTPPage /> : <Navigate to="/" replace />} />
        <Route path="/help" element={onboardingComplete ? <CustomerSupportPage /> : <Navigate to="/" replace />} />
        <Route path="/customer-support" element={onboardingComplete ? <CustomerSupportPage /> : <Navigate to="/" replace />} />
        <Route path="/faqs" element={onboardingComplete ? <FAQsPage /> : <Navigate to="/" replace />} />
        <Route path="/privacy-terms" element={<PrivacyTermsPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-conditions" element={<TermsConditionsPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsConditionsPage />} />
        <Route path="/forgot" element={onboardingComplete ? <ForgotPassword /> : <Navigate to="/" replace />} />
        <Route path="/verify" element={onboardingComplete ? <VerifyOtp /> : <Navigate to="/" replace />} />
        <Route path="/reset" element={onboardingComplete ? <ResetPassword /> : <Navigate to="/" replace />} />
        <Route path="/notifications" element={onboardingComplete ? <NotificationsPage /> : <Navigate to="/" replace />} />

        {/* Student Routes */}
        <Route path="/buses" element={onboardingComplete ? <BusListing /> : <Navigate to="/" replace />} />
        <Route path="/seat-selection/:busId" element={onboardingComplete ? <SeatSelection /> : <Navigate to="/" replace />} />
        <Route path="/payment/:bookingId" element={onboardingComplete ? <PaymentPage /> : <Navigate to="/" replace />} />
        <Route path="/ride-status" element={onboardingComplete ? <RideStatusPage /> : <Navigate to="/" replace />} />
        <Route path="/history" element={onboardingComplete ? <BookingHistory /> : <Navigate to="/" replace />} />
        <Route path="/track/:busId" element={onboardingComplete ? <LiveTracking /> : <Navigate to="/" replace />} />

        {/* Admin Routes */}
        <Route path="/admin/buses" element={onboardingComplete ? <ManageBuses /> : <Navigate to="/" replace />} />
        <Route path="/admin/bookings" element={onboardingComplete ? <ManageBookings /> : <Navigate to="/" replace />} />
        <Route path="/admin/payments" element={onboardingComplete ? <PaymentRecords /> : <Navigate to="/" replace />} />
        <Route path="/admin/tracking" element={onboardingComplete ? <AdminTracking /> : <Navigate to="/" replace />} />
      </Routes>

      {showTermsModal && <TermsAcceptModal onAccept={handleTermsAccept} />}
    </>
  );
}

function App() {
  return (
    <NotificationProvider>
      <ToastContainer position="top-right" autoClose={2200} newestOnTop closeOnClick pauseOnHover />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;

