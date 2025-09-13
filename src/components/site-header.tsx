
'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebase';
import { SheetIcon, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function SiteHeader() {
  const { user, unverifiedUser, setAuthDialogOpen } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();
  
  const loggedInUser = user || unverifiedUser;

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
    router.refresh(); // Ensures a clean state on redirect
  };

  const renderDesktopNav = () => (
    <>
      <nav className="flex gap-6">
        <Link
          href="/view/timetable"
          className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Timetable
        </Link>
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
      <div className="flex flex-1 items-center justify-end space-x-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Welcome, {loggedInUser!.displayName || loggedInUser!.email}
          </span>
        </div>
        <Button variant="ghost" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </>
  );

  const renderMobileNav = () => (
    <div className="flex flex-1 items-center justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
            <span className="sr-only">Open user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {loggedInUser!.displayName || loggedInUser!.email}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/view/timetable">Timetable</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/attendance">Attendance</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile">My Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <SheetIcon className="h-6 w-6 text-primary" />
            <span className="inline-block font-bold">SheetSync</span>
          </Link>
        </div>

        {loggedInUser ? (
          isMobile ? renderMobileNav() : renderDesktopNav()
        ) : (
          <div className="flex flex-1 items-center justify-end">
            <Button variant="ghost" onClick={() => setAuthDialogOpen(true)}>
              Login
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
