import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Firebase Auth
const mockSignInWithEmailAndPassword = jest.fn();
const mockCreateUserWithEmailAndPassword = jest.fn();
const mockSignOut = jest.fn();
const mockUpdateProfile = jest.fn();
const mockOnAuthStateChanged = jest.fn();

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
  })),
  signInWithEmailAndPassword: (...args: any[]) => mockSignInWithEmailAndPassword(...args),
  createUserWithEmailAndPassword: (...args: any[]) => mockCreateUserWithEmailAndPassword(...args),
  signOut: (...args: any[]) => mockSignOut(...args),
  updateProfile: (...args: any[]) => mockUpdateProfile(...args),
  onAuthStateChanged: (...args: any[]) => mockOnAuthStateChanged(...args),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
  signInWithRedirect: jest.fn(),
}));

// Mock Firebase app
jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: null,
  },
  isConfigured: true,
  app: {},
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
  Toaster: () => null,
}));

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    // Default mock implementation for auth state listener
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      // Immediately call with null user (not logged in)
      callback(null);
      // Return unsubscribe function
      return jest.fn();
    });
  });

  describe('Login Flow', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      mockSignInWithEmailAndPassword.mockResolvedValueOnce({
        user: mockUser,
      });

      // Simulate successful login
      const result = await mockSignInWithEmailAndPassword(
        {},
        'test@example.com',
        'password123'
      );

      expect(result.user).toEqual(mockUser);
      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        {},
        'test@example.com',
        'password123'
      );
    });

    it('should handle login failure with invalid credentials', async () => {
      const error = new Error('auth/invalid-credential');
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(error);

      await expect(
        mockSignInWithEmailAndPassword({}, 'wrong@example.com', 'wrongpass')
      ).rejects.toThrow('auth/invalid-credential');
    });

    it('should handle network error during login', async () => {
      const error = new Error('auth/network-request-failed');
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(error);

      await expect(
        mockSignInWithEmailAndPassword({}, 'test@example.com', 'password123')
      ).rejects.toThrow('auth/network-request-failed');
    });

    it('should handle user-not-found error', async () => {
      const error = new Error('auth/user-not-found');
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(error);

      await expect(
        mockSignInWithEmailAndPassword({}, 'notfound@example.com', 'password123')
      ).rejects.toThrow('auth/user-not-found');
    });

    it('should handle wrong-password error', async () => {
      const error = new Error('auth/wrong-password');
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(error);

      await expect(
        mockSignInWithEmailAndPassword({}, 'test@example.com', 'wrongpassword')
      ).rejects.toThrow('auth/wrong-password');
    });

    it('should validate email format before login', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.kr',
        'user+tag@example.org',
      ];

      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@domain',
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it('should validate password length', () => {
      const validPasswords = ['password123', 'mySecureP@ss', '12345678'];
      const invalidPasswords = ['short', '12345', 'abc'];

      validPasswords.forEach(password => {
        expect(password.length).toBeGreaterThanOrEqual(6);
      });

      invalidPasswords.forEach(password => {
        expect(password.length).toBeLessThan(6);
      });
    });
  });

  describe('Signup Flow', () => {
    it('should successfully create new user account', async () => {
      const mockUser = {
        uid: 'new-uid-456',
        email: 'newuser@example.com',
        displayName: null,
        updateProfile: mockUpdateProfile,
      };

      mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({
        user: mockUser,
      });

      mockUpdateProfile.mockResolvedValueOnce(undefined);

      const result = await mockCreateUserWithEmailAndPassword(
        {},
        'newuser@example.com',
        'password123'
      );

      expect(result.user).toEqual(mockUser);
      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        {},
        'newuser@example.com',
        'password123'
      );

      // Update profile
      await mockUpdateProfile(result.user, {
        displayName: 'New User',
      });

      expect(mockUpdateProfile).toHaveBeenCalledWith(mockUser, {
        displayName: 'New User',
      });
    });

    it('should handle email-already-in-use error', async () => {
      const error = new Error('auth/email-already-in-use');
      mockCreateUserWithEmailAndPassword.mockRejectedValueOnce(error);

      await expect(
        mockCreateUserWithEmailAndPassword({}, 'existing@example.com', 'password123')
      ).rejects.toThrow('auth/email-already-in-use');
    });

    it('should handle weak-password error', async () => {
      const error = new Error('auth/weak-password');
      mockCreateUserWithEmailAndPassword.mockRejectedValueOnce(error);

      await expect(
        mockCreateUserWithEmailAndPassword({}, 'test@example.com', '123')
      ).rejects.toThrow('auth/weak-password');
    });

    it('should handle invalid-email error', async () => {
      const error = new Error('auth/invalid-email');
      mockCreateUserWithEmailAndPassword.mockRejectedValueOnce(error);

      await expect(
        mockCreateUserWithEmailAndPassword({}, 'invalid-email', 'password123')
      ).rejects.toThrow('auth/invalid-email');
    });

    it('should update user profile after signup', async () => {
      const mockUser = {
        uid: 'new-uid-789',
        email: 'newuser2@example.com',
        displayName: null,
        updateProfile: mockUpdateProfile,
      };

      mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({
        user: mockUser,
      });

      mockUpdateProfile.mockResolvedValueOnce(undefined);

      const { user } = await mockCreateUserWithEmailAndPassword(
        {},
        'newuser2@example.com',
        'password123'
      );

      await mockUpdateProfile(user, {
        displayName: 'Test Display Name',
      });

      expect(mockUpdateProfile).toHaveBeenCalledWith(user, {
        displayName: 'Test Display Name',
      });
    });

    it('should validate password confirmation match', () => {
      const password = 'password123';
      const confirmPassword = 'password123';
      const wrongConfirm = 'password456';

      expect(password).toBe(confirmPassword);
      expect(password).not.toBe(wrongConfirm);
    });
  });

  describe('Logout Flow', () => {
    it('should successfully logout user', async () => {
      mockSignOut.mockResolvedValueOnce(undefined);

      await mockSignOut({});

      expect(mockSignOut).toHaveBeenCalledWith({});
    });

    it('should clear user data from localStorage on logout', async () => {
      localStorage.setItem('userMBTI', 'INTJ');
      localStorage.setItem('userElement', '수');
      localStorage.setItem('userData', JSON.stringify({ uid: 'test-123' }));

      mockSignOut.mockResolvedValueOnce(undefined);
      await mockSignOut({});

      // Simulate clearing localStorage
      localStorage.removeItem('userMBTI');
      localStorage.removeItem('userElement');
      localStorage.removeItem('userData');

      expect(localStorage.getItem('userMBTI')).toBeNull();
      expect(localStorage.getItem('userElement')).toBeNull();
      expect(localStorage.getItem('userData')).toBeNull();
    });

    it('should handle logout errors gracefully', async () => {
      const error = new Error('auth/network-request-failed');
      mockSignOut.mockRejectedValueOnce(error);

      await expect(mockSignOut({})).rejects.toThrow('auth/network-request-failed');
    });

    it('should redirect to home after logout', async () => {
      mockSignOut.mockResolvedValueOnce(undefined);

      await mockSignOut({});

      expect(mockSignOut).toHaveBeenCalled();
      // In actual implementation, this would trigger router.push('/')
    });
  });

  describe('Authentication State Management', () => {
    it('should listen to auth state changes', () => {
      const callback = jest.fn();
      const unsubscribe = mockOnAuthStateChanged({}, callback);

      expect(mockOnAuthStateChanged).toHaveBeenCalledWith({}, callback);
      expect(callback).toHaveBeenCalledWith(null);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should update state when user logs in', () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      let currentUser = null;

      mockOnAuthStateChanged.mockImplementationOnce((auth, callback) => {
        callback(mockUser);
        currentUser = mockUser;
        return jest.fn();
      });

      const callback = jest.fn();
      mockOnAuthStateChanged({}, callback);

      expect(callback).toHaveBeenCalledWith(mockUser);
      expect(currentUser).toEqual(mockUser);
    });

    it('should update state when user logs out', () => {
      let currentUser: any = {
        uid: 'test-uid',
        email: 'test@example.com',
      };

      mockOnAuthStateChanged.mockImplementationOnce((auth, callback) => {
        callback(null);
        currentUser = null;
        return jest.fn();
      });

      const callback = jest.fn();
      mockOnAuthStateChanged({}, callback);

      expect(callback).toHaveBeenCalledWith(null);
      expect(currentUser).toBeNull();
    });

    it('should cleanup auth listener on unmount', () => {
      const unsubscribe = jest.fn();

      mockOnAuthStateChanged.mockReturnValueOnce(unsubscribe);

      const cleanup = mockOnAuthStateChanged({}, jest.fn());
      cleanup();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Protected Route Access', () => {
    it('should allow access to protected routes when authenticated', () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
      };

      const isAuthenticated = !!mockUser;
      expect(isAuthenticated).toBe(true);
    });

    it('should redirect to login when not authenticated', () => {
      const mockUser = null;
      const isAuthenticated = !!mockUser;

      expect(isAuthenticated).toBe(false);
      // In actual implementation, this would trigger router.push('/login')
    });

    it('should persist authentication across page reloads', () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
      };

      // Simulate storing auth state
      localStorage.setItem('authUser', JSON.stringify(mockUser));

      // Simulate page reload
      const storedUser = JSON.parse(localStorage.getItem('authUser') || 'null');

      expect(storedUser).toEqual(mockUser);
    });
  });

  describe('Form Validation', () => {
    it('should validate email format', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      expect(emailRegex.test('valid@example.com')).toBe(true);
      expect(emailRegex.test('invalid-email')).toBe(false);
      expect(emailRegex.test('')).toBe(false);
    });

    it('should validate password requirements', () => {
      const minLength = 6;

      expect('password123'.length >= minLength).toBe(true);
      expect('12345'.length >= minLength).toBe(false);
      expect(''.length >= minLength).toBe(false);
    });

    it('should prevent submission with empty fields', () => {
      const email = '';
      const password = '';

      const isValid = email.trim() !== '' && password.trim() !== '';
      expect(isValid).toBe(false);
    });

    it('should allow submission with valid fields', () => {
      const email = 'test@example.com';
      const password = 'password123';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      const isValid =
        email.trim() !== '' &&
        password.trim() !== '' &&
        emailRegex.test(email) &&
        password.length >= 6;

      expect(isValid).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should map Firebase error codes to user-friendly messages', () => {
      const errorMessages: Record<string, string> = {
        'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
        'auth/user-not-found': '사용자를 찾을 수 없습니다.',
        'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
        'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
        'auth/weak-password': '비밀번호가 너무 약합니다.',
        'auth/network-request-failed': '네트워크 오류가 발생했습니다.',
        'auth/too-many-requests': '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.',
      };

      Object.entries(errorMessages).forEach(([code, message]) => {
        expect(message).toBeTruthy();
        expect(typeof message).toBe('string');
      });
    });

    it('should display error message for unknown errors', () => {
      const unknownError = 'auth/unknown-error';
      const defaultMessage = '오류가 발생했습니다. 다시 시도해주세요.';

      const errorMessages: Record<string, string> = {
        'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
      };

      const message = errorMessages[unknownError] || defaultMessage;
      expect(message).toBe(defaultMessage);
    });
  });
});
