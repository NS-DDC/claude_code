/**
 * Authentication Context Provider
 *
 * Manages user authentication state and provides auth methods throughout the app.
 * Built with Firebase Authentication (modular SDK v10+).
 *
 * @example
 * ```tsx
 * // Wrap your app with AuthProvider
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 *
 * // Use in components
 * const { user, login, logout } = useAuth();
 * ```
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

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
 * Authentication context value type
 */
interface AuthContextType {
  /** Currently authenticated user, or null if not authenticated */
  user: User | null;
  /** Loading state during initial auth check */
  loading: boolean;
  /**
   * Sign in with email and password
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise resolving to UserCredential
   * @throws Error with user-friendly message
   */
  login: (email: string, password: string) => Promise<UserCredential>;
  /**
   * Create new account with email and password
   * @param email - User's email address
   * @param password - User's password (minimum 6 characters)
   * @returns Promise resolving to UserCredential
   * @throws Error with user-friendly message
   */
  signup: (email: string, password: string) => Promise<UserCredential>;
  /**
   * Sign out the current user
   * @returns Promise that resolves when sign out is complete
   * @throws Error with user-friendly message
   */
  logout: () => Promise<void>;
  /**
   * Sign in with Google account (popup)
   * @returns Promise resolving to UserCredential
   * @throws Error with user-friendly message
   */
  loginWithGoogle: () => Promise<UserCredential>;
}

/**
 * Authentication Context
 * @internal Use useAuth() hook instead of direct context access
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Props for AuthProvider component
 */
interface AuthProviderProps {
  /** Child components that need access to auth context */
  children: ReactNode;
}

/**
 * Authentication Provider Component
 *
 * Wraps the application and provides authentication state and methods.
 * Monitors Firebase auth state changes and syncs with React state.
 *
 * @param props - Component props
 * @returns Provider component wrapping children
 */
export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // If Firebase is not configured, skip auth state monitoring
    if (!auth) {
      console.warn('Firebase not configured. Authentication disabled.');
      setLoading(false);
      return;
    }

    /**
     * Subscribe to auth state changes
     * Returns unsubscribe function for cleanup
     */
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser: User | null) => {
        setUser(currentUser);
        setLoading(false);

        if (currentUser) {
          console.log('User authenticated:', currentUser.uid);
        } else {
          console.log('User signed out');
        }
      },
      (error: Error) => {
        console.error('Auth state change error:', error);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  /**
   * Login with email and password
   */
  const login = async (email: string, password: string): Promise<UserCredential> => {
    if (!auth) {
      throw new Error('Firebase is not configured. Please set up Firebase authentication.');
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error: any) {
      const errorMessage = AUTH_ERROR_MESSAGES[error.code] ||
        'Failed to sign in. Please try again.';
      throw new Error(errorMessage);
    }
  };

  /**
   * Create new account with email and password
   */
  const signup = async (email: string, password: string): Promise<UserCredential> => {
    if (!auth) {
      throw new Error('Firebase is not configured. Please set up Firebase authentication.');
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error: any) {
      const errorMessage = AUTH_ERROR_MESSAGES[error.code] ||
        'Failed to create account. Please try again.';
      throw new Error(errorMessage);
    }
  };

  /**
   * Sign out current user
   */
  const logout = async (): Promise<void> => {
    if (!auth) {
      throw new Error('Firebase is not configured. Please set up Firebase authentication.');
    }
    try {
      await signOut(auth);
    } catch (error: any) {
      const errorMessage = AUTH_ERROR_MESSAGES[error.code] ||
        'Failed to sign out. Please try again.';
      throw new Error(errorMessage);
    }
  };

  /**
   * Sign in with Google OAuth (popup flow)
   */
  const loginWithGoogle = async (): Promise<UserCredential> => {
    if (!auth) {
      throw new Error('Firebase is not configured. Please set up Firebase authentication.');
    }
    try {
      const provider = new GoogleAuthProvider();
      // Optional: Add custom OAuth parameters
      provider.setCustomParameters({
        prompt: 'select_account', // Force account selection
      });

      const userCredential = await signInWithPopup(auth, provider);
      return userCredential;
    } catch (error: any) {
      const errorMessage = AUTH_ERROR_MESSAGES[error.code] ||
        'Failed to sign in with Google. Please try again.';
      throw new Error(errorMessage);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    loginWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication context
 *
 * @returns Authentication context with user state and auth methods
 * @throws Error if used outside of AuthProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, login, logout, loading } = useAuth();
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   if (user) {
 *     return <button onClick={logout}>Sign Out</button>;
 *   }
 *
 *   return <button onClick={() => login(email, password)}>Sign In</button>;
 * }
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
