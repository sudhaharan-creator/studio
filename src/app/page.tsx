'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SheetIcon, GitBranchIcon, KeyRound } from 'lucide-react';
import { TimetableDisplay } from '@/components/timetable-display';
import { TimetableSkeleton } from '@/components/timetable-skeleton';
import { mockTimetableData } from '@/lib/mock-data';
import type { SheetData } from '@/lib/types';
import { getSheetData, GetSheetDataOutput } from '@/ai/flows/get-sheet-data';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();

  const fetchData = async (key?: string) => {
    setIsLoading(true);
    setSheetData(null);
    try {
      const result: GetSheetDataOutput = await getSheetData({
        sheetUrl: sheetUrl,
        apiKey: key,
      });
      if (result.sheetData) {
        setSheetData(result.sheetData);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No data found in the sheet. Showing mock data instead.',
        });
        setSheetData(mockTimetableData);
      }
    } catch (err: any) {
      if (err.message.includes('Google API Key not found')) {
        setShowApiKeyDialog(true);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to fetch sheet data. Using mock data instead. Error: ${err.message}`,
        });
        setSheetData(mockTimetableData);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl.trim().startsWith('https://docs.google.com/spreadsheets/d/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid URL',
        description: 'Please enter a valid Google Sheet URL.',
      });
      setSheetData(null);
      return;
    }
    fetchData();
  };

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
       toast({
        variant: 'destructive',
        title: 'API Key Required',
        description: 'Please enter your Google API Key.',
      });
      return;
    }
    setShowApiKeyDialog(false);
    await fetchData(apiKey);
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
          </CardContent>
        </Card>

        <div className="transition-opacity duration-500">
          {isLoading && <TimetableSkeleton />}
          {sheetData && <TimetableDisplay data={sheetData} />}
        </div>
        
        <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter Google API Key</DialogTitle>
              <DialogDescription>
                To fetch data from your Google Sheet, you need to provide an API key. 
                You can get one from the Google Cloud Console.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleApiKeySubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="api-key" className="text-right">
                    API Key
                  </Label>
                  <Input
                    id="api-key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="col-span-3"
                    placeholder="Enter your Google API Key"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setShowApiKeyDialog(false)}>Cancel</Button>
                <Button type="submit">Submit</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}
