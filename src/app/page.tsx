'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SheetIcon, GitBranchIcon, XIcon } from 'lucide-react';
import { TimetableDisplay } from '@/components/timetable-display';
import { TimetableSkeleton } from '@/components/timetable-skeleton';
import type { SheetData } from '@/lib/types';
import { getSheetData, GetSheetDataOutput } from '@/ai/flows/get-sheet-data';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
  const [filteredSheetData, setFilteredSheetData] = useState<SheetData | null>(null);
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
        row.slice(2).forEach(cell => {
          const courseName = cell.value.replace(/\s*\d+\s*$/, '').trim();
          if (courseName && !/^\(Lunch\)$/i.test(courseName) && !/Registration/i.test(courseName) && isNaN(parseInt(courseName))) {
            courses.add(courseName);
          }
        });
      });
      setUniqueCourses(Array.from(courses).sort());
    }
  }, [sheetData]);

  useEffect(() => {
    if (sheetData) {
      setFilteredSheetData(sheetData);
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
      setFilteredSheetData(null);
      return;
    }
    await fetchData();
  };

  const fetchData = async () => {
    setIsLoading(true);
    setSheetData(null);
    setFilteredSheetData(null);
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

  const handleCourseSelection = (course: string, checked: boolean) => {
    setSelectedCourses(prev =>
      checked
        ? [...prev, course]
        : prev.filter(c => c !== course)
    );
  };

  const handleFilterClick = () => {
    if (!sheetData) return;
    if (selectedCourses.length === 0) {
      setFilteredSheetData(sheetData);
      return;
    }

    const headerRows = sheetData.slice(0, 2);
    const bodyRows = sheetData.slice(2);

    const newFilteredData = bodyRows.map(row => {
      // Keep the first two cells (Day, Date and Classroom No.)
      const newRow = row.slice(0, 2);
      // Filter the rest of the cells
      row.slice(2).forEach(cell => {
        const courseName = cell.value.replace(/\s*\d+\s*$/, '').trim();
        if (selectedCourses.includes(courseName)) {
          newRow.push(cell);
        } else {
          // Push an empty cell to maintain table structure
          newRow.push({ value: '' });
        }
      });
      return newRow;
    });

    setFilteredSheetData([...headerRows, ...newFilteredData]);
  };
  
  const clearFilter = () => {
    if (sheetData) {
      setFilteredSheetData(sheetData);
    }
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
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="font-headline">Filter Courses</CardTitle>
                  <CardDescription>Select the courses you want to see and click filter.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {uniqueCourses.map(course => (
                  <div key={course} className="flex items-center space-x-2">
                    <Checkbox
                      id={course}
                      checked={selectedCourses.includes(course)}
                      onCheckedChange={(checked) => handleCourseSelection(course, !!checked)}
                    />
                    <Label htmlFor={course} className="cursor-pointer">{course}</Label>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button onClick={handleFilterClick} disabled={selectedCourses.length === 0}>Filter Timetable</Button>
                <Button onClick={clearFilter} variant="outline">Show All</Button>
              </div>
              
              {selectedCourses.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <span className="text-sm font-medium text-muted-foreground">Selected:</span>
                  {selectedCourses.map(course => (
                    <Badge key={course} variant="secondary" className="flex items-center gap-2">
                      {course}
                      <button onClick={() => handleCourseSelection(course, false)} className="appearance-none border-none bg-transparent p-0">
                        <XIcon className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="transition-opacity duration-500">
          {isLoading && <TimetableSkeleton />}
          {filteredSheetData && <TimetableDisplay data={filteredSheetData} />}
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
