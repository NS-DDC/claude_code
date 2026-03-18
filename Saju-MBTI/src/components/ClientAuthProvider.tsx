'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/components/ToastProvider';
import { ReactNode } from 'react';

/**
 * Client-side wrapper for AuthProvider
 * This allows the root layout to remain a server component while providing auth context
 */
export function ClientAuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider />
      {children}
    </AuthProvider>
  );
}
