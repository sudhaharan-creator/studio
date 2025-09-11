'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranchIcon } from 'lucide-react';
import { getSheetData, GetSheetDataOutput } from '@/ai/flows/get-sheet-data';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-context';

export default function Home() {
  const [sheetUrl, setSheetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { setSheetData } = useAppContext();
  const router = useRouter();

  const handleFetchData = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="min-h-screen bg-background text-foreground font-body flex items-center justify-center -mt-16">
      <main className="container mx-auto p-4 sm:p-6 md:p-8 max-w-2xl">
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="font-headline">Connect your Google Sheet</CardTitle>
            <CardDescription>
              Enter the URL of your Google Sheet to display the timetable.
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
      </main>
    </div>
  );
}
