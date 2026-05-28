import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCamera, FiSave } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { fetchApi } from '../../api';
import './DriverProfile.css';

const initialForm = {
	name: '',
	email: '',
	phone_number: '',
	license_number: '',
	vehicle_type: '',
	years_experience: '',
	vehicle_number: '',
	vehicle_seats: '',
	profile_photo: '',
};

const vehicleOptions = ['Car', 'Van', 'Bus'];

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

const normalizeNumberField = (value) => {
	if (value === '') return '';
	return Number(value);
};

const getCompletionScore = (form) => {
	const requiredFields = [
		form.name,
		form.email,
		form.phone_number,
		form.license_number,
		form.vehicle_type,
		form.years_experience,
		form.vehicle_number,
		form.vehicle_seats,
	];

	const filled = requiredFields.filter((value) => String(value ?? '').trim() !== '').length;
	return Math.round((filled / requiredFields.length) * 100);
};

export default function DriverProfile() {
	const navigate = useNavigate();
	const storedUser = JSON.parse(localStorage.getItem('authUser') || '{}');
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState(null);
	const [form, setForm] = useState(initialForm);
	const [errors, setErrors] = useState({});
	const [photoPreview, setPhotoPreview] = useState('');
	const [accessChecked, setAccessChecked] = useState(false);

	const displayName = form.name || storedUser.name || 'Driver';
	const displayEmail = form.email || storedUser.email || '';
	const displayPhone = form.phone_number || storedUser.phone_number || storedUser.phone || '';
	const profileScore = useMemo(() => getCompletionScore(form), [form]);

	useEffect(() => {
		const loadDriverProfile = async () => {
			const cachedRole = localStorage.getItem('userRole') || storedUser.role || '';
			if (cachedRole && cachedRole !== 'driver') {
				navigate('/profile', { replace: true });
				return;
			}

			const { status, data } = await fetchApi('/user/getProfile');

			if (status === 401) {
				navigate('/login', { replace: true });
				return;
			}

			if (status !== 200 || !data?.success) {
				setMessage({ type: 'error', text: data?.message || 'Unable to load driver profile.' });
				setLoading(false);
				setAccessChecked(true);
				return;
			}

			const user = data.user || {};
			if (user.role !== 'driver') {
				navigate('/profile', { replace: true });
				return;
			}

			const profile = data.roleProfile || {};
			const mappedForm = {
				name: user.name || '',
				email: user.email || '',
				phone_number: user.phone_number || '',
				license_number: profile.license_number || '',
				vehicle_type: normalizeVehicleType(profile.vehicle_type),
				years_experience: profile.years_experience ?? '',
				vehicle_number: profile.vehicle_number || '',
				vehicle_seats: profile.vehicle_seats ?? '',
				profile_photo: user.profile_photo || profile.profile_photo || '',
			};

			setForm(mappedForm);
			setPhotoPreview(mappedForm.profile_photo || '');
			setLoading(false);
			setAccessChecked(true);
		};

		loadDriverProfile();
	}, [navigate, storedUser.role]);

	const handleChange = (event) => {
		const { name, value } = event.target;
		setForm((previous) => ({ ...previous, [name]: value }));
		setErrors((previous) => ({ ...previous, [name]: '' }));
	};

	const handlePhotoChange = (event) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith('image/')) {
			setErrors((previous) => ({ ...previous, profile_photo: 'Please choose an image file.' }));
			return;
		}

		if (file.size > 3 * 1024 * 1024) {
			setErrors((previous) => ({ ...previous, profile_photo: 'Profile photo must be smaller than 3MB.' }));
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			const result = typeof reader.result === 'string' ? reader.result : '';
			setPhotoPreview(result);
			setForm((previous) => ({ ...previous, profile_photo: result }));
			setErrors((previous) => ({ ...previous, profile_photo: '' }));
		};
		reader.readAsDataURL(file);
	};

	const validateForm = () => {
		const nextErrors = {};

		if (!form.name.trim()) nextErrors.name = 'Driver name is required.';
		if (!form.email.trim()) nextErrors.email = 'Email address is required.';
		else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.';

		if (!form.phone_number.trim()) nextErrors.phone_number = 'Phone number is required.';
		else if (!/^\d{10}$/.test(form.phone_number.trim())) nextErrors.phone_number = 'Phone number must be 10 digits.';

		if (!form.license_number.trim()) nextErrors.license_number = 'License number is required.';
		if (!form.vehicle_type.trim()) nextErrors.vehicle_type = 'Vehicle type is required.';

		if (form.years_experience === '') {
			nextErrors.years_experience = 'Years of experience is required.';
		} else if (!Number.isInteger(Number(form.years_experience)) || Number(form.years_experience) < 0) {
			nextErrors.years_experience = 'Enter a valid non-negative number.';
		}

		if (!form.vehicle_number.trim()) nextErrors.vehicle_number = 'Vehicle number is required.';

		if (form.vehicle_seats === '') {
			nextErrors.vehicle_seats = 'Vehicle seat count is required.';
		} else if (!Number.isInteger(Number(form.vehicle_seats)) || Number(form.vehicle_seats) <= 0) {
			nextErrors.vehicle_seats = 'Seats must be a positive whole number.';
		}

		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const handleSubmit = async (event) => {
		event.preventDefault();

		if (!validateForm()) {
			setMessage({ type: 'error', text: 'Please fix the highlighted fields before saving.' });
			return;
		}

		setSaving(true);
		setMessage(null);

		try {
			const userPayload = {
				name: form.name.trim(),
				email: form.email.trim(),
				phone_number: form.phone_number.trim(),
				profile_photo: form.profile_photo || '',
			};

			const { status: userStatus, data: userData } = await fetchApi('/user/updateProfile', {
				method: 'PUT',
				body: JSON.stringify(userPayload),
			});

			if (userStatus !== 200 || !userData?.success) {
				setMessage({ type: 'error', text: userData?.message || 'Unable to update your contact information.' });
				return;
			}

			const driverPayload = {
				license_number: form.license_number.trim(),
				vehicle_type: form.vehicle_type,
				years_experience: normalizeNumberField(form.years_experience),
				vehicle_number: form.vehicle_number.trim(),
				vehicle_seats: normalizeNumberField(form.vehicle_seats),
				profile_photo: form.profile_photo || '',
			};

			const { status: driverStatus, data: driverData } = await fetchApi('/user/updateDriverProfile', {
				method: 'PUT',
				body: JSON.stringify(driverPayload),
			});

			if (driverStatus !== 200 || !driverData?.success) {
				setMessage({ type: 'error', text: driverData?.message || 'Contact details were saved, but driver details failed to update.' });
				return;
			}

			const updatedUser = userData.user || {};
			localStorage.setItem('authUser', JSON.stringify(updatedUser));
			localStorage.setItem('userRole', updatedUser.role || 'driver');
			localStorage.setItem(
				'driverProfileData',
				JSON.stringify({
					...driverData.profile,
					name: updatedUser.name,
					email: updatedUser.email,
					phone_number: updatedUser.phone_number,
					profile_photo: updatedUser.profile_photo || driverData.profile?.profile_photo || '',
				})
			);
			window.dispatchEvent(new Event('driverProfileUpdated'));

			setForm((previous) => ({
				...previous,
				profile_photo: updatedUser.profile_photo || driverData.profile?.profile_photo || '',
			}));
			setPhotoPreview(updatedUser.profile_photo || driverData.profile?.profile_photo || '');
			setMessage({ type: 'success', text: 'Driver profile updated successfully.' });
			toast.success('Driver profile updated successfully. Redirecting to dashboard...');
			setTimeout(() => {
				navigate('/driver/dashboard', { replace: true });
			}, 900);
		} catch (error) {
			setMessage({ type: 'error', text: error?.message || 'Unable to save driver profile right now.' });
			toast.error(error?.message || 'Unable to save driver profile right now.');
		} finally {
			setSaving(false);
		}
	};

	if (loading && !accessChecked) {
		return (
			<div className="driver-profile-page driver-profile-page--loading">
				<div className="driver-profile-loader">Loading driver dashboard...</div>
			</div>
		);
	}

	return (
		<div className="driver-profile-page">
			<header className="driver-profile-page__header">
				<button className="driver-profile-page__back" onClick={() => navigate(-1)} aria-label="Go back">
					<FiArrowLeft />
				</button>
				<div>
					<h1 className="driver-profile-page__title">Driver Profile Dashboard</h1>
					<p className="driver-profile-page__subtitle">Manage your personal details, license, vehicle, and profile photo in one place.</p>
				</div>
			</header>

			<main className="driver-profile-page__content">
				{message && <div className={`driver-profile-alert driver-profile-alert--${message.type}`}>{message.text}</div>}

				<section className="driver-hero">
					<div className="driver-hero__avatar-wrap">
						<div className="driver-hero__avatar" style={photoPreview ? { backgroundImage: `url(${photoPreview})` } : undefined}>
							{!photoPreview && displayName.charAt(0).toUpperCase()}
						</div>
						<label className="driver-photo-upload">
							<input type="file" accept="image/*" onChange={handlePhotoChange} className="driver-photo-upload__input" />
							<span className="driver-photo-upload__button">
								<FiCamera />
								Upload photo
							</span>
						</label>
						{errors.profile_photo && <p className="driver-field__error">{errors.profile_photo}</p>}
					</div>

					<div className="driver-hero__content">
						<div className="driver-hero__topline">
							<span className="driver-badge">Driver account</span>
							<span className="driver-score">{profileScore}% complete</span>
						</div>
						<h2>{displayName}</h2>
						<p>Keep your profile current so ride operations, safety checks, and contact details stay accurate.</p>
						<div className="driver-hero__meta">
							<span>📧 {displayEmail || 'No email found'}</span>
							<span>📱 {displayPhone || 'No phone found'}</span>
							<span>🪪 {form.license_number || 'License pending'}</span>
						</div>
					</div>
				</section>

				<section className="driver-summary-grid" aria-label="Driver profile status">
					<article className="driver-summary-card">
						<span className="driver-summary-card__label">Profile readiness</span>
						<strong>{profileScore}%</strong>
						<p>{profileScore === 100 ? 'All driver details are filled in.' : 'Complete every section to finish setup.'}</p>
					</article>
					<article className="driver-summary-card">
						<span className="driver-summary-card__label">Vehicle type</span>
						<strong>{form.vehicle_type || 'Not selected'}</strong>
						<p>Use the same vehicle details that appear on official records.</p>
					</article>
					<article className="driver-summary-card">
						<span className="driver-summary-card__label">License status</span>
						<strong>{form.license_number ? 'Added' : 'Pending'}</strong>
						<p>Required for driver verification and trip readiness.</p>
					</article>
				</section>

				<form className="driver-profile-card" onSubmit={handleSubmit}>
					{loading ? (
						<div className="driver-profile-loader">Loading driver details...</div>
					) : (
						<>
							<section className="driver-section">
								<div className="driver-section__header">
									<div>
										<h2 className="driver-section__title">Personal Details</h2>
										<p className="driver-section__subtitle">Keep your name and contact information accurate for alerts and support.</p>
									</div>
								</div>

								<div className="driver-grid">
									<label className="driver-field">
										<span className="driver-field__label">👤 Full Name</span>
										<input name="name" value={form.name} onChange={handleChange} className="driver-input" placeholder="Enter full name" />
										{errors.name && <span className="driver-field__error">{errors.name}</span>}
									</label>

									<label className="driver-field">
										<span className="driver-field__label">✉️ Email Address</span>
										<input name="email" type="email" value={form.email} onChange={handleChange} className="driver-input" placeholder="Enter email address" />
										{errors.email && <span className="driver-field__error">{errors.email}</span>}
									</label>

									<label className="driver-field driver-field--full">
										<span className="driver-field__label">📞 Contact Number</span>
										<input name="phone_number" value={form.phone_number} onChange={handleChange} className="driver-input" placeholder="10-digit phone number" />
										{errors.phone_number && <span className="driver-field__error">{errors.phone_number}</span>}
									</label>
								</div>
							</section>

							<section className="driver-section">
								<div className="driver-section__header">
									<div>
										<h2 className="driver-section__title">License Information</h2>
										<p className="driver-section__subtitle">Provide the license information used for verification.</p>
									</div>
								</div>

								<div className="driver-grid">
									<label className="driver-field driver-field--full">
										<span className="driver-field__label">🪪 License Number</span>
										<input name="license_number" value={form.license_number} onChange={handleChange} className="driver-input" placeholder="Enter license number" />
										{errors.license_number && <span className="driver-field__error">{errors.license_number}</span>}
									</label>

									<label className="driver-field">
										<span className="driver-field__label">⭐ Years of Experience</span>
										<input name="years_experience" type="number" min="0" value={form.years_experience} onChange={handleChange} className="driver-input" placeholder="Years driving" />
										{errors.years_experience && <span className="driver-field__error">{errors.years_experience}</span>}
									</label>
								</div>
							</section>

							<section className="driver-section">
								<div className="driver-section__header">
									<div>
										<h2 className="driver-section__title">Vehicle Details</h2>
										<p className="driver-section__subtitle">Keep the vehicle data aligned with the registered transport record.</p>
									</div>
								</div>

								<div className="driver-grid">
									<label className="driver-field">
										<span className="driver-field__label">🚐 Vehicle Type</span>
										<select name="vehicle_type" value={form.vehicle_type} onChange={handleChange} className="driver-input">
											<option value="">Select vehicle type</option>
											{vehicleOptions.map((option) => (
												<option key={option} value={option}>
													{option}
												</option>
											))}
										</select>
										{errors.vehicle_type && <span className="driver-field__error">{errors.vehicle_type}</span>}
									</label>

									<label className="driver-field">
										<span className="driver-field__label">🔢 Vehicle Number</span>
										<input name="vehicle_number" value={form.vehicle_number} onChange={handleChange} className="driver-input" placeholder="Enter vehicle number" />
										{errors.vehicle_number && <span className="driver-field__error">{errors.vehicle_number}</span>}
									</label>

									<label className="driver-field driver-field--full">
										<span className="driver-field__label">💺 Vehicle Seats</span>
										<input name="vehicle_seats" type="number" min="1" value={form.vehicle_seats} onChange={handleChange} className="driver-input" placeholder="Number of seats" />
										{errors.vehicle_seats && <span className="driver-field__error">{errors.vehicle_seats}</span>}
									</label>
								</div>
							</section>

							<div className="driver-actions">
								<button type="button" className="driver-btn driver-btn--ghost" onClick={() => navigate(-1)}>
									Cancel
								</button>
								<button type="submit" className="driver-btn driver-btn--primary" disabled={saving}>
									{saving ? 'Saving...' : <><FiSave /> Save Changes</>}
								</button>
							</div>
						</>
					)}
				</form>
			</main>
		</div>
	);
}
