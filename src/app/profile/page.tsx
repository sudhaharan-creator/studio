
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TimetableSkeleton } from '@/components/timetable-skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, User as UserIcon, Settings, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [sheetUrl, setSheetUrl] = useState('');
  const [savedSheetUrl, setSavedSheetUrl] = useState('');
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCourses, setUserCourses] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
        return;
      }
      
      const fetchPreferences = async () => {
        setIsLoading(true);
        const docRef = doc(db, 'userPreferences', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSheetUrl(data.sheetUrl || '');
          setSavedSheetUrl(data.sheetUrl || '');
          setUserCourses(data.courses || []);
        }
        setIsLoading(false);
      };
      
      fetchPreferences();
    }
  }, [authLoading, user, router]);

  const handleUpdateUrl = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const docRef = doc(db, 'userPreferences', user.uid);
      await setDoc(docRef, { sheetUrl: sheetUrl }, { merge: true });
      setSavedSheetUrl(sheetUrl);
      setIsEditingUrl(false);
      toast({ title: 'Success', description: 'Timetable URL updated.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update URL.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRemoveUrl = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const docRef = doc(db, 'userPreferences', user.uid);
      await updateDoc(docRef, { sheetUrl: '' });
      setSheetUrl('');
      setSavedSheetUrl('');
      setIsEditingUrl(false);
      toast({ title: 'Success', description: 'Timetable URL removed.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove URL.' });
    } finally {
      setIsSubmitting(false);
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
                <TabsTrigger value="persona"><UserIcon className="mr-2"/> User Persona</TabsTrigger>
              </TabsList>
              <TabsContent value="settings" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Timetable Settings</CardTitle>
                    <CardDescription>Manage your connected Google Sheet URL.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                       <label htmlFor="sheetUrl" className="text-sm font-medium">Google Sheet URL</label>
                       <Input
                        id="sheetUrl"
                        type="text"
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        value={sheetUrl}
                        onChange={(e) => setSheetUrl(e.target.value)}
                        disabled={!isEditingUrl && !!savedSheetUrl}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {isEditingUrl || !savedSheetUrl ? (
                         <>
                          <Button onClick={handleUpdateUrl} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save URL'}
                          </Button>
                          {savedSheetUrl && (
                            <Button variant="outline" onClick={() => { setIsEditingUrl(false); setSheetUrl(savedSheetUrl); }}>
                              Cancel
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button onClick={() => setIsEditingUrl(true)}>Change URL</Button>
                      )}
                      {savedSheetUrl && (
                         <Button variant="destructive" onClick={handleRemoveUrl} disabled={isSubmitting}>
                           {isSubmitting ? <Loader2 className="animate-spin" /> : 'Remove URL'}
                         </Button>
                      )}
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
              <TabsContent value="persona" className="mt-6">
                 <Card>
                  <CardHeader>
                    <CardTitle>User Persona</CardTitle>
                    <CardDescription>This feature is coming soon.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Define your persona to help us tailor your experience.</p>
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
