'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebase';
import { SheetIcon } from 'lucide-react';
import Link from 'next/link';

export function SiteHeader() {
  const { user, setAuthDialogOpen } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <SheetIcon className="h-6 w-6 text-primary" />
            <span className="inline-block font-bold">SheetSync</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            {user ? (
              <Button variant="ghost" onClick={() => auth.signOut()}>
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
