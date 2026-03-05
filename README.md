# SchoolRide

## Authentication & Onboarding Flow

- **Sign‑up**: user must first select account type (`parent` or `driver`) on the onboarding screen. The backend requires a `role` field and validates that it is one of those two values.  
  All other fields (`name`, `email`, `password`, `phone_number`) are mandatory.
- **Email verification**: not enforced during initial sign‑up; the user can verify later using the `/send-verify-otp` and `/verify-email` endpoints.
- **Google login**: not available as a first step.  The `/google-login` endpoint only works for existing accounts (it will return a 400 error if the email is unknown).  This ensures that users must complete the standard registration form before signing in with Google.

Updates performed in code:

- `controllers/authController.js` – added role check in `register` (`signup` renamed) and modified `googleLogin` to refuse new registrations.
- Extracted common logic into utilities:
  - `utils/generateToken.js` handles JWT creation.
  - `utils/authHelpers.js` now contains `setAuthCookie` and `issueOtp` so controllers no longer manage cookies or OTP values directly.
  - `utils/sendEmail.js` provides generic mailing helpers including OTP email templates.
- Controller methods cleaned up accordingly (no manual cookie configuration, OTP generation moved out).

