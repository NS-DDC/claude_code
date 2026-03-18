'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute Component
 *
 * Wraps pages that require authentication.
 * Redirects to /login if user is not authenticated.
 * Shows loading spinner while checking auth state.
 *
 * @example
 * ```tsx
 * <ProtectedRoute>
 *   <YourProtectedPage />
 * </ProtectedRoute>
 * ```
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if loading is complete and user is not authenticated
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-royal-gold mx-auto mb-4 animate-spin" />
          <p className="text-pastel-brown">로딩 중...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (redirect will happen)
  if (!user) {
    return null;
  }

  // Render children if user is authenticated
  return <>{children}</>;
}
