// simple controller returning static privacy/terms text

export const getPrivacy = (req, res) => {
  
  const privacyText = `SchoolRide is committed to protecting your privacy. We collect
only the information necessary to operate the platform, such as names,
email addresses, phone numbers, pickup/drop‑off locations, and device tokens
for push notifications. This data is used solely for providing ride
services, communicating trip status, and improving user experience.

We never sell your personal information. We may share data with third-parties
only when required by law or with your explicit permission (e.g., sharing a
driver's contact details with a parent for a scheduled trip). You can
request access to, correction of, or deletion of your personal data by
contacting support@example.com. All data is stored securely and retained
only as long as needed to fulfill the purposes described above.`;

  res.json({ success: true, privacy: privacyText });
};

export const getTerms = (req, res) => {

  const termsText = `These Terms of Service govern your access to and use of the
SchoolRide platform. By registering or using the service, you agree to these
terms:

1. **Eligibility** – You must be 18 years or older and provide accurate
   information when creating an account.
2. **User Responsibilities** – Parents and drivers must interact respectfully
   and lawfully. Misuse, fraud, or abusive behavior may result in
   suspension or termination of your account.
3. **Booking & Payment** – Trip details should be entered correctly. All
   payments are handled via the client app or a designated payment provider
   and are subject to their terms.
4. **Liability** – SchoolRide acts as a matching service. We are not
   responsible for the conduct of drivers or parents, and use of the service
   is at your own risk.
5. **Changes to Terms** – We reserve the right to modify these terms. Changes
   will be posted on this endpoint or within the app; continued use constitutes
   acceptance of the updated terms.

For a complete version of our terms, please visit the application or contact
support@example.com.`;

  res.json({ success: true, terms: termsText });
};
