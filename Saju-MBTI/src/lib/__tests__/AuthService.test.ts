/**
 * AuthService Unit Tests
 *
 * Comprehensive test suite for AuthService class covering all authentication methods
 * and error handling scenarios.
 */

import { AuthService } from '../AuthService';
import {
  Auth,
  UserCredential,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
} from 'firebase/auth';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  signInWithPopup: jest.fn(),
  onAuthStateChanged: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockAuth: Auth;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock auth object
    mockAuth = {
      currentUser: null,
      name: 'test-auth',
      config: {},
      app: {} as any,
      languageCode: null,
      tenantId: null,
      settings: {} as any,
      onAuthStateChanged: jest.fn(),
      onIdTokenChanged: jest.fn(),
      beforeAuthStateChanged: jest.fn(),
      updateCurrentUser: jest.fn(),
      useDeviceLanguage: jest.fn(),
      signOut: jest.fn(),
    } as any;

    authService = new AuthService(mockAuth);

    // Mock GoogleAuthProvider
    (GoogleAuthProvider as jest.Mock).mockImplementation(() => ({
      setCustomParameters: jest.fn(),
    }));
  });

  describe('Constructor', () => {
    it('should create AuthService instance with auth', () => {
      expect(authService).toBeInstanceOf(AuthService);
    });

    it('should create AuthService instance with null auth', () => {
      const nullAuthService = new AuthService(null);
      expect(nullAuthService).toBeInstanceOf(AuthService);
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser: Partial<User> = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      const mockCredential: Partial<UserCredential> = {
        user: mockUser as User,
      };

      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue(mockCredential);

      const result = await authService.login('test@example.com', 'password123');

      expect(result).toEqual(mockCredential);
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        'test@example.com',
        'password123'
      );
    });

    it('should throw error when Firebase is not configured', async () => {
      const nullAuthService = new AuthService(null);

      await expect(
        nullAuthService.login('test@example.com', 'password123')
      ).rejects.toThrow('Firebase is not configured. Please set up Firebase authentication.');
    });

    it('should handle invalid-credential error', async () => {
      const error = { code: 'auth/invalid-credential' };
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      await expect(
        authService.login('wrong@example.com', 'wrongpass')
      ).rejects.toThrow('Invalid email or password.');
    });

    it('should handle user-not-found error', async () => {
      const error = { code: 'auth/user-not-found' };
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      await expect(
        authService.login('notfound@example.com', 'password123')
      ).rejects.toThrow('No account found with this email.');
    });

    it('should handle wrong-password error', async () => {
      const error = { code: 'auth/wrong-password' };
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      await expect(
        authService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Incorrect password. Please try again.');
    });

    it('should handle network-request-failed error', async () => {
      const error = { code: 'auth/network-request-failed' };
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      await expect(
        authService.login('test@example.com', 'password123')
      ).rejects.toThrow('Network error. Please check your connection.');
    });

    it('should handle too-many-requests error', async () => {
      const error = { code: 'auth/too-many-requests' };
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      await expect(
        authService.login('test@example.com', 'password123')
      ).rejects.toThrow('Too many failed attempts. Please try again later.');
    });

    it('should handle unknown error with default message', async () => {
      const error = { code: 'auth/unknown-error' };
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      await expect(
        authService.login('test@example.com', 'password123')
      ).rejects.toThrow('An error occurred. Please try again.');
    });
  });

  describe('signup', () => {
    it('should successfully create new user account', async () => {
      const mockUser: Partial<User> = {
        uid: 'new-uid-456',
        email: 'newuser@example.com',
        displayName: null,
      };

      const mockCredential: Partial<UserCredential> = {
        user: mockUser as User,
      };

      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockCredential);

      const result = await authService.signup('newuser@example.com', 'password123');

      expect(result).toEqual(mockCredential);
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        'newuser@example.com',
        'password123'
      );
    });

    it('should throw error when Firebase is not configured', async () => {
      const nullAuthService = new AuthService(null);

      await expect(
        nullAuthService.signup('test@example.com', 'password123')
      ).rejects.toThrow('Firebase is not configured. Please set up Firebase authentication.');
    });

    it('should handle email-already-in-use error', async () => {
      const error = { code: 'auth/email-already-in-use' };
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      await expect(
        authService.signup('existing@example.com', 'password123')
      ).rejects.toThrow('This email is already registered. Please login instead.');
    });

    it('should handle weak-password error', async () => {
      const error = { code: 'auth/weak-password' };
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      await expect(
        authService.signup('test@example.com', '123')
      ).rejects.toThrow('Password is too weak. Use at least 6 characters.');
    });

    it('should handle invalid-email error', async () => {
      const error = { code: 'auth/invalid-email' };
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      await expect(
        authService.signup('invalid-email', 'password123')
      ).rejects.toThrow('Invalid email address format.');
    });

    it('should handle operation-not-allowed error', async () => {
      const error = { code: 'auth/operation-not-allowed' };
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      await expect(
        authService.signup('test@example.com', 'password123')
      ).rejects.toThrow('Email/password accounts are not enabled. Please contact support.');
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      (signOut as jest.Mock).mockResolvedValue(undefined);

      await authService.logout();

      expect(signOut).toHaveBeenCalledWith(mockAuth);
    });

    it('should throw error when Firebase is not configured', async () => {
      const nullAuthService = new AuthService(null);

      await expect(nullAuthService.logout()).rejects.toThrow(
        'Firebase is not configured. Please set up Firebase authentication.'
      );
    });

    it('should handle logout errors', async () => {
      const error = { code: 'auth/network-request-failed' };
      (signOut as jest.Mock).mockRejectedValue(error);

      await expect(authService.logout()).rejects.toThrow(
        'Network error. Please check your connection.'
      );
    });
  });

  describe('loginWithGoogle', () => {
    it('should successfully login with Google', async () => {
      const mockUser: Partial<User> = {
        uid: 'google-uid-789',
        email: 'google@example.com',
        displayName: 'Google User',
      };

      const mockCredential: Partial<UserCredential> = {
        user: mockUser as User,
      };

      (signInWithPopup as jest.Mock).mockResolvedValue(mockCredential);

      const result = await authService.loginWithGoogle();

      expect(result).toEqual(mockCredential);
      expect(GoogleAuthProvider).toHaveBeenCalled();
      expect(signInWithPopup).toHaveBeenCalledWith(mockAuth, expect.any(Object));
    });

    it('should throw error when Firebase is not configured', async () => {
      const nullAuthService = new AuthService(null);

      await expect(nullAuthService.loginWithGoogle()).rejects.toThrow(
        'Firebase is not configured. Please set up Firebase authentication.'
      );
    });

    it('should handle popup-closed-by-user error', async () => {
      const error = { code: 'auth/popup-closed-by-user' };
      (signInWithPopup as jest.Mock).mockRejectedValue(error);

      await expect(authService.loginWithGoogle()).rejects.toThrow(
        'Sign-in popup was closed before completing.'
      );
    });

    it('should handle popup-blocked error', async () => {
      const error = { code: 'auth/popup-blocked' };
      (signInWithPopup as jest.Mock).mockRejectedValue(error);

      await expect(authService.loginWithGoogle()).rejects.toThrow(
        'Sign-in popup was blocked by the browser.'
      );
    });

    it('should handle cancelled-popup-request error', async () => {
      const error = { code: 'auth/cancelled-popup-request' };
      (signInWithPopup as jest.Mock).mockRejectedValue(error);

      await expect(authService.loginWithGoogle()).rejects.toThrow(
        'Only one popup request is allowed at a time.'
      );
    });

    it('should set custom parameters for Google provider', async () => {
      const mockProvider = {
        setCustomParameters: jest.fn(),
      };

      (GoogleAuthProvider as jest.Mock).mockReturnValue(mockProvider);
      (signInWithPopup as jest.Mock).mockResolvedValue({
        user: {} as User,
      });

      await authService.loginWithGoogle();

      expect(mockProvider.setCustomParameters).toHaveBeenCalledWith({
        prompt: 'select_account',
      });
    });
  });

  describe('onAuthStateChanged', () => {
    it('should subscribe to auth state changes', () => {
      const callback = jest.fn();
      const unsubscribe = jest.fn();

      (onAuthStateChanged as jest.Mock).mockReturnValue(unsubscribe);

      const result = authService.onAuthStateChanged(callback);

      expect(onAuthStateChanged).toHaveBeenCalledWith(mockAuth, callback, undefined);
      expect(result).toBe(unsubscribe);
    });

    it('should subscribe with error callback', () => {
      const callback = jest.fn();
      const errorCallback = jest.fn();
      const unsubscribe = jest.fn();

      (onAuthStateChanged as jest.Mock).mockReturnValue(unsubscribe);

      const result = authService.onAuthStateChanged(callback, errorCallback);

      expect(onAuthStateChanged).toHaveBeenCalledWith(mockAuth, callback, errorCallback);
      expect(result).toBe(unsubscribe);
    });

    it('should handle null auth gracefully', () => {
      const nullAuthService = new AuthService(null);
      const callback = jest.fn();

      const unsubscribe = nullAuthService.onAuthStateChanged(callback);

      // Should call callback with null immediately
      expect(callback).toHaveBeenCalledWith(null);

      // Should return no-op unsubscribe function
      expect(typeof unsubscribe).toBe('function');
      unsubscribe(); // Should not throw
    });

    it('should call callback when user logs in', () => {
      const mockUser: Partial<User> = {
        uid: 'test-uid',
        email: 'test@example.com',
      };

      const callback = jest.fn();

      (onAuthStateChanged as jest.Mock).mockImplementation(
        (auth, cb) => {
          cb(mockUser);
          return jest.fn();
        }
      );

      authService.onAuthStateChanged(callback);

      expect(callback).toHaveBeenCalledWith(mockUser);
    });

    it('should call callback when user logs out', () => {
      const callback = jest.fn();

      (onAuthStateChanged as jest.Mock).mockImplementation(
        (auth, cb) => {
          cb(null);
          return jest.fn();
        }
      );

      authService.onAuthStateChanged(callback);

      expect(callback).toHaveBeenCalledWith(null);
    });

    it('should call error callback on auth errors', () => {
      const callback = jest.fn();
      const errorCallback = jest.fn();
      const mockError = new Error('Auth error');

      (onAuthStateChanged as jest.Mock).mockImplementation(
        (auth, cb, errCb) => {
          errCb(mockError);
          return jest.fn();
        }
      );

      authService.onAuthStateChanged(callback, errorCallback);

      expect(errorCallback).toHaveBeenCalledWith(mockError);
    });
  });

  describe('Error Message Mapping', () => {
    it('should map user-disabled error', async () => {
      const error = { code: 'auth/user-disabled' };
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      await expect(
        authService.login('disabled@example.com', 'password')
      ).rejects.toThrow('This account has been disabled. Please contact support.');
    });

    it('should handle errors without code property', async () => {
      const error = new Error('Generic error');
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      await expect(
        authService.login('test@example.com', 'password')
      ).rejects.toThrow('An error occurred. Please try again.');
    });
  });
});
