/**
 * Firebase Configuration
 *
 * This file initializes Firebase with the modular SDK (v10+).
 *
 * Environment Variables Required:
 * Create a .env.local file in the project root with:
 *
 * NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
 * NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
 * NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
 * NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
 * NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
 * NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
 *
 * Note: NEXT_PUBLIC_ prefix is required for client-side access in Next.js
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration object
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Validates that all required Firebase configuration values are present
 * @returns {boolean} True if all required variables are present
 */
function validateFirebaseConfig(): boolean {
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    // Only warn during build, don't throw error
    // This allows static export to complete without Firebase configuration
    console.warn(
      `⚠️  Firebase environment variables not configured: ${missingVars.join(', ')}\n` +
      '   Authentication features will not work until .env.local is configured.\n' +
      '   See .env.local.example for setup instructions.'
    );
    return false;
  }

  return true;
}

/**
 * Initialize Firebase app (singleton pattern)
 * Prevents duplicate initialization by checking existing apps
 */
let app: FirebaseApp;

// Validate configuration
const isConfigured = validateFirebaseConfig();

// Only initialize if configuration is valid
if (isConfigured) {
  try {
    // Check if Firebase app is already initialized
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      console.log('✓ Firebase initialized successfully');
    } else {
      app = getApp();
      console.log('✓ Using existing Firebase app instance');
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
} else {
  // Create a dummy app for build-time compatibility
  // This allows the app to build without Firebase configuration
  // Firebase features will be disabled until properly configured
  if (typeof window === 'undefined') {
    // Server-side (build time) - create placeholder
    console.warn('⚠️  Building without Firebase configuration');
  }

  // Create a minimal stub that won't crash the build
  app = {} as FirebaseApp;
}

/**
 * Firebase Auth instance
 * Use this for all authentication operations
 * Will be null if Firebase is not configured
 */
export const auth: Auth | null = isConfigured ? getAuth(app) : null as any;

/**
 * Firebase App instance
 * Export for advanced use cases that need direct app access
 */
export { app, isConfigured };

export default auth;
