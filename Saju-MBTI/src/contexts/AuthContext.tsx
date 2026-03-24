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
import { User, UserCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AuthService } from '@/lib/AuthService';

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

  // Initialize AuthService with Firebase auth instance
  const authService = new AuthService(auth);

  useEffect(() => {
    /**
     * Subscribe to auth state changes using AuthService
     * Returns unsubscribe function for cleanup
     */
    const unsubscribe = authService.onAuthStateChanged(
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
    return authService.login(email, password);
  };

  /**
   * Create new account with email and password
   */
  const signup = async (email: string, password: string): Promise<UserCredential> => {
    return authService.signup(email, password);
  };

  /**
   * Sign out current user
   */
  const logout = async (): Promise<void> => {
    return authService.logout();
  };

  /**
   * Sign in with Google OAuth (popup flow)
   */
  const loginWithGoogle = async (): Promise<UserCredential> => {
    return authService.loginWithGoogle();
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
