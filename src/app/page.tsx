
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranchIcon, Loader2 } from 'lucide-react';
import { getSheetData, GetSheetDataOutput } from '@/ai/flows/get-sheet-data';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-context';
import { useAuth } from '@/context/auth-context';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Home() {
  const [sheetUrl, setSheetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPrefs, setIsFetchingPrefs] = useState(true);
  const [isUrlLocked, setIsUrlLocked] = useState(false);
  const { toast } = useToast();
  const { setSheetData } = useAppContext();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchUserSheetUrl = async () => {
      if (user) {
        const docRef = doc(db, 'userPreferences', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().sheetUrl) {
          const savedUrl = docSnap.data().sheetUrl;
          setSheetUrl(savedUrl);
          setIsUrlLocked(true);
        } else {
          // This is a new user or a user without a saved URL.
          setSheetUrl('');
          setIsUrlLocked(false);
        }
      } else {
        // Not logged in, clear any previous user's state
        setSheetUrl('');
        setIsUrlLocked(false);
      }
      setIsFetchingPrefs(false); // This should be called in all paths
    };

    if (!authLoading) {
      setIsFetchingPrefs(true);
      fetchUserSheetUrl();
    }
  }, [user, authLoading]);

  const handleFetchData = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!sheetUrl.trim().startsWith('https://docs.google.com/spreadsheets/d/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid URL',
        description: 'Please enter a valid Google Sheet URL.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result: GetSheetDataOutput = await getSheetData({ sheetUrl });
      if (result.sheetData) {
        setSheetData(result.sheetData);

        if (user) {
          const docRef = doc(db, 'userPreferences', user.uid);
          // Only lock the URL if it's a new one being set, or if it already exists.
          await setDoc(docRef, { sheetUrl: sheetUrl }, { merge: true });
          setIsUrlLocked(true);
        }

        router.push('/view');
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No data found in the sheet.',
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Error Fetching Data',
        description: err.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUrl = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const docRef = doc(db, 'userPreferences', user.uid);
      await updateDoc(docRef, {
        sheetUrl: ''
      });
      setSheetUrl('');
      setIsUrlLocked(false);
      toast({
        title: 'Success',
        description: 'Your saved timetable URL has been removed.',
      });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not remove the timetable URL.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChangeUrl = () => {
    setIsUrlLocked(false);
  };


  if (authLoading || isFetchingPrefs) {
    return (
      <div className="min-h-screen bg-background text-foreground font-body flex items-center justify-center -mt-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-body flex items-center justify-center -mt-16">
      <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-2xl">
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="font-headline">
              {user && isUrlLocked ? 'Your Connected Timetable' : 'Connect your Google Sheet'}
            </CardTitle>
            <CardDescription>
              {user && isUrlLocked
                ? 'Sync your saved timetable or manage your sheet URL.'
                : 'Enter the URL of your Google Sheet to display the timetable.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex flex-col gap-4">
                <form onSubmit={handleFetchData} className="flex flex-col gap-4">
                  <div className="relative flex-grow w-full">
                    <GitBranchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                      className="pl-10"
                      aria-label="Google Sheet URL"
                      disabled={isLoading || (user && isUrlLocked)}
                    />
                  </div>
                  
                  {!(user && isUrlLocked) && (
                    <Button type="submit" disabled={isLoading || !sheetUrl.trim()} className="w-full sm:w-auto">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Syncing...
                            </>
                        ) : 'Sync Timetable'}
                    </Button>
                  )}
                </form>

              {user && isUrlLocked && (
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={handleFetchData} disabled={isLoading} className="w-full sm:w-auto">
                      {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Syncing...
                            </>
                        ) : 'Sync Timetable'}
                    </Button>
                    <Button variant="outline" onClick={handleChangeUrl} disabled={isLoading} className="w-full sm:w-auto">
                      Change URL
                    </Button>
                    <Button variant="destructive" onClick={handleRemoveUrl} disabled={isLoading} className="w-full sm:w-auto">
                      Remove
                    </Button>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
