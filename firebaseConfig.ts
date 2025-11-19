
import * as firebaseApp from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Attempt to retrieve environment variables safely.
// We prioritize direct access for bundler replacement, but wrap in try-catch
// to handle environments where 'process' is not defined at runtime.

let apiKey, authDomain, projectId, databaseURL, storageBucket, messagingSenderId, appId, measurementId;

try {
  // @ts-ignore
  apiKey = process.env.FIREBASE_API_KEY || process.env.REACT_APP_FIREBASE_API_KEY;
  // @ts-ignore
  authDomain = process.env.FIREBASE_AUTH_DOMAIN || process.env.REACT_APP_FIREBASE_AUTH_DOMAIN;
  // @ts-ignore
  projectId = process.env.FIREBASE_PROJECT_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID;
  // @ts-ignore
  databaseURL = process.env.FIREBASE_DATABASE_URL || process.env.REACT_APP_FIREBASE_DATABASE_URL;
  // @ts-ignore
  storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.REACT_APP_FIREBASE_STORAGE_BUCKET;
  // @ts-ignore
  messagingSenderId = process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID;
  // @ts-ignore
  appId = process.env.FIREBASE_APP_ID || process.env.REACT_APP_FIREBASE_APP_ID;
  // @ts-ignore
  measurementId = process.env.FIREBASE_MEASUREMENT_ID || process.env.REACT_APP_FIREBASE_MEASUREMENT_ID;
} catch (e) {
  // process is likely undefined
}

// Fallback for Vite environments (using import.meta.env)
if (!apiKey && typeof import.meta !== 'undefined' && (import.meta as any).env) {
  // @ts-ignore
  apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  // @ts-ignore
  authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  // @ts-ignore
  projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  // @ts-ignore
  databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL;
  // @ts-ignore
  storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  // @ts-ignore
  messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  // @ts-ignore
  appId = import.meta.env.VITE_FIREBASE_APP_ID;
  // @ts-ignore
  measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;
}

// Fallback logic for Database URL
if (!databaseURL && projectId) {
  databaseURL = `https://${projectId}-default-rtdb.firebaseio.com`;
}

const firebaseConfig = {
  apiKey,
  authDomain,
  databaseURL,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId
};

// Check if critical config is missing
if (!firebaseConfig.apiKey) {
  console.error("Firebase Configuration is completely missing! Check your .env file.");
}

// @ts-ignore
const app = firebaseApp.initializeApp(firebaseConfig);
export const db = getDatabase(app);
