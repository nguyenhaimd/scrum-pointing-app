import * as firebase from 'firebase/app';
import { getDatabase } from 'firebase/database';

// We use import.meta.env to access variables in Vite. 
// We also keep process.env as a fallback if you use a different builder.
const getEnv = (key: string) => {
  // @ts-ignore
  return import.meta.env[`VITE_${key}`] || process.env[`REACT_APP_${key}`] || process.env[key];
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

// minimal check to ensure config is present before crashing
if (!firebaseConfig.apiKey) {
  console.error("Firebase Configuration is missing! Make sure you have set your .env variables (VITE_FIREBASE_API_KEY, etc).");
}

const app = firebase.initializeApp(firebaseConfig);
export const db = getDatabase(app);