'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { preferencesService } from '@/lib/firestore';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Load theme from Firestore or localStorage on mount
  useEffect(() => {
    const loadTheme = async () => {
      if (user) {
        try {
          const prefs = await preferencesService.get(user.uid);
          const savedTheme = (prefs as any)?.theme || 'light';
          setTheme(savedTheme);
          document.documentElement.setAttribute('data-theme', savedTheme);
        } catch (error) {
          console.error('Failed to load theme from Firestore:', error);
          // Fallback to localStorage
          const localTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
          setTheme(localTheme);
          document.documentElement.setAttribute('data-theme', localTheme);
        }
      } else {
        // Not authenticated, use localStorage
        const localTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
        setTheme(localTheme);
        document.documentElement.setAttribute('data-theme', localTheme);
      }
      setMounted(true);
    };

    loadTheme();
  }, [user]);

  // Toggle theme and save to Firestore/localStorage
  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Save to Firestore if user is authenticated
    if (user) {
      try {
        const existingPrefs = await preferencesService.get(user.uid);
        await preferencesService.save(user.uid, {
          ...existingPrefs,
          theme: newTheme,
        } as any);
      } catch (error) {
        console.error('Failed to save theme to Firestore:', error);
      }
    }
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}

export { ThemeProvider as default };
