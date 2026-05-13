import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Onboarding from './pages/Onboarding/Onboarding';
import RegisterPage from './pages/Register/RegisterPage';
import ProfileCompletion from './pages/Register/ProfileCompletion';
import LoginPage from './pages/Login/LoginPage';
import ForgotPassword from './pages/Login/ForgotPassword';
import VerifyOtp from './pages/Login/VerifyOtp';
import ResetPassword from './pages/Login/ResetPassword';
import ParentBookingHome from './pages/Booking/ParentBookingHome';
import ProfilePage from './pages/Profile/ProfilePage';
import CustomerSupportPage from './pages/Support/CustomerSupportPage';
import FAQsPage from './pages/Support/FAQsPage';
import PrivacyTermsPage from './pages/Support/PrivacyTermsPage';
import PrivacyPolicyPage from './pages/Support/PrivacyPolicyPage';
import TermsConditionsPage from './pages/Support/TermsConditionsPage';
import AccountInfoPage from './pages/Profile/AccountInfoPage';
import ChangePasswordPage from './pages/Profile/ChangePasswordPage';
import VerifyOTPPage from './pages/Profile/VerifyOTPPage';

function HomeRoute() {
  const user = JSON.parse(localStorage.getItem('authUser') || '{}');
  const role = user.role || localStorage.getItem('userRole') || 'user';

  // Show ParentBookingHome for parents
  if (role === 'parent') {
    return <ParentBookingHome />;
  }

  // Default welcome page for drivers or other roles
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '520px', width: '100%', padding: '32px', borderRadius: '24px', background: '#fff', boxShadow: '0 20px 60px rgba(15, 23, 42, 0.12)' }}>
        <h1 style={{ margin: '0 0 12px', fontSize: '32px' }}>Welcome back</h1>
        <p style={{ margin: 0, fontSize: '16px', lineHeight: 1.6 }}>You are signed in as {user.name || 'a user'} ({role}).</p>
      </div>
    </div>
  );
}

function App() {
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null);
  const [onboardingComplete, setOnboardingComplete] = useState(
    localStorage.getItem('onboardingComplete') === 'true' || false
  );

  const handleOnboardingFinish = (role, navigate) => {
    if (role) {
      localStorage.setItem('userRole', role);
      setUserRole(role);
    }
    localStorage.setItem('onboardingComplete', 'true');
    setOnboardingComplete(true);
    navigate('/register', { replace: true });
  };

  function OnboardingRoute() {
    const navigate = useNavigate();

    return <Onboarding onFinish={(role) => handleOnboardingFinish(role, navigate)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OnboardingRoute />} />
        <Route path="/register" element={onboardingComplete ? <RegisterPage /> : <Navigate to="/" replace />} />
        <Route path="/profile-completion" element={onboardingComplete ? <ProfileCompletion /> : <Navigate to="/" replace />} />
        <Route path="/login" element={onboardingComplete ? <LoginPage /> : <Navigate to="/" replace />} />
        <Route path="/home" element={onboardingComplete ? <HomeRoute /> : <Navigate to="/" replace />} />
        <Route path="/profile" element={onboardingComplete ? <ProfilePage /> : <Navigate to="/" replace />} />
        <Route path="/account-info" element={onboardingComplete ? <AccountInfoPage /> : <Navigate to="/" replace />} />
        <Route path="/change-password" element={onboardingComplete ? <ChangePasswordPage /> : <Navigate to="/" replace />} />
        <Route path="/verify-otp" element={onboardingComplete ? <VerifyOTPPage /> : <Navigate to="/" replace />} />
        <Route path="/help" element={onboardingComplete ? <CustomerSupportPage /> : <Navigate to="/" replace />} />
        <Route path="/customer-support" element={onboardingComplete ? <CustomerSupportPage /> : <Navigate to="/" replace />} />
        <Route path="/faqs" element={onboardingComplete ? <FAQsPage /> : <Navigate to="/" replace />} />
        <Route path="/privacy-terms" element={onboardingComplete ? <PrivacyTermsPage /> : <Navigate to="/" replace />} />
        <Route path="/privacy-policy" element={onboardingComplete ? <PrivacyPolicyPage /> : <Navigate to="/" replace />} />
        <Route path="/terms-conditions" element={onboardingComplete ? <TermsConditionsPage /> : <Navigate to="/" replace />} />
        <Route path="/privacy" element={onboardingComplete ? <PrivacyPolicyPage /> : <Navigate to="/" replace />} />
        <Route path="/terms" element={onboardingComplete ? <TermsConditionsPage /> : <Navigate to="/" replace />} />
        <Route path="/forgot" element={onboardingComplete ? <ForgotPassword /> : <Navigate to="/" replace />} />
        <Route path="/verify" element={onboardingComplete ? <VerifyOtp /> : <Navigate to="/" replace />} />
        <Route path="/reset" element={onboardingComplete ? <ResetPassword /> : <Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
