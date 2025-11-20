
import { initializeApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';

// Helper to safely access environment variables in various environments (Vite, CRA, Node, etc.)
const getEnvVar = (key: string): string | undefined => {
  const prefixes = ['', 'REACT_APP_', 'VITE_', 'NEXT_PUBLIC_'];
  
  // 1. Try process.env
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

  // 2. Try import.meta.env
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

// Retrieve specific variables with fallback logic
const apiKey = getEnvVar('FIREBASE_API_KEY');
const projectId = getEnvVar('FIREBASE_PROJECT_ID');

// Construct Database URL from Project ID if not explicitly provided
const databaseURL = getEnvVar('FIREBASE_DATABASE_URL') || (projectId ? `https://${projectId}-default-rtdb.firebaseio.com` : undefined);

// Optional / Inferred configurations
const authDomain = getEnvVar('FIREBASE_AUTH_DOMAIN') || (projectId ? `${projectId}.firebaseapp.com` : undefined);
const storageBucket = getEnvVar('FIREBASE_STORAGE_BUCKET') || (projectId ? `${projectId}.appspot.com` : undefined);
const messagingSenderId = getEnvVar('FIREBASE_MESSAGING_SENDER_ID');
const appId = getEnvVar('FIREBASE_APP_ID');
const measurementId = getEnvVar('FIREBASE_MEASUREMENT_ID');

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

let app;
let db: Database | undefined;

// --- VALIDATION ---
const missingVars: string[] = [];
if (!apiKey) missingVars.push('FIREBASE_API_KEY');
if (!projectId) missingVars.push('FIREBASE_PROJECT_ID');

if (missingVars.length > 0) {
  console.error(`
    🔥 FIREBASE CONFIGURATION ERROR:
    The following environment variables are missing: ${missingVars.join(', ')}
    
    To fix this:
    1. Create a .env file in your project root (or configure your environment settings).
    2. Add the following keys:
       FIREBASE_API_KEY=AIzaSy...
       FIREBASE_PROJECT_ID=your-project-id
       FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
  `);
} else {
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    
    if (!databaseURL) {
        console.warn('⚠️ FIREBASE WARNING: FIREBASE_DATABASE_URL is missing. Real-time features will not work.');
    } else {
        try {
            db = getDatabase(app);
            console.log('✅ Firebase initialized successfully');
        } catch (dbError) {
             console.error('❌ Firebase Database Initialization Failed:', dbError);
        }
    }
  } catch (error) {
    console.error('❌ Firebase Initialization Failed:', error);
  }
}

export { app, db };
