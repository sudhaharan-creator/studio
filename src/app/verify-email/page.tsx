
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MailCheckIcon } from 'lucide-react';

export default function VerifyEmailPage() {
  const { user, unverifiedUser, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is verified, send them to the main view
        router.replace('/view');
      } else if (!unverifiedUser && !currentUser) {
        // No one is logged in at all, send to home
        router.replace('/');
      }
    }
  }, [user, unverifiedUser, currentUser, loading, router]);
  
  const handleResendVerification = async () => {
    if (!currentUser) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You are not logged in.',
      });
      return;
    }
    
    setIsResending(true);
    try {
      await sendEmailVerification(currentUser);
      toast({
        title: 'Verification Email Sent',
        description: 'A new verification link has been sent to your email address.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Sending Email',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  if (loading || !unverifiedUser) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <main className="w-full max-w-lg">
        <Card className="shadow-lg border-none">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 text-primary rounded-full p-3 w-fit">
              <MailCheckIcon className="h-8 w-8" />
            </div>
            <CardTitle className="font-headline mt-4">Verify Your Email</CardTitle>
            <CardDescription>
              A verification link has been sent to{' '}
              <span className="font-semibold text-foreground">{unverifiedUser.email}</span>.
              Please check your inbox and click the link to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-center text-sm text-muted-foreground">
              Once your email is verified, you will be able to access the app. You may need to refresh this page after verifying.
            </p>
            <Button onClick={handleResendVerification} disabled={isResending}>
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : 'Resend Verification Email'}
            </Button>
            <Button variant="outline" onClick={handleLogout}>
                Log Out
            </Button>
             <Button variant="link" onClick={() => window.location.reload()}>
                I've verified, continue
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
