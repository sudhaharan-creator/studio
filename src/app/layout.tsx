
'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AppProvider } from '@/context/app-context';
import { AuthProvider } from '@/context/auth-context';
import { AuthDialog } from '@/components/auth/auth-dialog';
import { SiteHeader } from '@/components/site-header';
import { ThemeManager } from '@/components/theme-manager';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <AppProvider>
            <ThemeManager />
            <AuthDialog />
            <div className="relative flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1 flex flex-col">{children}</main>
            </div>
          </AppProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
