'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { firestore } from '@/lib/firestore';
import Onboarding from './Onboarding';

export default function OnboardingWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, [user, pathname]);

  const checkOnboardingStatus = async () => {
    // Skip onboarding check if:
    // - Auth is still loading
    // - No user is logged in
    // - User is on login/signup pages
    // - Firebase is not configured
    if (authLoading || !user?.uid || !firestore) {
      setCheckingOnboarding(false);
      setShowOnboarding(false);
      return;
    }

    // Don't show onboarding on auth pages
    if (pathname === '/login' || pathname === '/signup') {
      setCheckingOnboarding(false);
      setShowOnboarding(false);
      return;
    }

    try {
      // Check if user has completed onboarding
      const profileRef = doc(firestore, 'users', user.uid, 'profile', 'default');
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const profileData = profileSnap.data();
        const onboardingCompleted = profileData?.onboardingCompleted || false;

        // Show onboarding only if not completed
        setShowOnboarding(!onboardingCompleted);
      } else {
        // No profile exists, show onboarding for new users
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      // On error, don't show onboarding to avoid blocking the app
      setShowOnboarding(false);
    } finally {
      setCheckingOnboarding(false);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    router.push('/');
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    router.push('/');
  };

  // Show loading state while checking
  if (checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-royal-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-pastel-brown">준비 중...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if needed
  if (showOnboarding) {
    return (
      <Onboarding
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    );
  }

  // Show normal app content
  return <>{children}</>;
}
