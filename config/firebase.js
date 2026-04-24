const admin = require('firebase-admin');

// Check if already initialized (prevents errors on hot-reload)
if (!admin.apps.length) {
  try {
    // Parse private key (handle newlines properly)
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
    
    console.log('✅ Firebase Initialized');
  } catch (error) {
    console.log('⚠️ Firebase not configured - file uploads will be disabled');
    console.log('Hint: Add FIREBASE_* variables to .env');
  }
}

// Get storage bucket
const bucket = admin.apps.length ? admin.storage().bucket() : null;

module.exports = bucket;