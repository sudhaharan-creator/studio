'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SheetIcon, GitBranchIcon, AlertCircle, KeyRound } from 'lucide-react';
import { TimetableDisplay } from '@/components/timetable-display';
import { TimetableSkeleton } from '@/components/timetable-skeleton';
import { mockTimetableData } from '@/lib/mock-data';
import type { SheetData } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getSheetData, GetSheetDataOutput } from '@/ai/flows/get-sheet-data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function Home() {
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const handleFetchData = async (e: React.FormEvent, key?: string) => {
    e.preventDefault();
    if (!sheetUrl.trim().startsWith('https://docs.google.com/spreadsheets/d/')) {
      setError('Please enter a valid Google Sheet URL.');
      setSheetData(null);
      return;
    }
    setError('');
    setIsLoading(true);
    setSheetData(null);
    setShowApiKeyDialog(false);

    try {
      const result: GetSheetDataOutput = await getSheetData({ 
        sheetUrl: sheetUrl,
        apiKey: key,
      });
      if (result.sheetData) {
        setSheetData(result.sheetData);
      } else {
        setError('No data found in the sheet. Showing mock data instead.');
        setSheetData(mockTimetableData);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === 'API_KEY_MISSING') {
        setError('Google API Key is required to fetch data.');
        setShowApiKeyDialog(true);
      } else {
        setError(`Failed to fetch sheet data. Using mock data instead. Error: ${err.message}`);
        setSheetData(mockTimetableData);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleApiKeySubmit = (e: React.FormEvent) => {
    handleFetchData(e, apiKey);
  };


  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <main className="container mx-auto p-4 sm:p-6 md:p-8">
        <header className="flex items-center gap-3 mb-8">
          <SheetIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold font-headline text-slate-800 dark:text-slate-200">SheetSync</h1>
        </header>

        <Card className="mb-8 shadow-lg border-none">
          <CardHeader>
            <CardTitle className="font-headline">Connect your Google Sheet</CardTitle>
            <CardDescription>
              Enter the URL of your Google Sheet to display the entire timetable.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFetchData} className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-grow w-full">
                <GitBranchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  className="pl-10"
                  aria-label="Google Sheet URL"
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? 'Syncing...' : 'Sync Timetable'}
              </Button>
            </form>
            {error && (
               <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
          </CardContent>
        </Card>

        <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Google API Key Required</DialogTitle>
                    <DialogDescription>
                        Please provide your Google API key to access the sheet data. You can get one from the Google Cloud Console.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleApiKeySubmit}>
                    <div className="relative flex-grow w-full">
                         <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Enter your Google API Key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="pl-10"
                            aria-label="Google API Key"
                        />
                    </div>
                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={() => setShowApiKeyDialog(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Syncing...' : 'Submit and Sync'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        <div className="transition-opacity duration-500">
          {isLoading && <TimetableSkeleton />}
          {sheetData && <TimetableDisplay data={sheetData} />}
        </div>
        
      </main>
    </div>
  );
}
