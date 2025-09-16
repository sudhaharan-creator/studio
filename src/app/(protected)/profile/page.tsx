
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { db, auth, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { updateProfile, sendPasswordResetEmail, deleteUser as deleteFirebaseUser } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TimetableSkeleton } from '@/components/timetable-skeleton';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, User as UserIcon, Settings, BookOpen, Palette, CheckIcon, KeyRound, XIcon, Trash2Icon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/app-context';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const { sheetData } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [userCourses, setUserCourses] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordResetting, setIsPasswordResetting] = useState(false);
  
  const [themeColors, setThemeColors] = useState({
    primary: '',
    background: '',
    accent: '',
  });
  const [isSubmittingTheme, setIsSubmittingTheme] = useState(false);
  
  const [isEditingCourses, setIsEditingCourses] = useState(false);
  const [tempSelectedCourses, setTempSelectedCourses] = useState<string[]>([]);
  const [uniqueCourses, setUniqueCourses] = useState<string[]>([]);

  useEffect(() => {
    if (sheetData) {
      const courses = new Set<string>();
      sheetData.slice(2).forEach(row => {
        row.slice(2).forEach(cell => {
          const fullCourseText = cell.value.trim();
          if (fullCourseText && !/^\(Lunch\)$/i.test(fullCourseText) && !/Registration/i.test(fullCourseText) && !/^\s*$/.test(fullCourseText)) {
            const match = fullCourseText.match(/^(.*?)\s*(\d*)$/);
            const courseName = match ? match[1].trim() : fullCourseText;
            if (courseName) {
              courses.add(courseName);
            }
          }
        });
      });
      setUniqueCourses(Array.from(courses).sort());
    }
  }, [sheetData]);


  const fetchPreferences = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setDisplayName(user.displayName || user.email?.split('@')[0] || 'User');
    const docRef = doc(db, 'userPreferences', user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const savedCourses = data.courses || [];
      setUserCourses(savedCourses);
      setTempSelectedCourses(savedCourses);
      setThemeColors({
        primary: data.theme?.primary || '',
        background: data.theme?.background || '',
        accent: data.theme?.accent || '',
      });
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
        fetchPreferences();
    }
  }, [authLoading, user, fetchPreferences]);

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
    setIsPasswordResetting(true);
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
      setIsPasswordResetting(false);
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
      window.location.reload();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save theme.' });
    } finally {
      setIsSubmittingTheme(false);
    }
  };

  const handleCourseSelection = (course: string, checked: boolean) => {
    setTempSelectedCourses(prev =>
      checked
        ? [...prev, course]
        : prev.filter(c => c !== course)
    );
  };
  
  const handleEditCourses = () => {
    setTempSelectedCourses(userCourses);
    setIsEditingCourses(true);
  };
  
  const handleCancelEdit = () => {
    setTempSelectedCourses(userCourses);
    setIsEditingCourses(false);
  };

  const handleSaveCourses = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const docRef = doc(db, 'userPreferences', user.uid);
      await setDoc(docRef, { courses: tempSelectedCourses }, { merge: true });
      setUserCourses(tempSelectedCourses);
      setIsEditingCourses(false);
      toast({ title: 'Success', description: 'Your course preferences have been updated.' });
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Failed to save courses.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !auth.currentUser) return;
    setIsSubmitting(true);
    try {
      // 1. Delete user preferences from Firestore
      const userPrefRef = doc(db, 'userPreferences', user.uid);
      await deleteDoc(userPrefRef);

      // 2. Delete the user from Firebase Auth
      await deleteFirebaseUser(auth.currentUser);

      toast({
        title: 'Account Deleted',
        description: 'Your account has been permanently deleted.',
      });
      
      // The onAuthStateChanged listener in auth-context will handle redirecting
      // but we can push to be faster
      router.push('/');

    } catch (error) {
       console.error('Error deleting account:', error);
       toast({
        variant: 'destructive',
        title: 'Error Deleting Account',
        description: 'An error occurred. You may need to sign in again to complete this action.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || authLoading) {
    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
          <TimetableSkeleton />
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">My Profile</CardTitle>
          <CardDescription>Manage your settings, courses, and personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
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
                     <Button variant="outline" onClick={handlePasswordReset} disabled={isPasswordResetting}>
                       {isPasswordResetting ? <Loader2 className="animate-spin" /> : <><KeyRound className="mr-2"/> Send Password Reset Email</>}
                     </Button>
                  </div>
                  <div className="space-y-4 pt-4 border-t border-destructive/50">
                     <div className="space-y-2">
                       <Label className="text-destructive">Danger Zone</Label>
                       <CardDescription>
                         Permanently delete your account and all associated data. This action is irreversible.
                       </CardDescription>
                     </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" disabled={isSubmitting}>
                            <Trash2Icon className="mr-2"/> Delete Account
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your account
                              and remove your data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteAccount} className={cn(buttonVariants({variant: "destructive"}))}>
                              {isSubmitting ? <Loader2 className="animate-spin" /> : "Yes, delete my account"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="my-courses" className="mt-6">
               <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle>My Courses</CardTitle>
                    <CardDescription>
                      {isEditingCourses 
                        ? 'Select your default courses to display on the timetable.'
                        : 'Here are your saved courses. Click Edit to make changes.'}
                    </CardDescription>
                  </div>
                   {!isEditingCourses && (
                    <Button variant="outline" onClick={handleEditCourses} className="w-full sm:w-auto">Edit Courses</Button>
                  )}
                </CardHeader>
                <CardContent>
                  {isEditingCourses ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {uniqueCourses.map(course => (
                          <div key={course} className="flex items-center space-x-2">
                            <Checkbox
                              id={`profile-${course}`}
                              checked={tempSelectedCourses.includes(course)}
                              onCheckedChange={(checked) => handleCourseSelection(course, !!checked)}
                            />
                            <Label htmlFor={`profile-${course}`} className="cursor-pointer">{course}</Label>
                          </div>
                        ))}
                      </div>
                      {tempSelectedCourses.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-4 border-t mt-4">
                          <span className="text-sm font-medium text-muted-foreground">Selected:</span>
                          {tempSelectedCourses.map(course => (
                            <Badge key={course} variant="secondary" className="flex items-center gap-2">
                              {course}
                              <button onClick={() => handleCourseSelection(course, false)} className="appearance-none border-none bg-transparent p-0">
                                <XIcon className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 pt-4 border-t mt-4">
                         <Button onClick={handleSaveCourses} disabled={isSubmitting}>
                          {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Courses'}
                         </Button>
                         <Button variant="ghost" onClick={handleCancelEdit} disabled={isSubmitting}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    userCourses.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {userCourses.map(course => (
                          <Badge key={course} variant="secondary">{course}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">You have not selected any courses yet. Click "Edit" to add your courses.</p>
                    )
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
    </div>
  );
}
