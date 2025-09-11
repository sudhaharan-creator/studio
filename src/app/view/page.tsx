
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SheetIcon, XIcon, ArrowLeftIcon } from 'lucide-react';
import { TimetableSkeleton } from '@/components/timetable-skeleton';
import type { SheetData } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/context/app-context';

export default function ViewPage() {
  const { sheetData, setSheetData, setFilteredSheetData } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  const [uniqueCourses, setUniqueCourses] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!sheetData) {
      router.push('/');
    } else {
      setIsLoading(false);
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
      // Initially, no filter is applied, so we can set the full data for viewing if needed
      setFilteredSheetData(sheetData);
    }
  }, [sheetData, router, setFilteredSheetData]);

  const handleCourseSelection = (course: string, checked: boolean) => {
    setSelectedCourses(prev =>
      checked
        ? [...prev, course]
        : prev.filter(c => c !== course)
    );
  };
  
  const handleViewTimetableClick = () => {
    if (!sheetData) return;

    let dataToFilter = sheetData;
    if (selectedCourses.length > 0) {
        const headerRows = sheetData.slice(0, 2);
        const bodyRows = sheetData.slice(2);

        const newFilteredData = bodyRows.map(row => {
            const newRow = row.slice(0, 2); // Keep Date and Classroom No.
            row.slice(2).forEach(cell => {
                const courseName = cell.value.replace(/\s*\d+\s*$/, '').trim();
                if (selectedCourses.includes(courseName)) {
                    newRow.push(cell);
                } else {
                    newRow.push({ value: '' });
                }
            });
            return newRow;
        });
        dataToFilter = [...headerRows, ...newFilteredData];
    } else {
        // If no courses are selected, show all
        dataToFilter = sheetData;
    }

    setFilteredSheetData(dataToFilter);
    router.push('/view/timetable');
};


  const handleBack = () => {
    setSheetData(null);
    setFilteredSheetData(null);
    router.push('/');
  };

  if (isLoading || !sheetData) {
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
        <header className="flex items-center justify-between gap-3 mb-8">
            <div className="flex items-center gap-3">
                <SheetIcon className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline text-slate-800 dark:text-slate-200">SheetSync</h1>
            </div>
          <Button variant="outline" onClick={handleBack}><ArrowLeftIcon /> Back to Home</Button>
        </header>

        <Card className="mb-8 shadow-lg border-none">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="font-headline">Filter Courses</CardTitle>
                  <CardDescription>Select courses to view on the timetable or view all.</CardDescription>
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
              
              {selectedCourses.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 border-t mt-4">
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
               <div className="flex flex-wrap gap-2 pt-4 border-t mt-4">
                <Button onClick={handleViewTimetableClick}>
                  {selectedCourses.length > 0 ? 'View Filtered Timetable' : 'View Full Timetable'}
                </Button>
              </div>
            </CardContent>
        </Card>
        
      </main>
    </div>
  );
}
