// Firebase configuration for frontend integration
// This file contains the public Firebase configuration
// Use this in your frontend React app

export const firebaseConfig = {
  apiKey: "AIzaSyCQn2VetH_uvCLOPiiSVwlb0d6ToIumFTc",
  authDomain: "debugunion.firebaseapp.com",
  projectId: "debugunion",
  storageBucket: "debugunion.firebasestorage.app",
  messagingSenderId: "458197287671",
  appId: "1:458197287671:web:9e9da763381b8468a009f2",
  databaseURL: "https://debugunion-default-rtdb.firebaseio.com/"
};

// Authentication settings
export const authSettings = {
  persistence: 'local', // Keep user signed in
  enableMultiDevice: true,
  autoSignOut: false
};

// Database settings
export const databaseSettings = {
  cacheSizeBytes: 40000000, // 40MB cache
  experimentalForceLongPolling: false
};

// Export for easy import in frontend
export default firebaseConfig;

/*
Usage in your React frontend:

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const database = getDatabase(app);
*/
