import * as firebaseApp from 'firebase/app';
import { getDatabase } from 'firebase/database';

const getEnvVar = (key: string) => {
  const prefixes = ['', 'REACT_APP_', 'VITE_', 'NEXT_PUBLIC_'];
  
  // 1. Try process.env (standard Node/Webpack/CRA)
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      for (const prefix of prefixes) {
        // @ts-ignore
        const val = process.env[`${prefix}${key}`];
        if (val) return val;
      }
    }
  } catch (e) {}

  // 2. Try import.meta.env (Vite/ESM)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      for (const prefix of prefixes) {
        // @ts-ignore
        const val = import.meta.env[`${prefix}${key}`];
        if (val) return val;
      }
    }
  } catch (e) {}
  
  return undefined;
};

const apiKey = getEnvVar('FIREBASE_API_KEY');
const projectId = getEnvVar('FIREBASE_PROJECT_ID');
let databaseURL = getEnvVar('FIREBASE_DATABASE_URL');

// Fallback logic for Database URL if Project ID is available
if (!databaseURL && projectId) {
  databaseURL = `https://${projectId}-default-rtdb.firebaseio.com`;
}

const firebaseConfig = {
  apiKey,
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN'),
  databaseURL,
  projectId,
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('FIREBASE_APP_ID'),
  measurementId: getEnvVar('FIREBASE_MEASUREMENT_ID')
};

let app;
let db;

if (apiKey) {
    try {
        // Use type casting to avoid "Module has no exported member" error in some environments
        app = (firebaseApp as any).initializeApp(firebaseConfig);
        
        // Only attempt to get database if we have a URL, otherwise it throws a fatal error
        if (databaseURL) {
            try {
                db = getDatabase(app);
            } catch (dbError) {
                console.error("Firebase Database Initialization failed:", dbError);
            }
        } else {
            console.warn("Firebase Database URL missing. Realtime features will not work.");
        }
    } catch (e) {
        console.error("Firebase Initialization Error:", e);
    }
} else {
    console.error("Firebase Configuration missing (API Key not found). Check your environment variables.");
}

export { app, db };