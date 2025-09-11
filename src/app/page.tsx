'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SheetIcon, GitBranchIcon, XIcon } from 'lucide-react';
import { TimetableDisplay } from '@/components/timetable-display';
import { TimetableSkeleton } from '@/components/timetable-skeleton';
import type { SheetData } from '@/lib/types';
import { getSheetData, GetSheetDataOutput } from '@/ai/flows/get-sheet-data';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function Home() {
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const { toast } = useToast();
  const [uniqueCourses, setUniqueCourses] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [tempApiKey, setTempApiKey] = useState('');

  useEffect(() => {
    const storedApiKey = localStorage.getItem('googleApiKey');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);
  
  useEffect(() => {
    if (sheetData) {
      const courses = new Set<string>();
      sheetData.slice(2).forEach(row => {
        row.forEach(cell => {
          const courseName = cell.value.replace(/\s*\d+\s*$/, '').trim();
          if (courseName && !/^\(Lunch\)$/i.test(courseName) && !/Registration/i.test(courseName) && isNaN(parseInt(courseName))) {
            courses.add(courseName);
          }
        });
      });
      setUniqueCourses(Array.from(courses).sort());
    }
  }, [sheetData]);

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
    await fetchData();
  };

  const fetchData = async () => {
    setIsLoading(true);
    setSheetData(null);
    setSelectedCourses([]);
  
    let currentApiKey = apiKey;
    if (!currentApiKey) {
      const storedApiKey = localStorage.getItem('googleApiKey');
      if (storedApiKey) {
        setApiKey(storedApiKey);
        currentApiKey = storedApiKey;
      }
    }
    
    if (!currentApiKey && process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
       currentApiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
       setApiKey(currentApiKey);
    }

    if (!currentApiKey) {
        setIsApiModalOpen(true);
        setIsLoading(false);
        return;
    }
  
    try {
      const result: GetSheetDataOutput = await getSheetData({
        sheetUrl: sheetUrl,
        apiKey: currentApiKey as string,
      });
      if (result.sheetData) {
        setSheetData(result.sheetData);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No data found in the sheet.',
        });
        setSheetData(null);
      }
    } catch (err: any) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Error Fetching Data',
        description: err.message || 'An unexpected error occurred.',
      });
      setSheetData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiKeySubmit = () => {
    if (tempApiKey) {
      setApiKey(tempApiKey);
      localStorage.setItem('googleApiKey', tempApiKey);
      setIsApiModalOpen(false);
      fetchData();
    }
  };

  const handleCourseSelection = (course: string) => {
    setSelectedCourses(prev =>
      prev.includes(course)
        ? prev.filter(c => c !== course)
        : [...prev, course]
    );
  };
  
  const clearSelection = () => {
    setSelectedCourses([]);
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

        {sheetData && (
          <Card className="mb-8 shadow-lg border-none">
            <CardHeader>
              <CardTitle className="font-headline">Filter Courses</CardTitle>
              <CardDescription>Select one or more courses to highlight them in the timetable.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
               <div className="flex items-center gap-4">
                <Select onValueChange={handleCourseSelection}>
                  <SelectTrigger className="w-full sm:w-[280px]">
                    <SelectValue placeholder="Select a course to filter..." />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueCourses.map(course => (
                      <SelectItem key={course} value={course} disabled={selectedCourses.includes(course)}>
                        {course}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 {selectedCourses.length > 0 && (
                   <Button variant="ghost" onClick={clearSelection} className="text-sm">Clear Selection</Button>
                 )}
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedCourses.map(course => (
                  <Badge key={course} variant="secondary" className="flex items-center gap-2">
                    {course}
                    <button onClick={() => handleCourseSelection(course)} className="appearance-none border-none bg-transparent p-0">
                      <XIcon className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="transition-opacity duration-500">
          {isLoading && <TimetableSkeleton />}
          {sheetData && <TimetableDisplay data={sheetData} highlightedCourses={selectedCourses} />}
        </div>
        
        <Dialog open={isApiModalOpen} onOpenChange={setIsApiModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Google API Key Required</DialogTitle>
              <DialogDescription>
                Please provide your Google API key to fetch data from Google Sheets. You can get one from the Google Cloud Console.
              </DialogDescription>
            </DialogHeader>
            <Input
              type="text"
              placeholder="Enter your API key"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
            />
            <DialogFooter>
              <Button onClick={handleApiKeySubmit}>Submit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
