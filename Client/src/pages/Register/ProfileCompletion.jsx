import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegisterPage.css';

export default function ProfileCompletion() {
  const [userRole, setUserRole] = useState('parent');
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

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'parent';
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

    // Store profile data in localStorage for now
    localStorage.setItem('profileData', JSON.stringify(formData));

    // Dispatch event to notify other components about school name update
    window.dispatchEvent(new Event('schoolNameUpdated'));

    // Add a small delay for better UX
    setTimeout(() => {
      setLoading(false);
      setMessage({ type: 'success', text: 'Profile completed successfully. Redirecting to login...' });
      
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    }, 500);
  };

  const isParent = userRole === 'parent';
  const isDriver = userRole === 'driver';

  return (
    <div className="register-page">
      <div className="register-shell">
        <div className="register-header">
          <h1 className="register-title">Complete Your Profile</h1>
          <p className="register-subtitle">
            {isParent ? 'Tell us about your child' : isDriver ? 'Tell us about your driving' : 'Complete your profile'}
          </p>
        </div>

        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        <form className="register-form" onSubmit={handleSubmit}>
          {/* Parent-specific fields */}
          {isParent && (
            <div className="form-section">
              <h3 className="section-title">Child Information</h3>
              
              <div className="field-group">
                <label className="field-label" htmlFor="child_name">Child's Name</label>
                <input
                  id="child_name"
                  className="text-input"
                  type="text"
                  name="child_name"
                  value={formData.child_name}
                  onChange={handleChange}
                  placeholder="Enter your child's name"
                />
              </div>

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
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="van">Van</option>
                  <option value="minibus">Minibus</option>
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
