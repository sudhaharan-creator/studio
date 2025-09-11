
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TimetableSkeleton } from '@/components/timetable-skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, User as UserIcon, Settings, BookOpen, Palette, CheckIcon, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const colorPalettes = [
  {
    name: 'Default Light',
    primary: '180 100% 25.1%',
    background: '0 0% 94.1%',
    accent: '200 53% 79%',
  },
  {
    name: 'Default Dark',
    primary: '180 80% 60%',
    background: '224 71% 4%',
    accent: '200 60% 50%',
  },
  {
    name: 'Forest',
    primary: '140 60% 40%',
    background: '30 20% 95%',
    accent: '140 50% 70%',
  },
  {
    name: 'Ocean',
    primary: '210 90% 50%',
    background: '220 30% 96%',
    accent: '190 70% 80%',
  },
  {
    name: 'Sunset',
    primary: '25 90% 55%',
    background: '340 20% 10%',
    accent: '0 80% 70%',
  },
  {
    name: 'Plum',
    primary: '270 70% 50%',
    background: '270 10% 97%',
    accent: '270 50% 80%',
  },
];


export default function ProfilePage() {
  const { user, loading: authLoading, setUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [userCourses, setUserCourses] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [themeColors, setThemeColors] = useState({
    primary: '',
    background: '',
    accent: '',
  });
  const [isSubmittingTheme, setIsSubmittingTheme] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setDisplayName(user.displayName || user.email?.split('@')[0] || 'User');
    const docRef = doc(db, 'userPreferences', user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      setUserCourses(data.courses || []);
      setThemeColors({
        primary: data.theme?.primary || '',
        background: data.theme?.background || '',
        accent: data.theme?.accent || '',
      });
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
        return;
      }
      fetchPreferences();
    }
  }, [authLoading, user, router, fetchPreferences]);

  const handleUpdateProfile = async () => {
    if (!user || !auth.currentUser) return;
    setIsSubmitting(true);
    try {
      await updateProfile(auth.currentUser, { displayName });
      // Update user in context
      setUser({ ...user, displayName });
      toast({ title: 'Success', description: 'Your profile name has been updated.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile name.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({
        title: 'Password Reset Email Sent',
        description: 'Check your inbox for a link to reset your password.',
      });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send password reset email.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleThemeSelect = (palette: typeof colorPalettes[0]) => {
    setThemeColors({
      primary: palette.primary,
      background: palette.background,
      accent: palette.accent,
    });
  };

  const handleSaveTheme = async () => {
    if (!user) return;
    setIsSubmittingTheme(true);
    try {
      const docRef = doc(db, 'userPreferences', user.uid);
      await setDoc(docRef, { theme: themeColors }, { merge: true });
      toast({ title: 'Success', description: 'Theme preferences saved!' });
      // Optionally force a reload to see theme changes immediately
      window.location.reload();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save theme.' });
    } finally {
      setIsSubmittingTheme(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground font-body">
        <main className="container mx-auto p-4 sm:p-6 md:p-8">
          <TimetableSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <main className="container mx-auto p-4 sm:p-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-3xl">My Profile</CardTitle>
            <CardDescription>Manage your settings, courses, and personal information.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="settings" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="settings"><Settings className="mr-2"/> Settings</TabsTrigger>
                <TabsTrigger value="my-courses"><BookOpen className="mr-2"/> My Courses</TabsTrigger>
                <TabsTrigger value="preferences"><Palette className="mr-2"/> Preferences</TabsTrigger>
              </TabsList>
              <TabsContent value="settings" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Settings</CardTitle>
                    <CardDescription>Manage your account details.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                         <Label htmlFor="displayName">Profile Name</Label>
                         <Input
                          id="displayName"
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                      <Button onClick={handleUpdateProfile} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <> <UserIcon className="mr-2"/> Update Profile</>}
                      </Button>
                    </div>
                    <div className="space-y-4 pt-4 border-t">
                       <div className="space-y-2">
                         <Label>Password</Label>
                         <CardDescription>
                           Click the button below to receive an email to reset your password.
                         </CardDescription>
                       </div>
                       <Button variant="outline" onClick={handlePasswordReset} disabled={isSubmitting}>
                         {isSubmitting ? <Loader2 className="animate-spin" /> : <><KeyRound className="mr-2"/> Send Password Reset Email</>}
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="my-courses" className="mt-6">
                 <Card>
                  <CardHeader>
                    <CardTitle>My Courses</CardTitle>
                    <CardDescription>Here are the courses you have selected.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {userCourses.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {userCourses.map(course => (
                          <Badge key={course} variant="secondary">{course}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">You have not selected any courses yet.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="preferences" className="mt-6">
                 <Card>
                  <CardHeader>
                    <CardTitle>Theme Preferences</CardTitle>
                    <CardDescription>Customize the look and feel of the application. Select a palette and save.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {colorPalettes.map((palette) => {
                        const isActive =
                          themeColors.primary === palette.primary &&
                          themeColors.background === palette.background &&
                          themeColors.accent === palette.accent;
                        
                        return (
                          <div key={palette.name} onClick={() => handleThemeSelect(palette)} className="cursor-pointer">
                            <div
                              className={cn(
                                "rounded-lg border-2 p-2 transition-all",
                                isActive ? "border-primary" : "border-transparent hover:border-muted-foreground"
                              )}
                            >
                              <div className="space-y-1 rounded-md p-2" style={{ backgroundColor: `hsl(${palette.background})`}}>
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-semibold" style={{ color: `hsl(${palette.primary})`}}>{palette.name}</p>
                                  {isActive && <CheckIcon className="h-4 w-4" style={{ color: `hsl(${palette.primary})`}} />}
                                </div>
                                <div className="flex items-center space-x-1">
                                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: `hsl(${palette.primary})` }} />
                                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: `hsl(${palette.accent})` }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <Button onClick={handleSaveTheme} disabled={isSubmittingTheme}>
                      {isSubmittingTheme ? <Loader2 className="animate-spin" /> : 'Save Theme'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
