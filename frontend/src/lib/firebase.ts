import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCQn2VetH_uvCLOPiiSVwlb0d6ToIumFTc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "debugunion.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://debugunion-default-rtdb.firebaseio.com/",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "debugunion",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "debugunion.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "458197287671",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:458197287671:web:9e9da763381b8468a009f2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

// Connect to emulators in development
if (import.meta.env.DEV) {
  // Uncomment these lines if you're using Firebase emulators locally
  // connectAuthEmulator(auth, "http://localhost:9099");
  // connectDatabaseEmulator(database, "localhost", 9000);
}

export default app;
