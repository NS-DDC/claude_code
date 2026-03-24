/**
 * Authentication Service
 *
 * Centralized authentication business logic using Firebase Authentication.
 * Handles all auth operations with consistent error handling and validation.
 *
 * @example
 * ```ts
 * const authService = new AuthService();
 *
 * // Login
 * const user = await authService.login('user@example.com', 'password123');
 *
 * // Sign up
 * const newUser = await authService.signup('new@example.com', 'password123');
 *
 * // Logout
 * await authService.logout();
 * ```
 */

import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
  onAuthStateChanged,
  User,
} from 'firebase/auth';

/**
 * Firebase Auth error codes mapped to user-friendly messages
 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'This email is already registered. Please login instead.',
  'auth/invalid-email': 'Invalid email address format.',
  'auth/operation-not-allowed': 'Email/password accounts are not enabled. Please contact support.',
  'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/popup-closed-by-user': 'Sign-in popup was closed before completing.',
  'auth/cancelled-popup-request': 'Only one popup request is allowed at a time.',
  'auth/popup-blocked': 'Sign-in popup was blocked by the browser.',
};

/**
 * Authentication Service Class
 *
 * Provides centralized authentication methods with consistent error handling.
 */
export class AuthService {
  private auth: Auth | null;

  /**
   * Create a new AuthService instance
   * @param auth - Firebase Auth instance (can be null if not configured)
   */
  constructor(auth: Auth | null) {
    this.auth = auth;
  }

  /**
   * Check if Firebase authentication is configured
   * @throws Error if Firebase is not configured
   */
  private ensureConfigured(): void {
    if (!this.auth) {
      throw new Error('Firebase is not configured. Please set up Firebase authentication.');
    }
  }

  /**
   * Get user-friendly error message for Firebase auth error
   * @param error - Firebase auth error
   * @returns User-friendly error message
   */
  private getErrorMessage(error: any): string {
    return AUTH_ERROR_MESSAGES[error.code] || 'An error occurred. Please try again.';
  }

  /**
   * Sign in with email and password
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise resolving to UserCredential
   * @throws Error with user-friendly message
   */
  async login(email: string, password: string): Promise<UserCredential> {
    this.ensureConfigured();

    try {
      const userCredential = await signInWithEmailAndPassword(this.auth!, email, password);
      return userCredential;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Create new account with email and password
   * @param email - User's email address
   * @param password - User's password (minimum 6 characters)
   * @returns Promise resolving to UserCredential
   * @throws Error with user-friendly message
   */
  async signup(email: string, password: string): Promise<UserCredential> {
    this.ensureConfigured();

    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth!, email, password);
      return userCredential;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Sign out the current user
   * @returns Promise that resolves when sign out is complete
   * @throws Error with user-friendly message
   */
  async logout(): Promise<void> {
    this.ensureConfigured();

    try {
      await signOut(this.auth!);
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Sign in with Google account (popup)
   * @returns Promise resolving to UserCredential
   * @throws Error with user-friendly message
   */
  async loginWithGoogle(): Promise<UserCredential> {
    this.ensureConfigured();

    try {
      const provider = new GoogleAuthProvider();
      // Force account selection
      provider.setCustomParameters({
        prompt: 'select_account',
      });

      const userCredential = await signInWithPopup(this.auth!, provider);
      return userCredential;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Subscribe to authentication state changes
   * @param callback - Function called when auth state changes
   * @param errorCallback - Optional function called on auth errors
   * @returns Unsubscribe function
   */
  onAuthStateChanged(
    callback: (user: User | null) => void,
    errorCallback?: (error: Error) => void
  ): () => void {
    if (!this.auth) {
      console.warn('Firebase not configured. Authentication disabled.');
      // Call callback immediately with null user
      callback(null);
      // Return no-op unsubscribe function
      return () => {};
    }

    return onAuthStateChanged(
      this.auth,
      callback,
      errorCallback
    );
  }
}
