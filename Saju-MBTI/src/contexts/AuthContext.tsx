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
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  UserCredential,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': '이미 등록된 이메일입니다. 로그인해주세요.',
  'auth/invalid-email': '이메일 형식이 올바르지 않습니다.',
  'auth/operation-not-allowed': '이메일/비밀번호 로그인이 비활성화되어 있습니다.',
  'auth/weak-password': '비밀번호는 최소 6자 이상이어야 합니다.',
  'auth/user-disabled': '비활성화된 계정입니다. 고객센터에 문의해주세요.',
  'auth/user-not-found': '해당 이메일로 등록된 계정이 없습니다.',
  'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
  'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'auth/too-many-requests': '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.',
  'auth/network-request-failed': '네트워크 오류가 발생했습니다. 연결을 확인해주세요.',
  'auth/popup-closed-by-user': '로그인 팝업이 닫혔습니다.',
  'auth/cancelled-popup-request': '팝업 요청이 취소되었습니다.',
  'auth/popup-blocked': '팝업이 차단되었습니다. 브라우저 설정을 확인해주세요.',
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (email: string, password: string, displayName?: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<UserCredential>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!auth) {
      console.warn('Firebase not configured. Authentication disabled.');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser: User | null) => {
        setUser(currentUser);
        setLoading(false);
      },
      (error: Error) => {
        console.error('Auth state change error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<UserCredential> => {
    if (!auth) throw new Error('Firebase가 설정되지 않았습니다.');
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw new Error(AUTH_ERROR_MESSAGES[error.code] || '로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const signup = async (email: string, password: string, displayName?: string): Promise<UserCredential> => {
    if (!auth) throw new Error('Firebase가 설정되지 않았습니다.');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Set display name in Firebase Auth if provided
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }

      // Send email verification
      if (userCredential.user) {
        await sendEmailVerification(userCredential.user).catch((err) => {
          console.warn('Email verification could not be sent:', err);
        });
      }

      return userCredential;
    } catch (error: any) {
      throw new Error(AUTH_ERROR_MESSAGES[error.code] || '계정 생성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const logout = async (): Promise<void> => {
    if (!auth) throw new Error('Firebase가 설정되지 않았습니다.');
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(AUTH_ERROR_MESSAGES[error.code] || '로그아웃에 실패했습니다.');
    }
  };

  const loginWithGoogle = async (): Promise<UserCredential> => {
    if (!auth) throw new Error('Firebase가 설정되지 않았습니다.');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      return await signInWithPopup(auth, provider);
    } catch (error: any) {
      throw new Error(AUTH_ERROR_MESSAGES[error.code] || 'Google 로그인에 실패했습니다.');
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    if (!auth) throw new Error('Firebase가 설정되지 않았습니다.');
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(AUTH_ERROR_MESSAGES[error.code] || '비밀번호 재설정 이메일 전송에 실패했습니다.');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    loginWithGoogle,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
