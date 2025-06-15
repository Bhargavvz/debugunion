import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Firebase service account configuration
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

// Get Firebase services
export const auth = admin.auth();
export const database = admin.database();
export const firestore = admin.firestore();

// Database references
export const dbRefs = {
  users: database.ref('users'),
  issues: database.ref('issues'),
  comments: database.ref('comments'),
  fixes: database.ref('fixes'),
  messages: database.ref('messages'),
  conversations: database.ref('conversations'),
  notifications: database.ref('notifications'),
  leaderboard: database.ref('leaderboard'),
  badges: database.ref('badges')
};

// Helper functions for database operations
export const firebaseHelpers = {
  // Generate a new push key
  generateKey: (ref) => ref.push().key,

  // Get server timestamp
  getServerTimestamp: () => admin.database.ServerValue.TIMESTAMP,

  // Validate Firebase UID format
  isValidUID: (uid) => /^[a-zA-Z0-9]{28}$/.test(uid),

  // Create batch updates
  createBatchUpdate: (updates) => database.ref().update(updates),

  // Transaction helper
  runTransaction: (ref, updateFunction) => ref.transaction(updateFunction)
};

export default admin;
