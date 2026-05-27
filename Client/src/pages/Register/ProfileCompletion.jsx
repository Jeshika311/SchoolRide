import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../../api';
import './RegisterPage.css';

export default function ProfileCompletion() {
  const [userRole, setUserRole] = useState(() => {
    const storedUser = JSON.parse(localStorage.getItem('authUser') || '{}');
    return localStorage.getItem('userRole') || storedUser.role || 'student';
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // Parent-specific fields
    child_name: '',
    school_name: '',
    grade_class: '',
    // Driver-specific fields
    license_number: '',
    vehicle_type: '',
    years_experience: '',
  });

  const normalizeVehicleType = (value) => {
    const normalized = String(value || '').trim().toLowerCase();

    if (['sedan', 'car'].includes(normalized)) return 'Car';
    if (['suv', 'van'].includes(normalized)) return 'Van';
    if (['minibus', 'bus'].includes(normalized)) return 'Bus';

    if (['car', 'van', 'bus'].includes(normalized)) {
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }

    return '';
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('authUser') || '{}');
    const role = localStorage.getItem('userRole') || storedUser.role || 'student';
    setUserRole(role);
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);
    setLoading(true);

    const profileData = isDriver
      ? {
          license_number: formData.license_number.trim(),
          vehicle_type: normalizeVehicleType(formData.vehicle_type),
          years_experience: formData.years_experience === '' ? '' : Number(formData.years_experience),
        }
      : {
          child_name: '',
          school_name: formData.school_name.trim(),
          grade_class: formData.grade_class.trim(),
        };

    if (isDriver && !profileData.vehicle_type) {
      setLoading(false);
      setMessage({ type: 'error', text: 'Please choose a valid vehicle type.' });
      return;
    }

    try {
      if (isDriver) {
        const { status, data } = await fetchApi('/user/updateDriverProfile', {
          method: 'PUT',
          body: JSON.stringify(profileData),
        });

        if (status !== 200 || !data?.success) {
          setLoading(false);
          setMessage({ type: 'error', text: data?.message || 'Unable to save driver profile details.' });
          return;
        }

        localStorage.setItem('driverProfileData', JSON.stringify(data.profile || profileData));
      } else {
        localStorage.setItem('profileData', JSON.stringify(profileData));
        window.dispatchEvent(new Event('schoolNameUpdated'));
      }

      setMessage({
        type: 'success',
        text: isDriver
          ? 'Driver profile completed successfully. Redirecting to your dashboard...'
          : 'Profile completed successfully. Redirecting to your dashboard...'
      });

      setTimeout(() => {
        setLoading(false);
        navigate(isDriver ? '/driver/dashboard' : '/home', { replace: true });
      }, 1200);
    } catch (error) {
      setLoading(false);
      setMessage({ type: 'error', text: error?.message || 'Unable to complete profile right now.' });
    }
  };

  const isDriver = userRole === 'driver';
  const isStudent = !isDriver;

  return (
    <div className="register-page">
      <div className="register-shell">
        <div className="register-header">
          <h1 className="register-title">Complete Your Profile</h1>
          <p className="register-subtitle">
            {isDriver ? 'Tell us about your driving' : 'Tell us about your school details'}
          </p>
        </div>

        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        <form className="register-form" onSubmit={handleSubmit}>
          {/* Parent-specific fields */}
          {isStudent && (
            <div className="form-section">
              <h3 className="section-title">Student Information</h3>
              
              <div className="field-group">
                <label className="field-label" htmlFor="school_name">School Name</label>
                <input
                  id="school_name"
                  className="text-input"
                  type="text"
                  name="school_name"
                  value={formData.school_name}
                  onChange={handleChange}
                  placeholder="Enter school name"
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="grade_class">Grade/Class</label>
                <input
                  id="grade_class"
                  className="text-input"
                  type="text"
                  name="grade_class"
                  value={formData.grade_class}
                  onChange={handleChange}
                  placeholder='e.g., 10th Grade, Section A'
                />
              </div>
            </div>
          )}

          {/* Driver-specific fields */}
          {isDriver && (
            <div className="form-section">
              <h3 className="section-title">Driver Information</h3>
              
              <div className="field-group">
                <label className="field-label" htmlFor="license_number">License Number</label>
                <input
                  id="license_number"
                  className="text-input"
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleChange}
                  placeholder='Enter your license number'
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="vehicle_type">Vehicle Type</label>
                <select
                  id="vehicle_type"
                  className="text-input"
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={handleChange}
                >
                  <option value="">Select vehicle type</option>
                  <option value="Car">Car</option>
                  <option value="Van">Van</option>
                  <option value="Bus">Bus</option>
                </select>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="years_experience">Years of Experience</label>
                <input
                  id="years_experience"
                  className="text-input"
                  type="number"
                  name="years_experience"
                  min="0"
                  value={formData.years_experience}
                  onChange={handleChange}
                  placeholder='e.g., 5'
                />
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="skip-btn" onClick={() => navigate('/login', { replace: true })}>
              Skip for now
            </button>
            <button className="submit-btn" type="submit" disabled={loading}>
              {loading ? 'Completing...' : 'Complete Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
