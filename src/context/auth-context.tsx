'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { TimetableSkeleton } from '@/components/timetable-skeleton';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthDialogOpen: boolean;
  setAuthDialogOpen: (isOpen: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    isAuthDialogOpen,
    setAuthDialogOpen,
  };

  if (loading) {
    return (
       <div className="min-h-screen bg-background text-foreground font-body">
        <main className="container mx-auto p-4 sm:p-6 md:p-8">
          <TimetableSkeleton />
        </main>
      </div>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
