/**
 * Firebase Client SDK Initialization & Configuration for Almas 7
 * Uses Vite client environment variables (VITE_FIREBASE_*)
 * Compatible with Chrome Extension Manifest V3 and Web Standard
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  browserLocalPersistence, 
  setPersistence 
} from 'firebase/auth';

// Read Firebase Web Client Configuration from Vite Environment Variables
export const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || '',
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || '',
};

// Check whether valid Firebase credentials have been provided
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'MY_FIREBASE_API_KEY' &&
  !firebaseConfig.apiKey.includes('PLACEHOLDER')
);

// Fallback configuration to prevent startup crashes when env variables are not yet populated
const fallbackConfig = {
  apiKey: 'AIzaSyPlaceholderDummyApiKeyForInitOnly000',
  authDomain: 'almas-7-dashboard.firebaseapp.com',
  projectId: 'almas-7-dashboard',
  storageBucket: 'almas-7-dashboard.appspot.com',
  messagingSenderId: '100000000000',
  appId: '1:100000000000:web:abcdef0123456789'
};

// Singleton Firebase App
export const app: FirebaseApp = getApps().length > 0
  ? getApp()
  : initializeApp(isFirebaseConfigured ? firebaseConfig : fallbackConfig);

// Singleton Firebase Auth
export const auth: Auth = getAuth(app);

// Safe session persistence across browser sessions & Chrome Extension pages
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('[Firebase Auth] Persistence setup note:', err?.message);
  });
}
