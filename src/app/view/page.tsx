
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SheetIcon, XIcon, ArrowLeftIcon } from 'lucide-react';
import { TimetableDisplay } from '@/components/timetable-display';
import { TimetableSkeleton } from '@/components/timetable-skeleton';
import type { SheetData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/context/app-context';

export default function ViewPage() {
  const { sheetData, setSheetData } = useAppContext();
  const [filteredSheetData, setFilteredSheetData] = useState<SheetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
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
      setFilteredSheetData(sheetData);
    }
  }, [sheetData, router]);

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
      const newRow = row.slice(0, 2);
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

    setFilteredSheetData([...headerRows, ...newFilteredData]);
  };
  
  const clearFilter = () => {
    if (sheetData) {
      setFilteredSheetData(sheetData);
    }
    setSelectedCourses([]);
  };

  const handleBack = () => {
    setSheetData(null);
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
          <Button variant="outline" onClick={handleBack}><ArrowLeftIcon /> Back</Button>
        </header>

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

        <div className="transition-opacity duration-500">
          <TimetableDisplay data={filteredSheetData} />
        </div>
        
      </main>
    </div>
  );
}
