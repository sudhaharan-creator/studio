
'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebase';
import { SheetIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function SiteHeader() {
  const { user, setAuthDialogOpen } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
    router.refresh(); // Ensures a clean state on redirect
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <SheetIcon className="h-6 w-6 text-primary" />
            <span className="inline-block font-bold">SheetSync</span>
          </Link>
          {user && (
            <nav className="flex gap-6">
              <Link
                href="/attendance"
                className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Attendance
              </Link>
              <Link
                href="/profile"
                className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                My Profile
              </Link>
            </nav>
          )}
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            {user ? (
              <Button variant="ghost" onClick={handleLogout}>
                Logout
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setAuthDialogOpen(true)}>
                Login
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
