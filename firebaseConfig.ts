import * as firebaseApp from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Helper to safely access environment variables in both Vite (browser) and other environments.
// We strictly check if 'process' is defined to avoid "ReferenceError: process is not defined" in browsers.
const getEnv = (key: string) => {
  // 1. Try Vite's import.meta.env (standard for Vite apps)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[`VITE_${key}`]) {
    // @ts-ignore
    return import.meta.env[`VITE_${key}`];
  }

  // 2. Try process.env (standard for Node/Webpack/CRA), but check if process exists first
  if (typeof process !== 'undefined' && process.env) {
    return process.env[`REACT_APP_${key}`] || process.env[key];
  }

  return undefined;
};

const firebaseConfig = {
  apiKey: getEnv('FIREBASE_API_KEY'),
  authDomain: getEnv('FIREBASE_AUTH_DOMAIN'),
  databaseURL: getEnv('FIREBASE_DATABASE_URL'),
  projectId: getEnv('FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('FIREBASE_APP_ID'),
  measurementId: getEnv('FIREBASE_MEASUREMENT_ID')
};

// Minimal check to ensure config is present before crashing
if (!firebaseConfig.apiKey) {
  console.error("Firebase Configuration is missing! Make sure you have set your .env variables (VITE_FIREBASE_API_KEY, etc).");
}

// Use namespace import to access initializeApp to avoid TS module resolution issues
const app = firebaseApp.initializeApp(firebaseConfig);
export const db = getDatabase(app);