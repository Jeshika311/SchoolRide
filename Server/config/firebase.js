import admin from 'firebase-admin';

let isInitialized = false;

const initializeFirebase = () => {
	if (isInitialized || admin.apps.length > 0) {
		isInitialized = true;
		return true;
	}

	try {
		// Prefer env-configured service account values for deployment portability.
		if (
			process.env.FIREBASE_PROJECT_ID &&
			process.env.FIREBASE_CLIENT_EMAIL &&
			process.env.FIREBASE_PRIVATE_KEY
		) {
			const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

			admin.initializeApp({
				credential: admin.credential.cert({
					projectId: process.env.FIREBASE_PROJECT_ID,
					clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
					privateKey
				})
			});

			isInitialized = true;
			return true;
		}

		return false;
	} catch (_error) {
		return false;
	}
};

export const isFirebaseReady = () => initializeFirebase();

export default admin;