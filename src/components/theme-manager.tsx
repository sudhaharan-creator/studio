
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export function ThemeManager() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const applyTheme = (theme: any) => {
      const root = document.documentElement;
      if (theme.primary) root.style.setProperty('--primary', theme.primary);
      if (theme.background) root.style.setProperty('--background', theme.background);
      if (theme.accent) root.style.setProperty('--accent', theme.accent);
    };

    const resetTheme = () => {
        const root = document.documentElement;
        root.style.removeProperty('--primary');
        root.style.removeProperty('--background');
        root.style.removeProperty('--accent');
    }

    const fetchAndApplyTheme = async () => {
      if (user) {
        const docRef = doc(db, 'userPreferences', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().theme) {
          applyTheme(docSnap.data().theme);
        } else {
            resetTheme();
        }
      } else {
        resetTheme();
      }
    };

    fetchAndApplyTheme();
  }, [user, loading]);

  return null;
}
